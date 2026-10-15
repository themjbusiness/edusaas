"""JSON API for the student, teacher and parent apps.

Every query is scoped by relationship, never by an id the client sends alone:
a teacher only reaches classes they are assigned to, a student only their own records,
a parent only their own children.
"""
import math
import random
import statistics
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date

from . import notify, push
from .auth import ApiError, api, issue_token, normalize_phone, request_otp, verify_otp
from .models import (Attendance, Clearance, Lesson, LessonProgress, QuizAttempt, Notification, PushSubscription,
                     SchoolClass, StudentProfile, Subject, SubjectRequest, TeachingAssignment, User)
from .fields import hash_phone

STUDENT, TEACHER, PARENT = (User.STUDENT,), (User.TEACHER,), (User.PARENT,)
COLLEGE_ADMIN = (User.COLLEGE_ADMIN,)
GRADES = {"11": "11th", "12": "12th"}


def visible_lessons(qs=None):
    """Lessons students may see: published and approved by a teacher (drafts too in demo mode)."""
    qs = Lesson.objects.all() if qs is None else qs
    qs = qs.filter(is_published=True)
    if not settings.SHOW_DRAFT_LESSONS:
        qs = qs.filter(review_status=Lesson.APPROVED)
    else:
        qs = qs.exclude(review_status__in=[Lesson.IN_REVIEW, Lesson.REJECTED])
    return qs


def live_subject_ids():
    return set(visible_lessons().values_list("subject_id", flat=True))


def subject_status(subject_id, live=None):
    return "live" if subject_id in (live_subject_ids() if live is None else live) else "coming_soon"


# ---------- serializers ----------

def iso(dt):
    return dt.isoformat() if dt else None


def me_dict(u):
    d = {"id": str(u.id), "name": u.full_name, "role": u.role, "gender": u.gender, "language": u.language,
         "college": u.college.name if u.college else None, "phone": u.phone_number}
    if u.role == User.STUDENT:
        p = u.student
        d.update({"class": str(p.school_class), "roll": p.roll_number, "parentName": p.parent.full_name})
    elif u.role == User.TEACHER:
        d["assignments"] = [assignment_dict(a) for a in u.assignments.select_related("school_class", "subject")]
    elif u.role == User.PARENT:
        d["children"] = [{"id": str(c.user_id), "name": c.user.full_name, "class": str(c.school_class),
                          "roll": c.roll_number} for c in u.children.select_related("user", "school_class")]
    return d


def assignment_dict(a, live=None):
    return {"id": a.id, "class": str(a.school_class), "classId": str(a.school_class_id),
            "subject": a.subject.name, "subjectCode": a.subject.code, "grade": a.subject.grade,
            "subjectStatus": subject_status(a.subject_id, live),
            "students": a.school_class.students.filter(user__is_active=True).count()}


def lesson_summary(l, prog=None):
    duration = l.duration_sec
    return {"id": l.id, "topic": l.topic, "title": l.title, "pages": l.pages, "minutes": max(1, math.ceil(duration / 60)),
            "duration": duration, "audioBytes": l.audio_bytes, "unit": l.unit_number, "unitTitle": l.unit_title,
            "subject": l.subject.name, "subjectCode": l.subject.code, "review": l.review_status,
            "progress": progress_dict(l, prog)}


def lesson_full(l, prog):
    d = lesson_summary(l, prog)
    base = "media/" + l.book + "/"
    d.update({"images": [base + i for i in l.images], "imagesSmall": [base + i for i in (l.images_sm or l.images)],
              "audio": base + l.audio,
              "script": [{"pg": l.pages.index(s["page"]), "x": s["text"], "t": s["start"]} for s in l.sections],
              "urdu": {"audio": base + l.ur_audio, "duration": l.ur_duration_sec, "review": l.ur_review_status,
                       "script": [{"pg": l.pages.index(s["page"]), "x": s["text"], "t": s["start"]} for s in l.ur_sections]}
              if urdu_visible(l) else None})
    return d


def total_secs(l, track="mix"):
    return max(1, math.ceil(l.ur_duration_sec if track == "ur" else l.duration_sec))


def urdu_visible(l):
    """The Urdu narration is shown once a teacher approved it (drafts too in demo mode), like lessons."""
    return bool(l.ur_audio) and (l.ur_review_status == "approved" or settings.SHOW_DRAFT_LESSONS)


def progress_dict(l, prog):
    if prog is None:
        return {"heardShare": 0, "heardShareUr": 0, "unlocked": False, "passed": False, "best": None,
                "heardSecs": [], "heardSecsUr": []}
    mix = round(min(1, len(prog.heard_secs) / total_secs(l)), 3)
    ur = round(min(1, len(prog.heard_secs_ur) / total_secs(l, "ur")), 3) if l.ur_audio else 0
    return {"heardShare": max(mix, ur), "heardShareMix": mix, "heardShareUr": ur, "unlocked": prog.unlocked,
            "passed": prog.passed, "best": prog.best_score, "heardSecs": prog.heard_secs,
            "heardSecsUr": prog.heard_secs_ur}


def clearance_dict(c):
    return {"id": c.id, "student": c.student.full_name, "studentId": str(c.student_id),
            "roll": c.student.student.roll_number,
            "lesson": {"id": c.lesson_id, "topic": c.lesson.topic, "title": c.lesson.title,
                       "subject": c.lesson.subject.name, "subjectCode": c.lesson.subject.code},
            "date": c.attendance.date.isoformat(), "status": c.status, "clearedBy": c.cleared_by,
            "attempts": c.attempts, "best": c.best_score, "lastAttempt": iso(c.last_attempt_at),
            "clearedAt": iso(c.cleared_at), "overrideReason": c.override_reason}


def message_dict(n):
    pushed = n.provider_msg_id[5:].split("/") if n.provider_msg_id.startswith("push:") else None
    return {"id": n.id, "to": n.recipient.full_name if n.recipient else n.recipient_phone, "toRole": n.recipient_role,
            "phone": n.recipient_phone, "channel": n.channel, "type": n.template_type, "body": n.body,
            "status": n.status, "error": n.error, "lesson": n.lesson_id, "at": iso(n.sent_at),
            "student": n.student.full_name, "manual": n.provider_msg_id == "manual",
            "pushed": {"ok": int(pushed[0]), "total": int(pushed[1])} if pushed else None}


# ---------- auth ----------

from django.core.cache import cache

@api(methods=("POST",))
def login(request):
    phone = normalize_phone(request.json.get("phone"))
    pin = request.json.get("pin", "")
    
    # Rate limit check using cache
    attempts_key = f"login_attempts_{phone}"
    lock_key = f"login_lock_{phone}"
    
    if cache.get(lock_key):
        raise ApiError(429, "too_many_attempts", "Account temporarily locked due to too many failed attempts. Try again later.")

    from .fields import hash_phone
    user = User.objects.filter(phone_number_hash=hash_phone(phone)).first()
    if not user:
        raise ApiError(400, "not_registered", "Number not recognized")
    
    if not user.is_active:
        raise ApiError(403, "suspended", "This account is suspended.")

    if not user.check_password(pin):
        attempts = cache.get(attempts_key, 0) + 1
        cache.set(attempts_key, attempts, 3600)
        if attempts >= 5:
            cache.set(lock_key, True, 900)  # Lock for 15 mins
            raise ApiError(429, "too_many_attempts", "Account temporarily locked due to too many failed attempts.")
        raise ApiError(401, "wrong_pin", "Incorrect PIN.")
        
    cache.delete(attempts_key)
    cache.delete(lock_key)
    return {"token": issue_token(user), "me": me_dict(user)}


@api(methods=("POST",))
def otp(request):
    phone = normalize_phone(request.json.get("phone"))
    user, code = request_otp(phone)
    return {"phone": user.phone_number, "demoCode": code}


@api(methods=("POST",))
def verify(request):
    phone = normalize_phone(request.json.get("phone"))
    code = request.json.get("code")
    user = verify_otp(phone, code)
    return {"token": issue_token(user), "me": me_dict(user)}


@api(methods=("POST",))
def setup_pin(request):
    activation_code = request.json.get("activation_code")
    new_pin = request.json.get("new_pin")
    
    if not activation_code or not new_pin or len(new_pin) < 4:
        raise ApiError(400, "bad_request", "Valid activation code and new PIN (min 4 chars) required.")
        
    user = User.objects.filter(activation_code=activation_code).first()
    if not user or not user.is_active:
        raise ApiError(400, "invalid_code", "Invalid activation code.")
        
    user.set_password(new_pin)
    user.activation_code = ""  # Single use
    user.save(update_fields=["password", "activation_code"])
    return {"ok": True}


@api(roles=STUDENT + TEACHER + PARENT + COLLEGE_ADMIN)
def me(request):
    return me_dict(request.user)


@api(methods=("POST",), roles=STUDENT + TEACHER + PARENT + COLLEGE_ADMIN)
def set_language(request):
    """The caller's own app language; for parents it is also the language of their alerts (F23)."""
    lang = request.json.get("language")
    if lang not in ("en", "ur"):
        raise ApiError(400, "bad_request", "Language must be en or ur.")
    request.user.language = lang
    request.user.save(update_fields=["language"])
    return {"language": lang}


@api(methods=("POST",), roles=STUDENT + TEACHER + PARENT + COLLEGE_ADMIN)
def logout_everywhere(request):
    request.user.token_version += 1
    request.user.save(update_fields=["token_version"])
    return {"ok": True}


# ---------- student ----------

def class_subjects(school_class):
    ids = TeachingAssignment.objects.filter(school_class=school_class).values_list("subject_id", flat=True)
    return Subject.objects.filter(id__in=ids)


def student_lessons(user):
    return visible_lessons(Lesson.objects.filter(subject__in=class_subjects(user.student.school_class))) \
        .select_related("subject")


def student_lesson(user, lesson_id):
    lesson = student_lessons(user).filter(id=lesson_id).first()
    if lesson is None:
        raise ApiError(404, "not_found", "This lesson is not part of your course.")
    return lesson


def student_clearances(user):
    week_ago = timezone.now() - timedelta(days=7)
    qs = Clearance.objects.filter(student=user).select_related("lesson__subject", "attendance", "student__student")
    return [clearance_dict(c) for c in qs.order_by("-created_at")
            if c.status in (Clearance.PENDING, Clearance.LOCKED) or (c.cleared_at and c.cleared_at >= week_ago)]


@api(roles=STUDENT)
def student_home(request):
    u = request.user
    lessons = list(student_lessons(u))
    progress = {p.lesson_id: p for p in LessonProgress.objects.filter(student=u)}
    clearances = student_clearances(u)
    subjects, order = [], {}
    for s in class_subjects(u.student.school_class):
        order[s.code] = s.sort_order
        mine = [l for l in lessons if l.subject_id == s.id]
        subjects.append({"code": s.code, "name": s.name, "grade": s.grade,
                         "status": "live" if mine else "coming_soon", "total": len(mine),
                         "done": sum(1 for l in mine if progress.get(l.id) and progress[l.id].passed),
                         "pending": sum(1 for c in clearances if c["status"] in (Clearance.PENDING, Clearance.LOCKED)
                                        and c["lesson"]["subjectCode"] == s.code)})
    subjects.sort(key=lambda x: (x["status"] != "live", order[x["code"]]))  # subjects with content first
    grade = u.student.school_class.grade
    nxt = {"11th": "12th"}.get(grade)  # the Library shows next year's subjects as "Coming soon"
    upcoming = {"grade": nxt, "subjects": list(Subject.objects.filter(grade=nxt).exclude(code__isnull=True)
                                               .values_list("name", flat=True))} if nxt else None
    return {"me": me_dict(u), "subjects": subjects, "nextGrade": upcoming,
            "lessons": [lesson_summary(l, progress.get(l.id)) for l in lessons],
            "clearances": clearances}


@api(roles=STUDENT)
def student_subject(request, code):
    """One subject's units and topics. Only subjects taught to the student's class."""
    u = request.user
    subject = class_subjects(u.student.school_class).filter(code=code).first()
    if subject is None:
        raise ApiError(404, "not_found", "This subject is not part of your course.")
    lessons = list(student_lessons(u).filter(subject=subject))
    progress = {p.lesson_id: p for p in LessonProgress.objects.filter(student=u, lesson__in=lessons)}
    missed = set(Clearance.objects.filter(student=u, status__in=(Clearance.PENDING, Clearance.LOCKED)).values_list("lesson_id", flat=True))
    units = {x.number: {"number": x.number, "title": x.title, "lessons": []} for x in subject.units.all()}
    for l in lessons:
        units.setdefault(l.unit_number, {"number": l.unit_number, "title": l.unit_title, "lessons": []})
        units[l.unit_number]["lessons"].append(dict(lesson_summary(l, progress.get(l.id)), missed=l.id in missed))
    rows = [dict(v, status="live" if v["lessons"] else "coming_soon") for _, v in sorted(units.items())]
    return {"subject": {"code": subject.code, "name": subject.name, "grade": subject.grade,
                        "status": "live" if lessons else "coming_soon"}, "units": rows}


@api(roles=STUDENT)
def lesson_detail(request, lesson_id):
    lesson = student_lesson(request.user, lesson_id)
    prog, _ = LessonProgress.objects.get_or_create(student=request.user, lesson=lesson)
    pending = Clearance.objects.filter(student=request.user, lesson=lesson, status__in=(Clearance.PENDING, Clearance.LOCKED)).exists()
    d = lesson_full(lesson, prog)
    d["missed"] = pending
    return d


def _lesson_progress(user, lesson_id, secs, track):
    lesson = student_lesson(user, lesson_id)
    if not isinstance(secs, list) or not all(isinstance(s, int) for s in secs):
        raise ApiError(400, "bad_request", "secs must be a list of whole seconds.")
    if track not in ("mix", "ur") or (track == "ur" and not urdu_visible(lesson)):
        raise ApiError(400, "bad_request", "Unknown narration track.")
    limit = total_secs(lesson, track)
    field = "heard_secs_ur" if track == "ur" else "heard_secs"
    with transaction.atomic():
        prog, _ = LessonProgress.objects.select_for_update().get_or_create(student=user, lesson=lesson)
        heard = set(getattr(prog, field))
        new = {s for s in secs if 0 <= s <= limit} - heard
        # Plausibility: no more new seconds than could have been played since the last report (1.5x speed + slack).
        elapsed = (timezone.now() - prog.updated_at).total_seconds()
        allowed = int(elapsed * 1.6) + 5
        if len(new) > allowed:
            new = set(sorted(new)[:allowed])
        heard |= new
        setattr(prog, field, sorted(heard))
        # Hearing 90% of either narration unlocks the quiz (F12).
        if not prog.unlocked and len(heard) / limit >= settings.UNLOCK_SHARE:
            prog.unlocked = True
        prog.save()
    return progress_dict(lesson, prog)

@api(methods=("POST",), roles=STUDENT)
def lesson_progress(request, lesson_id):
    """Merge seconds of narration the player reports as played. The server decides when the quiz unlocks."""
    secs, track = request.json.get("secs"), request.json.get("track") or "mix"
    return _lesson_progress(request.user, lesson_id, secs, track)


@api(methods=("POST",), roles=STUDENT)
def quiz_start(request, lesson_id):
    lesson = student_lesson(request.user, lesson_id)
    prog = LessonProgress.objects.filter(student=request.user, lesson=lesson).first()
    if not prog or not prog.unlocked:
        raise ApiError(403, "quiz_locked", "Listen to at least 90% of the lesson to unlock the quiz.")
    
    # Check if clearance is locked due to 3 failed attempts
    clearance = Clearance.objects.filter(student=request.user, lesson=lesson).first()
    if clearance and clearance.status == Clearance.LOCKED:
        raise ApiError(403, "locked", "Maximum attempts reached. Please consult your teacher for assistance.")
    
    past_attempts = QuizAttempt.objects.filter(student=request.user, lesson=lesson, submitted_at__isnull=False).order_by("-submitted_at")
    attempt_count = past_attempts.count()
    if attempt_count >= 3 and not (prog and prog.passed):
        raise ApiError(403, "max_attempts", "Maximum attempts reached. Please consult your teacher.")
    
    last = past_attempts.first()
    now = timezone.now()
    if last and not last.passed:
        cooldown = getattr(settings, "QUIZ_RETRY_COOLDOWN", 600)
        cooldown_until = last.cooldown_until or (last.submitted_at + timedelta(seconds=cooldown))
        if now < cooldown_until:
            wait = int((cooldown_until - now).total_seconds())
            raise ApiError(429, "cooldown", f"Review the lesson for a moment. You can retry in {wait} seconds.")
    
    pool = lesson.quiz
    seen_q_indices = set()
    if last and last.questions:
        seen_q_indices = {x["q"] for x in last.questions}
    unseen_pool = [i for i in range(len(pool)) if i not in seen_q_indices]
    quiz_size = min(settings.QUIZ_SIZE, len(pool))
    
    if len(unseen_pool) >= quiz_size:
        picked = random.sample(unseen_pool, quiz_size)
    else:
        remaining = [i for i in range(len(pool)) if i not in unseen_pool]
        picked = unseen_pool + random.sample(remaining, quiz_size - len(unseen_pool))
    
    questions = [{"q": i, "order": random.sample(range(len(pool[i]["options"])), len(pool[i]["options"]))}
                 for i in picked]
    attempt = QuizAttempt.objects.create(
        student=request.user,
        lesson=lesson,
        questions=questions,
        attempt_number=attempt_count + 1
    )
    return {"attempt": str(attempt.id), "attemptNumber": attempt.attempt_number, "maxAttempts": 3,
            "passMark": settings.PASS_MARK, "size": len(questions),
            "lesson": {"id": lesson.id, "topic": lesson.topic, "title": lesson.title, "subject": lesson.subject.name},
            # No answers and no explanations are sent until the attempt is submitted.
            "questions": [{"question": pool[x["q"]]["question"],
                           "options": [pool[x["q"]]["options"][k] for k in x["order"]]} for x in questions]}


def _quiz_submit(user, attempt_id, answers):
    with transaction.atomic():
        attempt = QuizAttempt.objects.select_for_update().select_related("lesson__subject") \
            .filter(id=attempt_id, student=user).first()
        if attempt is None:
            raise ApiError(404, "not_found", "Quiz not found.")
        if attempt.submitted_at:
            raise ApiError(409, "already_submitted", "This quiz was already submitted.")
        if not isinstance(answers, list) or len(answers) != len(attempt.questions):
            raise ApiError(400, "bad_request", "Answer every question.")
        
        lesson, pool, review, score = attempt.lesson, attempt.lesson.quiz, [], 0
        missed_sections = []
        sections = lesson.sections or []
        for x, chosen in zip(attempt.questions, answers):
            item = pool[x["q"]]
            correct_shown = x["order"].index(item["answer"])
            ok = isinstance(chosen, int) and chosen == correct_shown
            score += ok
            review.append({"question": item["question"], "options": [item["options"][k] for k in x["order"]],
                           "chosen": chosen, "correct": correct_shown, "ok": ok, "explanation": item["explanation"]})
            if not ok:
                s_idx = item.get("section")
                if s_idx is None or s_idx >= len(sections):
                    s_idx = x["q"] % len(sections) if sections else 0
                if sections:
                    sec = sections[s_idx]
                    sec_info = {
                        "sectionIndex": s_idx,
                        "page": sec.get("page", 0),
                        "text": sec.get("text", "")[:120] + "...",
                        "start": sec.get("start", 0),
                    }
                    if sec_info not in missed_sections:
                        missed_sections.append(sec_info)
        
        passed = score >= settings.PASS_MARK
        now = timezone.now()
        attempt.answers, attempt.score, attempt.passed, attempt.submitted_at = answers, score, passed, now
        attempt.missed_sections = missed_sections
        if not passed:
            cooldown_secs = getattr(settings, "QUIZ_RETRY_COOLDOWN", 600)
            attempt.cooldown_until = now + timedelta(seconds=cooldown_secs)
        attempt.save()

        prog = LessonProgress.objects.select_for_update().get(student=user, lesson=lesson)
        prog.best_score = max(prog.best_score or 0, score)
        prog.passed = prog.passed or passed
        prog.save()

        cleared_now = False
        pending = list(Clearance.objects.select_for_update().filter(student=user, lesson=lesson,
                                                                    status__in=[Clearance.PENDING, Clearance.LOCKED]))
        for c in pending:
            c.attempts += 1
            c.best_score = max(c.best_score or 0, score)
            c.last_attempt_at = now
            if passed:
                c.status, c.cleared_by, c.cleared_at = Clearance.CLEARED, "quiz", now
                cleared_now = True
            elif c.attempts >= 3:
                c.status = Clearance.LOCKED
            c.save()

    if cleared_now:
        profile = user.student
        teachers = [a.teacher for a in TeachingAssignment.objects.filter(
            school_class=profile.school_class, subject=lesson.subject).select_related("teacher")]
        notify.clearance_granted(user, profile.parent, teachers, lesson, score)
    
    attempts = pending[0].attempts if pending else QuizAttempt.objects.filter(
        student=user, lesson=lesson, submitted_at__isnull=False).count()
    is_locked = any(c.status == Clearance.LOCKED for c in pending) or (attempts >= 3 and not passed)
    cooldown_left = int((attempt.cooldown_until - now).total_seconds()) if attempt.cooldown_until and not passed else 0

    return {"score": score, "size": len(review), "passMark": settings.PASS_MARK, "passed": passed,
            "cleared": cleared_now, "attempts": attempts, "attemptNumber": attempt.attempt_number,
            "maxAttempts": 3, "locked": is_locked, "review": review, "missedSections": missed_sections,
            "retryAfter": 0 if passed else cooldown_left,
            "cooldownUntil": iso(attempt.cooldown_until)}


@api(methods=("POST",), roles=STUDENT)
def quiz_submit(request, attempt_id):
    answers = request.json.get("answers")
    return _quiz_submit(request.user, attempt_id, answers)


@api(roles=STUDENT)
def lesson_remediation(request, lesson_id):
    """Returns missed sections, remaining cooldown, and attempt stats for mastery remediation (F9)."""
    lesson = student_lesson(request.user, lesson_id)
    prog = LessonProgress.objects.filter(student=request.user, lesson=lesson).first()
    clearance = Clearance.objects.filter(student=request.user, lesson=lesson).first()
    
    attempts_qs = QuizAttempt.objects.filter(student=request.user, lesson=lesson, submitted_at__isnull=False).order_by("-submitted_at")
    attempt_count = attempts_qs.count()
    last_attempt = attempts_qs.first()
    
    now = timezone.now()
    cooldown_left = 0
    if last_attempt and not last_attempt.passed and last_attempt.cooldown_until:
        if now < last_attempt.cooldown_until:
            cooldown_left = int((last_attempt.cooldown_until - now).total_seconds())
            
    is_locked = (clearance.status == Clearance.LOCKED) if clearance else (attempt_count >= 3 and not (prog and prog.passed))
    
    return {
        "lesson": {"id": lesson.id, "title": lesson.title, "topic": lesson.topic, "subject": lesson.subject.name},
        "attemptCount": attempt_count,
        "maxAttempts": 3,
        "locked": is_locked,
        "passed": bool(prog and prog.passed),
        "lastScore": last_attempt.score if last_attempt else None,
        "bestScore": prog.best_score if prog else None,
        "cooldownSecondsLeft": cooldown_left,
        "cooldownUntil": iso(last_attempt.cooldown_until) if last_attempt else None,
        "missedSections": last_attempt.missed_sections if last_attempt else [],
    }


@api(methods=("POST",), roles=STUDENT)
def sync_offline(request):
    """Sync offline actions (progress updates and quiz submissions) queued in the PWA."""
    actions = request.json.get("actions") or []
    synced = 0
    
    for action in actions:
        action_type = action.get("type")
        payload = action.get("payload")
        
        try:
            if action_type == "progress_update":
                lesson_id = payload.get("lesson_id")
                secs = payload.get("secs")
                track = payload.get("track")
                _lesson_progress(request.user, lesson_id, secs, track)
                synced += 1
                
            elif action_type == "quiz_submission":
                attempt_id = payload.get("attempt_id")
                answers = payload.get("answers")
                _quiz_submit(request.user, attempt_id, answers)
                synced += 1
        except Exception as e:
            # If a specific action fails (like already submitted), we log and continue
            print(f"Failed to sync offline action {action.get('id')}: {e}")
            pass
            
    return {"synced": synced, "total": len(actions)}

# ---------- teacher ----------

def teacher_assignment(user, assignment_id):
    a = TeachingAssignment.objects.select_related("school_class", "subject").filter(id=assignment_id,
                                                                                    teacher=user).first()
    if a is None:
        raise ApiError(404, "not_found", "You are not assigned to this class.")
    return a


def whatsapp_link(c):
    """What the teacher sends by hand from their own WhatsApp (F3, free). Only for today's pending absences."""
    if c.status != Clearance.PENDING or c.attendance.date != timezone.localdate():
        return None
    parent = c.student.student.parent
    return {"phone": parent.phone_number.lstrip("+"), "parent": parent.full_name,
            "text": notify.absence_text(c.student, c.attendance.subject, c.attendance.school_class, c.lesson,
                                        notify.lang_of(parent)),
            "notifiedAt": iso(c.parent_notified_at)}


def class_clearances(school_class):
    week_ago = timezone.now() - timedelta(days=7)
    qs = Clearance.objects.filter(attendance__school_class=school_class) \
        .select_related("lesson__subject", "attendance__subject", "attendance__school_class", "student__student__parent") \
        .order_by("status", "-created_at")
    return [dict(clearance_dict(c), whatsapp=whatsapp_link(c)) for c in qs
            if c.status in (Clearance.PENDING, Clearance.LOCKED) or (c.cleared_at and c.cleared_at >= week_ago)]


@api(roles=TEACHER)
def teacher_assignments(request):
    live = live_subject_ids()
    qs = request.user.assignments.select_related("school_class", "subject") \
        .order_by("school_class__grade", "school_class__stream", "school_class__section", "subject__sort_order")
    return [assignment_dict(a, live) for a in qs]


@api(roles=TEACHER + COLLEGE_ADMIN)
def catalogue(request):
    grade = GRADES.get(request.GET.get("grade", ""))
    if grade is None:
        raise ApiError(400, "bad_grade", "Choose grade 11 or 12.")
    live = live_subject_ids()
    # With a classId the teacher teaches, say which subjects that class already has (by any teacher).
    cls = SchoolClass.objects.filter(id=_uuid(request.GET.get("classId")), assignments__teacher=request.user).first()         if request.GET.get("classId") else None
    taken = set(TeachingAssignment.objects.filter(school_class=cls).values_list("subject_id", flat=True)) if cls else set()
    return [{"code": s.code, "name": s.name, "grade": s.grade, "status": subject_status(s.id, live),
             "inClass": s.id in taken} for s in Subject.objects.filter(grade=grade).exclude(code__isnull=True)]


def subject_request_dict(r, live=None):
    return {"id": r.id, "classId": str(r.school_class_id), "class": str(r.school_class),
            "subject": {"code": r.subject.code, "name": r.subject.name, "status": subject_status(r.subject_id, live)},
            "status": r.status, "note": r.note, "createdAt": iso(r.created_at), "decidedAt": iso(r.decided_at)}


@api(methods=("GET", "POST"), roles=TEACHER)
def teacher_subject_requests(request):
    """A teacher asks for a subject on a class they already teach; the college admin decides (D4)."""
    u = request.user
    if request.method == "GET":
        live = live_subject_ids()
        qs = u.subject_requests.select_related("school_class", "subject")
        return [subject_request_dict(r, live) for r in qs]
    cls = SchoolClass.objects.filter(id=_uuid(request.json.get("classId")), assignments__teacher=u).distinct().first()
    if cls is None:
        raise ApiError(403, "not_your_class", "You can only ask for subjects in classes you teach.")
    subject = Subject.objects.filter(code=request.json.get("subject")).first()
    if subject is None:
        raise ApiError(404, "not_found", "This subject is not in the catalogue.")
    if subject.grade != cls.grade:
        raise ApiError(400, "wrong_grade", f"{subject.name} ({subject.grade}) is not taught in {cls.grade} classes.")
    if TeachingAssignment.objects.filter(school_class=cls, subject=subject).exists():
        raise ApiError(409, "already_taught", f"{cls} already has {subject.name}.")
    if SubjectRequest.objects.filter(school_class=cls, subject=subject, status=SubjectRequest.PENDING).exists():
        raise ApiError(409, "already_requested", f"{subject.name} for {cls} is already waiting for the college admin.")
    r = SubjectRequest.objects.create(teacher=u, school_class=cls, subject=subject)
    return subject_request_dict(r)


def _uuid(value):
    import uuid
    try:
        return uuid.UUID(str(value))
    except ValueError:
        return None


@api(roles=TEACHER)
def teacher_class(request, assignment_id):
    a = teacher_assignment(request.user, assignment_id)
    day = parse_date(request.GET.get("date", "")) or timezone.localdate()
    marks = {x.student_id: x for x in Attendance.objects.filter(school_class=a.school_class, subject=a.subject, date=day)}
    students = StudentProfile.objects.filter(school_class=a.school_class, user__is_active=True) \
        .select_related("user", "parent")
    lessons = visible_lessons(Lesson.objects.filter(subject=a.subject))
    topic = next((m.lesson_id for m in marks.values() if m.lesson_id), None)
    failed = {n.student_id for n in Notification.objects.filter(
        student__student__school_class=a.school_class, recipient_role="parent", sent_at__date=day, status="failed")}
    return {"assignment": assignment_dict(a), "date": day.isoformat(), "submitted": bool(marks), "topic": topic,
            "lessons": [{"id": l.id, "topic": l.topic, "title": l.title} for l in lessons],
            "students": [{"id": str(p.user_id), "name": p.user.full_name, "roll": p.roll_number,
                          "status": marks[p.user_id].status if p.user_id in marks else None,
                          "parent": {"name": p.parent.full_name, "phone": p.parent.phone_number},
                          "whatsappFailed": p.user_id in failed} for p in students],
            "clearances": class_clearances(a.school_class)}


@api(methods=("POST",), roles=TEACHER)
def teacher_attendance(request, assignment_id):
    a = teacher_assignment(request.user, assignment_id)
    body = request.json
    lesson = visible_lessons(Lesson.objects.filter(id=body.get("lesson"), subject=a.subject)).first()
    if lesson is None:
        raise ApiError(400, "bad_request", "Choose the topic you taught today.")
    statuses = body.get("statuses") or {}
    roster = {str(p.user_id): p for p in StudentProfile.objects.filter(school_class=a.school_class,
                                                                       user__is_active=True).select_related("user", "parent")}
    unknown = set(statuses) - set(roster)
    if unknown:
        raise ApiError(400, "bad_request", "Some students are not in this class.")
    if any(v not in (Attendance.PRESENT, Attendance.ABSENT, Attendance.LATE) for v in statuses.values()):
        raise ApiError(400, "bad_request", "Status must be present, absent or late.")
    today = timezone.localdate()
    alerts = []
    with transaction.atomic():
        for sid, profile in roster.items():
            status = statuses.get(sid, Attendance.PRESENT)
            att, _ = Attendance.objects.update_or_create(
                student=profile.user, subject=a.subject, date=today,
                defaults={"school_class": a.school_class, "status": status, "lesson": lesson, "marked_by": request.user})
            existing = Clearance.objects.filter(attendance=att).first()
            if status == Attendance.ABSENT:
                if existing is None:
                    Clearance.objects.create(student=profile.user, lesson=lesson, attendance=att)
                    alerts.append(profile)
                elif existing.status == Clearance.PENDING and existing.attempts == 0 and existing.lesson_id != lesson.id:
                    existing.lesson = lesson  # teacher corrected the topic before the student started
                    existing.save(update_fields=["lesson"])
            elif existing and existing.status == Clearance.PENDING and existing.attempts == 0:
                existing.delete()  # the student was marked absent by mistake
    for profile in alerts:
        notify.absence_alert(profile.user, profile.parent, a.subject, a.school_class, lesson)
    return {"saved": len(roster), "absent": sum(1 for v in statuses.values() if v == Attendance.ABSENT),
            "alertsSent": len(alerts)}


@api(methods=("POST",), roles=TEACHER)
def teacher_override(request, clearance_id):
    c = Clearance.objects.select_related("attendance", "lesson", "student__student__parent").filter(id=clearance_id).first()
    if c is None or not TeachingAssignment.objects.filter(teacher=request.user,
                                                          school_class=c.attendance.school_class).exists():
        raise ApiError(404, "not_found", "Clearance not found.")
    reason = (request.json.get("reason") or "").strip()
    if len(reason) < 3:
        raise ApiError(400, "reason_required", "Give a reason, for example 'Medical certificate provided'.")
    if c.status in (Clearance.CLEARED, Clearance.OVERRIDE):
        raise ApiError(409, "already_cleared", "This student is already cleared.")
    c.status, c.cleared_by, c.cleared_at = Clearance.OVERRIDE, "teacher", timezone.now()
    c.override_by, c.override_reason = request.user, reason[:200]
    c.save()
    LessonProgress.objects.update_or_create(
        student=c.student, lesson=c.lesson,
        defaults={"unlocked": True, "passed": True}
    )
    notify.clearance_override(c.student, c.student.student.parent, c.lesson)
    return clearance_dict(c)


@api(methods=("POST",), roles=TEACHER)
def teacher_whatsapp_sent(request, clearance_id):
    """The teacher sent the absence message from their own WhatsApp (one tap). Recorded for the log."""
    c = Clearance.objects.select_related("attendance__subject", "attendance__school_class", "lesson",
                                        "student__student__parent").filter(id=clearance_id).first()
    if c is None or not TeachingAssignment.objects.filter(teacher=request.user,
                                                          school_class=c.attendance.school_class).exists():
        raise ApiError(404, "not_found", "Clearance not found.")
    if c.parent_notified_at is None:
        c.parent_notified_at = timezone.now()
        c.save(update_fields=["parent_notified_at"])
        parent = c.student.student.parent
        Notification.objects.create(
            student=c.student, recipient=parent, recipient_phone=parent.phone_number, recipient_role="parent",
            channel="whatsapp", template_type="absence_alert", lesson=c.lesson, status="sent", provider_msg_id="manual",
            body=notify.absence_text(c.student, c.attendance.subject, c.attendance.school_class, c.lesson,
                                     notify.lang_of(parent)))
    return {"id": c.id, "notifiedAt": iso(c.parent_notified_at)}


@api(methods=("POST",), roles=TEACHER)
def teacher_parent_phone(request, student_id):
    """Fix a wrong parent number (blueprint edge case: WhatsApp failed because the register was wrong)."""
    profile = StudentProfile.objects.select_related("parent", "school_class").filter(user_id=student_id).first()
    if profile is None or not TeachingAssignment.objects.filter(teacher=request.user,
                                                                school_class=profile.school_class).exists():
        raise ApiError(404, "not_found", "Student not found in your classes.")
    phone = normalize_phone(request.json.get("phone"))
    if User.objects.filter(phone_number_hash=hash_phone(phone)).exclude(id=profile.parent_id).exists():
        raise ApiError(409, "phone_taken", "This number already belongs to another account.")
    parent = profile.parent
    parent.phone_number = phone
    parent.token_version += 1  # the old number can no longer be used to log in
    parent.save(update_fields=["phone_number", "token_version"])
    return {"parent": {"name": parent.full_name, "phone": parent.phone_number}}


# ---------- parent ----------

def lesson_state(prog):
    if prog and prog.passed:
        return "passed"
    if prog and prog.unlocked:
        return "quiz_ready"
    if prog and prog.heard_secs:
        return "listening"
    return "not_started"


def _avg(scores):
    scores = [x for x in scores if x is not None]
    return round(sum(scores) / len(scores), 1) if scores else None


def child_progress(student):
    """Progress numbers for one student, as shown to their parent (F21). Same rules as the student's own view."""
    cls = student.student.school_class
    lessons = list(student_lessons(student))
    progress = {p.lesson_id: p for p in LessonProgress.objects.filter(student=student)}
    best = {l.id: progress[l.id].best_score for l in lessons if l.id in progress}
    subjects = []
    for s in class_subjects(cls):
        mine = [l for l in lessons if l.subject_id == s.id]
        subjects.append({"code": s.code, "name": s.name, "status": "live" if mine else "coming_soon", "total": len(mine),
                         "done": sum(1 for l in mine if l.id in progress and progress[l.id].passed),
                         "avgScore": _avg(best.get(l.id) for l in mine), "order": s.sort_order})
    subjects.sort(key=lambda x: (x["status"] != "live", x.pop("order")))
    today = timezone.localdate()
    att = Attendance.objects.filter(student=student, date__gte=today - timedelta(days=30))
    total = att.count()
    present = att.filter(status__in=(Attendance.PRESENT, Attendance.LATE)).count()
    cleared = Clearance.objects.filter(student=student, status__in=(Clearance.CLEARED, Clearance.OVERRIDE),
                                       cleared_at__gte=timezone.now() - timedelta(days=90)).select_related("attendance")
    days = [(timezone.localtime(c.cleared_at).date() - c.attendance.date).days for c in cleared]
    median = statistics.median(days) if days else None
    if isinstance(median, float) and median.is_integer():
        median = int(median)
    last = [x for x in (LessonProgress.objects.filter(student=student).order_by("-updated_at")
                        .values_list("updated_at", flat=True).first(),
                        QuizAttempt.objects.filter(student=student, submitted_at__isnull=False).order_by("-submitted_at")
                        .values_list("submitted_at", flat=True).first()) if x]
    return {"subjects": subjects, "summary": {
        "attendanceRate30d": round(present * 100 / total) if total else None,
        "attendanceClasses30d": {"present": present, "total": total},
        "topicsDone": sum(x["done"] for x in subjects), "topicsTotal": len(lessons),
        "avgScore": _avg(best.values()), "medianDaysToClear": median, "lastActive": iso(max(last)) if last else None}}


def own_child(parent, student_id):
    profile = parent.children.select_related("user", "school_class").filter(user_id=_uuid(student_id)).first()
    if profile is None:
        raise ApiError(404, "not_found", "Child not found.")
    return profile


@api(roles=PARENT)
def parent_home(request):
    children = []
    for p in request.user.children.select_related("user", "school_class"):
        recent = Attendance.objects.filter(student=p.user).order_by("-date")[:10]
        children.append(dict({"id": str(p.user_id), "name": p.user.full_name, "class": str(p.school_class),
                              "roll": p.roll_number, "clearances": student_clearances(p.user),
                              "attendance": [{"date": x.date.isoformat(), "status": x.status, "subject": x.subject.name}
                                             for x in recent]}, **child_progress(p.user)))
    return {"me": me_dict(request.user), "children": children, "weeklySummary": request.user.weekly_summary}


@api(roles=PARENT)
def parent_child_subject(request, student_id, code):
    """One subject of the parent's own child: every topic with a plain status. Read-only, no quiz content."""
    profile = own_child(request.user, student_id)
    subject = class_subjects(profile.school_class).filter(code=code).first()
    if subject is None:
        raise ApiError(404, "not_found", "This subject is not part of your child's course.")
    child = profile.user
    lessons = list(student_lessons(child).filter(subject=subject))
    progress = {p.lesson_id: p for p in LessonProgress.objects.filter(student=child, lesson__in=lessons)}
    clr = Clearance.objects.filter(student=child, lesson__in=lessons)
    missed = set(clr.filter(status__in=(Clearance.PENDING, Clearance.LOCKED)).values_list("lesson_id", flat=True))
    cleared = set(clr.filter(status__in=(Clearance.CLEARED, Clearance.OVERRIDE)).values_list("lesson_id", flat=True))
    units = {x.number: {"number": x.number, "title": x.title, "topics": []} for x in subject.units.all()}
    for l in lessons:
        prog = progress.get(l.id)
        units.setdefault(l.unit_number, {"number": l.unit_number, "title": l.unit_title, "topics": []})
        units[l.unit_number]["topics"].append({
            "id": l.id, "topic": l.topic, "title": l.title, "status": lesson_state(prog),
            "heardShare": progress_dict(l, prog)["heardShare"], "best": prog.best_score if prog else None,
            "missed": l.id in missed, "cleared": l.id in cleared and l.id not in missed})
    return {"child": {"id": str(child.id), "name": child.full_name, "class": str(profile.school_class)},
            "subject": {"code": subject.code, "name": subject.name, "status": "live" if lessons else "coming_soon"},
            "passMark": settings.PASS_MARK, "quizSize": settings.QUIZ_SIZE,
            "units": [dict(v, status="live" if v["topics"] else "coming_soon") for _, v in sorted(units.items())]}


@api(methods=("POST",), roles=PARENT)
def parent_settings(request):
    value = request.json.get("weeklySummary")
    if not isinstance(value, bool):
        raise ApiError(400, "bad_request", "weeklySummary must be true or false.")
    request.user.weekly_summary = value
    request.user.save(update_fields=["weekly_summary"])
    return {"weeklySummary": value}


# ---------- messages ----------

@api(roles=TEACHER + PARENT)
def messages(request):
    u = request.user
    if u.role == User.PARENT:
        qs = Notification.objects.filter(recipient=u)
    else:
        classes = u.assignments.values_list("school_class_id", flat=True)
        qs = Notification.objects.filter(student__student__school_class_id__in=classes)
    return [message_dict(n) for n in qs.select_related("recipient", "student").order_by("sent_at")]


# ---------- web push (F3) ----------

EVERYONE = STUDENT + TEACHER + PARENT + COLLEGE_ADMIN


@api(roles=EVERYONE)
def push_key(request):
    return {"publicKey": push.public_key()}


@api(methods=("POST",), roles=EVERYONE)
def push_subscribe(request):
    b = request.json
    endpoint, keys = str(b.get("endpoint") or ""), b.get("keys") or {}
    if not endpoint.startswith("https://") or len(endpoint) > 1000 or not isinstance(keys, dict) \
            or not keys.get("p256dh") or not keys.get("auth"):
        raise ApiError(400, "bad_request", "This browser sent an invalid subscription.")
    # A browser belongs to whoever is signed in on it now.
    PushSubscription.objects.update_or_create(endpoint=endpoint, defaults={
        "user": request.user, "p256dh": str(keys["p256dh"])[:200], "auth": str(keys["auth"])[:100],
        "user_agent": request.headers.get("User-Agent", "")[:200]})
    return {"subscribed": True, "devices": request.user.push_subscriptions.count()}


@api(methods=("POST",), roles=EVERYONE)
def push_unsubscribe(request):
    deleted, _ = PushSubscription.objects.filter(user=request.user, endpoint=str(request.json.get("endpoint") or "")).delete()
    return {"removed": deleted}


# ---------- demo helper ----------

@api()
def demo_accounts(request):
    """Presenter aid, only in demo mode: the registered demo accounts. Disabled in production."""
    if not settings.DEMO_MODE:
        raise ApiError(404, "not_found", "Not found.")
    rows = []
    for u in User.objects.filter(role__in=(User.COLLEGE_ADMIN, User.TEACHER, User.STUDENT, User.PARENT), is_active=True) \
            .select_related("student__school_class").order_by("role", "phone_number"):
        note = ""
        if u.role == User.STUDENT:
            note = str(u.student.school_class)
        elif u.role == User.TEACHER:
            note = ", ".join(str(a.school_class) for a in u.assignments.select_related("school_class"))
        elif u.role == User.COLLEGE_ADMIN:
            note = "college admin, " + u.college.name
        elif u.role == User.PARENT:
            note = "parent of " + ", ".join(c.user.full_name for c in u.children.select_related("user"))
        rows.append({"name": u.full_name, "role": u.role, "phone": u.phone_number, "note": note})
    return rows
