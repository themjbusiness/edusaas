import json
import os
from datetime import timedelta
from unittest import mock

from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from .models import Clearance, LessonProgress, Notification, OTPCode, User
from .fields import hash_phone

A_TEACHER, B_TEACHER = "+923991110001", "+923991110002"
ALI, SAAD = "+923992220001", "+923992220011"
ALI_PARENT, SAAD_PARENT, BILAL_PARENT = "+923993330001", "+923993330011", "+923993330003"
LESSON = "u1-estimation"


class ApiBase(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo", admin_password="x" * 12, stdout=open("nul" if __import__("os").name == "nt" else "/dev/null", "w"))

    def call(self, method, url, body=None, token=None):
        kw = {"content_type": "application/json"}
        if token:
            kw["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        fn = getattr(self.client, method)
        resp = fn("/api/" + url, data=json.dumps(body) if body is not None else None, **kw)
        return resp.status_code, resp.json()

    def login(self, phone):
        from .fields import hash_phone
        user = User.objects.get(phone_number_hash=hash_phone(phone))
        user.set_password("1234")
        user.save(update_fields=["password"])
        status, data = self.call("post", "auth/login", {"phone": phone, "pin": "1234"})
        self.assertEqual(status, 200, data)
        return data["token"]


class Api(ApiBase):
    def mark_absent(self, token, *names, lesson=LESSON):
        status, assignments = self.call("get", "teacher/assignments", token=token)
        aid = assignments[0]["id"]
        _, cls = self.call("get", f"teacher/assignments/{aid}", token=token)
        statuses = {s["id"]: ("absent" if s["name"] in names else "present") for s in cls["students"]}
        return self.call("post", f"teacher/assignments/{aid}/attendance",
                         {"lesson": lesson, "statuses": statuses}, token=token)

    def listen_all(self, token, lesson=LESSON):
        prog = LessonProgress.objects.get(student__phone_number_hash=hash_phone(ALI), lesson_id=lesson)
        prog.updated_at = timezone.now() - timedelta(hours=1)  # pretend the student listened for an hour
        LessonProgress.objects.filter(pk=prog.pk).update(updated_at=prog.updated_at)
        return self.call("post", f"lessons/{lesson}/progress", {"secs": list(range(0, 400))}, token=token)

    # ---- who can log in ----

    def test_unregistered_number_cannot_login(self):
        status, data = self.call("post", "auth/login", {"phone": "3001234567", "pin": "0000"})
        self.assertEqual(status, 400)
        self.assertEqual(data["error"], "not_registered")

    def test_local_formats_are_normalised(self):
        from .fields import hash_phone
        u = User.objects.get(phone_number_hash=hash_phone(ALI))
        u.set_password("1234")
        u.save()
        for raw in ("03992220001", "3992220001", "+92 399 2220001"):
            status, data = self.call("post", "auth/login", {"phone": raw, "pin": "1234"})
            self.assertEqual((status, data.get("me", {}).get("phone")), (200, ALI))

    def test_suspended_user_cannot_log_in(self):
        from .fields import hash_phone
        User.objects.filter(phone_number_hash=hash_phone(ALI)).update(is_active=False)
        status, data = self.call("post", "auth/login", {"phone": ALI, "pin": "1234"})
        self.assertEqual(data["error"], "suspended")

    def test_wrong_pin_then_lockout(self):
        from .fields import hash_phone
        u = User.objects.get(phone_number_hash=hash_phone(ALI))
        u.set_password("1234")
        u.save()
        for _ in range(4):
            status, data = self.call("post", "auth/login", {"phone": ALI, "pin": "0000"})
            self.assertEqual(data["error"], "wrong_pin")
        status, data = self.call("post", "auth/login", {"phone": ALI, "pin": "0000"})
        self.assertEqual(data["error"], "too_many_attempts")
        
    def test_setup_pin(self):
        from .fields import hash_phone
        u = User.objects.get(phone_number_hash=hash_phone(ALI))
        u.activation_code = "ABC12"
        u.save()
        
        status, data = self.call("post", "auth/setup-pin", {"activation_code": "ABC12", "new_pin": "5678"})
        self.assertEqual(status, 200)
        u.refresh_from_db()
        self.assertTrue(u.check_password("5678"))
        self.assertEqual(u.activation_code, "")

    def test_token_revoked_by_logout_everywhere(self):
        t = self.login(ALI)
        self.call("post", "auth/logout-everywhere", token=t)
        self.assertEqual(self.call("get", "me", token=t)[0], 401)

    # ---- who can see what ----

    def test_roles_are_enforced(self):
        student = self.login(ALI)
        self.assertEqual(self.call("get", "teacher/assignments", token=student)[0], 403)
        self.assertEqual(self.call("get", "parent/home", token=student)[0], 403)
        self.assertEqual(self.call("get", "student/home")[0], 401)

    def test_teacher_cannot_open_another_teachers_class(self):
        a, b = self.login(A_TEACHER), self.login(B_TEACHER)
        _, b_assignments = self.call("get", "teacher/assignments", token=b)
        status, _ = self.call("get", f"teacher/assignments/{b_assignments[0]['id']}", token=a)
        self.assertEqual(status, 404)

    def test_teacher_cannot_mark_students_from_other_class(self):
        a = self.login(A_TEACHER)
        _, assignments = self.call("get", "teacher/assignments", token=a)
        saad = str(User.objects.get(phone_number_hash=hash_phone(SAAD)).id)
        status, data = self.call("post", f"teacher/assignments/{assignments[0]['id']}/attendance",
                                 {"lesson": LESSON, "statuses": {saad: "absent"}}, token=a)
        self.assertEqual(status, 400)

    def test_parent_sees_only_own_child_and_messages(self):
        teacher = self.login(A_TEACHER)
        self.mark_absent(teacher, "Ali Raza", "Hamza Khan")
        parent = self.login(ALI_PARENT)
        _, home = self.call("get", "parent/home", token=parent)
        self.assertEqual([c["name"] for c in home["children"]], ["Ali Raza"])
        _, msgs = self.call("get", "messages", token=parent)
        self.assertTrue(msgs and all("Ali Raza" in m["body"] for m in msgs))
        other = self.login(SAAD_PARENT)
        self.assertEqual(self.call("get", "messages", token=other)[1], [])

    def test_student_only_sees_own_course(self):
        t = self.login(SAAD)
        self.assertEqual(self.call("get", f"lessons/{LESSON}", token=t)[0], 200)  # same subject, own class
        self.assertEqual(self.call("get", "lessons/not-a-lesson", token=t)[0], 404)

    # ---- the clearance workflow ----

    def test_absence_creates_clearance_and_alerts_parent(self):
        status, data = self.mark_absent(self.login(A_TEACHER), "Ali Raza")
        self.assertEqual((status, data["alertsSent"]), (200, 1))
        c = Clearance.objects.get(student__phone_number_hash=hash_phone(ALI))
        self.assertEqual(c.status, "pending")
        n = Notification.objects.get(recipient__phone_number_hash=hash_phone(ALI_PARENT))
        self.assertEqual((n.channel, n.status, n.template_type), ("inbox", "delivered", "absence_alert"))

    @override_settings(PAID_MESSAGING=True)
    def test_paid_messaging_uses_whatsapp(self):
        self.mark_absent(self.login(A_TEACHER), "Ali Raza")
        n = Notification.objects.get(recipient__phone_number_hash=hash_phone(ALI_PARENT))
        self.assertEqual((n.channel, n.status, n.template_type), ("whatsapp", "delivered", "absence_alert"))

    @override_settings(PAID_MESSAGING=True)
    def test_logs_never_contain_phone_numbers_or_codes(self):
        with self.assertLogs("lms", level="INFO") as logs:
            import logging
            logging.getLogger("lms").info("marker")
            status, data = self.call("post", "auth/login", {"phone": ALI, "pin": "0000"})
            self.mark_absent(self.login(A_TEACHER), "Bilal Ahmed")  # WhatsApp fails -> warning is logged
        text = "\n".join(logs.output)
        for secret in (ALI, BILAL_PARENT, "3993330003"):
            self.assertNotIn(secret, text)
        self.assertIn("***0003", text)

    @override_settings(PAID_MESSAGING=True)
    def test_whatsapp_failure_falls_back_to_sms(self):
        self.mark_absent(self.login(A_TEACHER), "Bilal Ahmed")
        log = list(Notification.objects.filter(recipient__phone_number_hash=hash_phone(BILAL_PARENT)).values_list("channel", "status"))
        self.assertEqual(log, [("whatsapp", "failed"), ("sms", "delivered")])

    def test_resubmitting_attendance_does_not_duplicate_alerts(self):
        t = self.login(A_TEACHER)
        self.mark_absent(t, "Ali Raza")
        self.mark_absent(t, "Ali Raza")
        self.assertEqual(Notification.objects.filter(recipient__phone_number_hash=hash_phone(ALI_PARENT)).count(), 1)

    def test_marking_present_again_removes_untouched_clearance(self):
        t = self.login(A_TEACHER)
        self.mark_absent(t, "Ali Raza")
        self.mark_absent(t)
        self.assertFalse(Clearance.objects.exists())

    def test_quiz_locked_until_listened_and_progress_is_rate_limited(self):
        t = self.login(ALI)
        self.call("get", f"lessons/{LESSON}", token=t)
        self.assertEqual(self.call("post", f"lessons/{LESSON}/quiz", token=t)[1]["error"], "quiz_locked")
        _, prog = self.call("post", f"lessons/{LESSON}/progress", {"secs": list(range(0, 400))}, token=t)
        self.assertFalse(prog["unlocked"], "posting every second at once must not unlock the quiz")
        _, prog = self.listen_all(t)
        self.assertTrue(prog["unlocked"])

    def test_quiz_never_sends_answers(self):
        t = self.login(ALI)
        self.call("get", f"lessons/{LESSON}", token=t)
        self.listen_all(t)
        _, quiz = self.call("post", f"lessons/{LESSON}/quiz", token=t)
        text = json.dumps(quiz)
        self.assertNotIn("answer", text)
        self.assertNotIn("explanation", text)
        self.assertEqual(len(quiz["questions"]), 5)

    def answer_quiz(self, t, correct):
        _, quiz = self.call("post", f"lessons/{LESSON}/quiz", token=t)
        from .models import Lesson, QuizAttempt
        attempt = QuizAttempt.objects.get(id=quiz["attempt"])
        pool = Lesson.objects.get(id=LESSON).quiz
        answers = []
        for i, x in enumerate(attempt.questions):
            right = x["order"].index(pool[x["q"]]["answer"])
            answers.append(right if i < correct else (right + 1) % 4)
        return self.call("post", f"quiz/{quiz['attempt']}/submit", {"answers": answers}, token=t)

    def test_pass_clears_student_and_notifies_parent_and_teacher(self):
        self.mark_absent(self.login(A_TEACHER), "Ali Raza")
        t = self.login(ALI)
        self.call("get", f"lessons/{LESSON}", token=t)
        self.listen_all(t)
        status, result = self.answer_quiz(t, correct=4)
        self.assertTrue(result["passed"] and result["cleared"])
        c = Clearance.objects.get(student__phone_number_hash=hash_phone(ALI))
        self.assertEqual((c.status, c.cleared_by, c.attempts, c.best_score), ("cleared", "quiz", 1, 4))
        types = set(Notification.objects.filter(template_type="clearance_granted").values_list("recipient_role", flat=True))
        self.assertEqual(types, {"parent", "teacher"})

    def test_fail_keeps_pending_and_enforces_cooldown(self):
        self.mark_absent(self.login(A_TEACHER), "Ali Raza")
        t = self.login(ALI)
        self.call("get", f"lessons/{LESSON}", token=t)
        self.listen_all(t)
        _, result = self.answer_quiz(t, correct=3)
        self.assertFalse(result["passed"])
        self.assertEqual(Clearance.objects.get().status, "pending")
        status, data = self.call("post", f"lessons/{LESSON}/quiz", token=t)
        self.assertEqual((status, data["error"]), (429, "cooldown"))

    def test_quiz_cannot_be_submitted_twice(self):
        t = self.login(ALI)
        self.call("get", f"lessons/{LESSON}", token=t)
        self.listen_all(t)
        _, quiz = self.call("post", f"lessons/{LESSON}/quiz", token=t)
        self.call("post", f"quiz/{quiz['attempt']}/submit", {"answers": [0] * 5}, token=t)
        self.assertEqual(self.call("post", f"quiz/{quiz['attempt']}/submit", {"answers": [0] * 5}, token=t)[0], 409)

    def test_teacher_override_needs_reason_and_own_class(self):
        a = self.login(A_TEACHER)
        self.mark_absent(a, "Ali Raza")
        cid = Clearance.objects.get().id
        self.assertEqual(self.call("post", f"teacher/clearances/{cid}/override", {"reason": ""}, token=a)[0], 400)
        self.assertEqual(self.call("post", f"teacher/clearances/{cid}/override", {"reason": "Medical certificate"},
                                   token=self.login(B_TEACHER))[0], 404)
        status, data = self.call("post", f"teacher/clearances/{cid}/override", {"reason": "Medical certificate"}, token=a)
        self.assertEqual((status, data["clearedBy"]), (200, "teacher"))

    def test_teacher_fixes_wrong_parent_number(self):
        a = self.login(A_TEACHER)
        bilal = User.objects.get(phone_number_hash=hash_phone("+923992220003"))
        status, data = self.call("post", f"teacher/students/{bilal.id}/parent-phone", {"phone": "03993330099"}, token=a)
        self.assertEqual((status, data["parent"]["phone"]), (200, "+923993330099"))
        taken = self.call("post", f"teacher/students/{bilal.id}/parent-phone", {"phone": ALI_PARENT}, token=a)
        self.assertEqual(taken[0], 409)
        other = self.call("post", f"teacher/students/{bilal.id}/parent-phone", {"phone": "03993330098"},
                          token=self.login(B_TEACHER))
        self.assertEqual(other[0], 404)

    @override_settings(MAX_MESSAGES_PER_PARENT_PER_DAY=1, PAID_MESSAGING=True)
    def test_daily_message_limit(self):
        t = self.login(A_TEACHER)
        self.mark_absent(t, "Ali Raza")
        cid = Clearance.objects.get().id
        self.call("post", f"teacher/clearances/{cid}/override", {"reason": "Medical certificate"}, token=t)
        statuses = list(Notification.objects.filter(recipient__phone_number_hash=hash_phone(ALI_PARENT)).values_list("status", flat=True))
        self.assertEqual(statuses, ["delivered", "skipped"])


CHEM_TEACHER = "+923991110003"  # teaches Chemistry and Biology to 11th Pre-Medical A


class Subjects(ApiBase):
    """F20: multiple subjects, the "Add subject" request and Grade 12 "Coming soon"."""

    def subjects(self, token):
        _, home = self.call("get", "student/home", token=token)
        return {s["code"]: s for s in home["subjects"]}

    def chem_lesson(self, review="approved"):
        from .models import Lesson, Subject, Unit
        chem = Subject.objects.get(code="chem11")
        unit, _ = Unit.objects.get_or_create(subject=chem, number=1, defaults={"title": "Stoichiometry"})
        src = Lesson.objects.get(id=LESSON)
        return Lesson.objects.create(
            id="chem11-test", subject=chem, unit=unit, book="chem11", unit_number=1, unit_title=unit.title,
            topic="1.1", title="Mole and Avogadro's number", pages=[1], images=["pages/p1.webp"],
            audio="lessons/x/audio.mp3", audio_bytes=1, duration_sec=60, sections=[{"page": 1, "text": "x", "start": 0}],
            quiz=src.quiz, review_status=review)

    def assignment(self, token, subject):
        _, rows = self.call("get", "teacher/assignments", token=token)
        return next(a for a in rows if a["subject"] == subject)

    # 1, 12: subjects on the student home, with "Coming soon" when there is no content
    def test_student_home_lists_every_subject_of_the_class(self):
        subs = self.subjects(self.login(ALI))
        self.assertEqual(set(subs), {"phy11", "chem11", "bio11"})
        self.assertEqual((subs["phy11"]["status"], subs["phy11"]["done"], subs["phy11"]["total"]), ("live", 0, 3))
        self.assertEqual((subs["chem11"]["status"], subs["chem11"]["total"]), ("coming_soon", 0))
        self.chem_lesson()
        self.assertEqual(self.subjects(self.login(ALI))["chem11"]["status"], "live")

    # 2: a subject not taught to the class is invisible
    def test_subject_not_taught_to_class_is_404(self):
        t = self.login(ALI)
        self.assertEqual(self.call("get", "student/subjects/math11", token=t)[0], 404)  # taught to class B only
        self.assertEqual(self.call("get", "student/subjects/nope", token=t)[0], 404)
        status, data = self.call("get", "student/subjects/phy11", token=t)
        self.assertEqual(status, 200)
        self.assertEqual(len(data["units"]), 14)
        self.assertEqual((data["units"][0]["status"], len(data["units"][0]["lessons"])), ("live", 3))
        self.assertEqual((data["units"][1]["status"], data["units"][1]["lessons"]), ("coming_soon", []))

    # 3: drafts are hidden outside demo mode
    @override_settings(SHOW_DRAFT_LESSONS=False)
    def test_draft_lessons_hidden_when_drafts_are_off(self):
        t = self.login(ALI)
        _, data = self.call("get", "student/subjects/phy11", token=t)
        self.assertEqual(data["units"][0]["lessons"], [])
        self.assertEqual(self.call("get", f"lessons/{LESSON}", token=t)[0], 404)
        self.assertEqual(self.subjects(t)["phy11"]["status"], "coming_soon")

    # 4: an absence in another subject names that subject's topic
    def test_absence_in_chemistry_shows_chemistry_topic(self):
        lesson = self.chem_lesson()
        chem = self.login(CHEM_TEACHER)
        aid = self.assignment(chem, "Chemistry")["id"]
        _, cls = self.call("get", f"teacher/assignments/{aid}", token=chem)
        statuses = {s["id"]: ("absent" if s["name"] == "Ali Raza" else "present") for s in cls["students"]}
        status, _ = self.call("post", f"teacher/assignments/{aid}/attendance",
                              {"lesson": lesson.id, "statuses": statuses}, token=chem)
        self.assertEqual(status, 200)
        _, home = self.call("get", "student/home", token=self.login(ALI))
        self.assertEqual([(c["lesson"]["subject"], c["lesson"]["id"]) for c in home["clearances"]],
                         [("Chemistry", lesson.id)])

    # 5: a teacher of one subject cannot open another subject's assignment in the same class
    def test_chemistry_teacher_cannot_open_physics_assignment(self):
        physics = self.assignment(self.login(A_TEACHER), "Physics")["id"]
        status, data = self.call("get", f"teacher/assignments/{physics}", token=self.login(CHEM_TEACHER))
        self.assertEqual((status, data["message"]), (404, "You are not assigned to this class."))

    def request_subject(self, token, class_id, code):
        return self.call("post", "teacher/subject-requests", {"classId": class_id, "subject": code}, token=token)

    # 6: only for classes the teacher already teaches
    def test_subject_request_only_for_own_class(self):
        from .models import SubjectRequest
        a = self.login(A_TEACHER)
        other_class = self.assignment(self.login(B_TEACHER), "Physics")["classId"]
        status, _ = self.request_subject(a, other_class, "math11")
        self.assertEqual(status, 403)
        self.assertFalse(SubjectRequest.objects.exists())

    # 7, 8: no duplicates, and the grade must match
    def test_subject_request_rejects_duplicates_and_wrong_grade(self):
        a = self.login(A_TEACHER)
        cls = self.assignment(a, "Physics")["classId"]
        self.assertEqual(self.request_subject(a, cls, "chem11")[0], 409)   # the class already has Chemistry
        self.assertEqual(self.request_subject(a, cls, "phy12")[0], 400)    # Grade 12 subject, Grade 11 class
        self.assertEqual(self.request_subject(a, cls, "math11")[0], 200)
        self.assertEqual(self.request_subject(a, cls, "math11")[0], 409)   # already requested

    # 9, 10: pending until approved; approval creates the assignment for teacher and students
    def test_request_pending_then_approved(self):
        from .models import SubjectRequest
        a = self.login(A_TEACHER)
        cls = self.assignment(a, "Physics")["classId"]
        _, req = self.request_subject(a, cls, "math11")
        self.assertEqual(req["status"], "pending")
        _, mine = self.call("get", "teacher/subject-requests", token=a)
        self.assertEqual([(r["subject"]["code"], r["status"]) for r in mine], [("math11", "pending")])
        _, rows = self.call("get", "teacher/assignments", token=a)
        self.assertNotIn("Mathematics", [r["subject"] for r in rows])
        admin = User.objects.get(phone_number_hash=hash_phone("+923999990000"))
        SubjectRequest.objects.get().decide(admin, approve=True)
        _, rows = self.call("get", "teacher/assignments", token=a)
        self.assertIn("Mathematics", [r["subject"] for r in rows])
        self.assertIn("math11", self.subjects(self.login(ALI)))

    # 11: a college admin cannot decide another college's request
    def test_other_college_admin_cannot_decide(self):
        from django.core.exceptions import PermissionDenied
        from .models import College, SubjectRequest
        a = self.login(A_TEACHER)
        self.request_subject(a, self.assignment(a, "Physics")["classId"], "math11")
        other = College.objects.create(name="Other College")
        outsider = User.objects.create_user("+923999990001", "Other Admin", User.COLLEGE_ADMIN, college=other,
                                            gender="male")
        with self.assertRaises(PermissionDenied):
            SubjectRequest.objects.get().decide(outsider, approve=True)
        self.assertEqual(SubjectRequest.objects.get().status, "pending")

    # 12: Grade 12 shows every subject as "Coming soon"
    def test_grade_12_subjects_are_coming_soon(self):
        from .models import College, SchoolClass, StudentProfile, Subject, TeachingAssignment
        college = College.objects.get()
        cls = SchoolClass.objects.create(college=college, grade="12th", stream="Pre-Medical", section="A",
                                         academic_year="2026-2027", gender="male")
        teacher = User.objects.get(phone_number_hash=hash_phone(A_TEACHER))
        for code in ("phy12", "chem12"):
            TeachingAssignment.objects.create(teacher=teacher, school_class=cls, subject=Subject.objects.get(code=code))
        student = User.objects.create_user("+923992229901", "Test Student", User.STUDENT, college=college, gender="male")
        StudentProfile.objects.create(user=student, school_class=cls, roll_number="12A-01",
                                      parent=User.objects.get(phone_number_hash=hash_phone(ALI_PARENT)))
        subs = self.subjects(self.login("+923992229901"))
        self.assertEqual({c: s["status"] for c, s in subs.items()}, {"phy12": "coming_soon", "chem12": "coming_soon"})

    # 13: existing lessons are linked to units
    def test_every_lesson_has_a_unit(self):
        from .models import Lesson
        self.assertTrue(Lesson.objects.exists())
        self.assertFalse(Lesson.objects.filter(unit__isnull=True).exists())

    def test_catalogue_for_teachers_only(self):
        t = self.login(A_TEACHER)
        _, rows = self.call("get", "catalogue?grade=11", token=t)
        self.assertEqual([r["code"] for r in rows], ["phy11", "chem11", "bio11", "math11", "eng11", "cs11"])
        self.assertEqual(self.call("get", "catalogue?grade=13", token=t)[0], 400)
        self.assertEqual(self.call("get", "catalogue?grade=11", token=self.login(ALI))[0], 403)
        cls = self.assignment(t, "Physics")["classId"]
        _, rows = self.call("get", f"catalogue?grade=11&classId={cls}", token=t)
        self.assertEqual({r["code"] for r in rows if r["inClass"]}, {"phy11", "chem11", "bio11"})
        other = self.assignment(self.login(B_TEACHER), "Physics")["classId"]  # not this teacher's class
        _, rows = self.call("get", f"catalogue?grade=11&classId={other}", token=t)
        self.assertFalse(any(r["inClass"] for r in rows))


BILAL = "+923992220003"


class ParentProgress(ApiBase):
    """F21: parent progress view and weekly summary."""

    def setUp(self):
        from .models import Subject
        self.ali = User.objects.get(phone_number_hash=hash_phone(ALI))
        self.physics = Subject.objects.get(code="phy11")
        self.teacher = User.objects.get(phone_number_hash=hash_phone(A_TEACHER))

    def attend(self, days_ago, status, lesson=LESSON):
        from .models import Attendance
        return Attendance.objects.create(school_class=self.ali.student.school_class, student=self.ali,
                                         subject=self.physics, date=timezone.localdate() - timedelta(days=days_ago),
                                         status=status, lesson_id=lesson, marked_by=self.teacher)

    def passed(self, lesson, best):
        LessonProgress.objects.update_or_create(student=self.ali, lesson_id=lesson,
                                                defaults={"unlocked": True, "passed": True, "best_score": best})

    def child(self, token=None):
        _, home = self.call("get", "parent/home", token=token or self.login(ALI_PARENT))
        return home["children"][0]

    # 1: topic statuses and scores in the child's subject detail
    def test_parent_sees_topic_status_and_score(self):
        self.passed("u1-estimation", 4)
        LessonProgress.objects.create(student=self.ali, lesson_id="u1-dimensions", heard_secs=list(range(50)))
        status, d = self.call("get", f"parent/children/{self.ali.id}/subjects/phy11", token=self.login(ALI_PARENT))
        self.assertEqual(status, 200)
        topics = {t["topic"]: t for t in d["units"][0]["topics"]}
        self.assertEqual((topics["1.1"]["status"], topics["1.1"]["best"]), ("passed", 4))
        self.assertEqual(topics["1.2"]["status"], "not_started")
        self.assertEqual(topics["1.3"]["status"], "listening")
        text = json.dumps(d)
        for word in ("question", "options", "answer", "explanation"):  # no quiz content reaches the parent
            self.assertNotIn(word, text)

    # 2, 7: only their own child, only subjects of the child's class
    def test_parent_cannot_see_other_child_or_untaught_subject(self):
        t = self.login(ALI_PARENT)
        bilal = User.objects.get(phone_number_hash=hash_phone(BILAL))
        self.assertEqual(self.call("get", f"parent/children/{bilal.id}/subjects/phy11", token=t)[0], 404)
        self.assertEqual(self.call("get", "parent/children/not-a-uuid/subjects/phy11", token=t)[0], 404)
        self.assertEqual(self.call("get", f"parent/children/{self.ali.id}/subjects/math11", token=t)[0], 404)

    # 3: other roles are refused
    def test_parent_endpoints_refuse_other_roles(self):
        for phone in (ALI, A_TEACHER):
            t = self.login(phone)
            self.assertEqual(self.call("get", f"parent/children/{self.ali.id}/subjects/phy11", token=t)[0], 403)
            self.assertEqual(self.call("post", "parent/settings", {"weeklySummary": False}, token=t)[0], 403)

    # 4: attendance rate over 30 days, null when nothing recorded
    def test_attendance_rate(self):
        self.assertIsNone(self.child()["summary"]["attendanceRate30d"])
        for d in range(1, 6):
            self.attend(d, "present")
        self.attend(6, "absent")
        self.attend(40, "absent")  # outside the 30-day window
        s = self.child()["summary"]
        self.assertEqual((s["attendanceRate30d"], s["attendanceClasses30d"]), (83, {"present": 5, "total": 6}))

    # 5: topics done and average score
    def test_topics_done_and_average_score(self):
        self.passed("u1-estimation", 4)
        self.passed("u1-derived-units", 5)
        c = self.child()
        self.assertEqual((c["summary"]["topicsDone"], c["summary"]["topicsTotal"], c["summary"]["avgScore"]), (2, 3, 4.5))
        phy = next(x for x in c["subjects"] if x["code"] == "phy11")
        self.assertEqual((phy["done"], phy["total"], phy["avgScore"]), (2, 3, 4.5))

    # 6: median days from absence to clearance
    def test_median_days_to_clear(self):
        from .models import Clearance
        att = self.attend(3, "absent")
        Clearance.objects.create(student=self.ali, lesson_id=LESSON, attendance=att, status="cleared", cleared_by="quiz",
                                 cleared_at=timezone.now() - timedelta(days=2))
        self.assertEqual(self.child()["summary"]["medianDaysToClear"], 1)

    def summaries(self):
        return Notification.objects.filter(template_type="weekly_summary")

    # 8: one inbox message per parent per child, idempotent
    def test_weekly_summary_once_per_week(self):
        self.attend(1, "present")
        self.passed("u1-estimation", 4)
        call_command("send_weekly_summaries", stdout=open(os.devnull, "w"))
        n = self.summaries().count()
        self.assertEqual(n, User.objects.filter(role=User.PARENT).count())
        mine = self.summaries().get(recipient__phone_number_hash=hash_phone(ALI_PARENT))
        self.assertEqual((mine.channel, mine.status), ("inbox", "delivered"))
        self.assertIn("Ali", mine.body)
        self.assertIn("Physics 1 of 3 topics", mine.body)
        call_command("send_weekly_summaries", stdout=open(os.devnull, "w"))
        self.assertEqual(self.summaries().count(), n)

    # 9: parents who turned it off get nothing
    def test_weekly_summary_opt_out(self):
        t = self.login(ALI_PARENT)
        self.assertEqual(self.call("post", "parent/settings", {"weeklySummary": "no"}, token=t)[0], 400)
        status, d = self.call("post", "parent/settings", {"weeklySummary": False}, token=t)
        self.assertEqual((status, d["weeklySummary"]), (200, False))
        self.assertFalse(self.call("get", "parent/home", token=t)[1]["weeklySummary"])
        call_command("send_weekly_summaries", stdout=open(os.devnull, "w"))
        self.assertFalse(self.summaries().filter(recipient__phone_number_hash=hash_phone(ALI_PARENT)).exists())

    # 10, 11: the inbox is exempt from the daily limit and shows as in-app
    @override_settings(MAX_MESSAGES_PER_PARENT_PER_DAY=0)
    def test_weekly_summary_ignores_daily_limit_and_is_in_app(self):
        call_command("send_weekly_summaries", stdout=open(os.devnull, "w"))
        self.assertTrue(self.summaries().filter(recipient__phone_number_hash=hash_phone(ALI_PARENT), status="delivered").exists())
        _, msgs = self.call("get", "messages", token=self.login(ALI_PARENT))
        self.assertEqual([m["channel"] for m in msgs if m["type"] == "weekly_summary"], ["inbox"])


COLLEGE_ADMIN = "+923994440001"   # demo college admin (Margalla Heights)
OTHER_ADMIN = "+923994449001"     # admin of a second college, created in the tests

STUDENT_CSV = """class_grade,class_stream,class_section,roll_number,student_name,student_gender,student_phone,parent_name,parent_phone
11th,Pre-Medical,A,11A-21,Imran Ali,male,03992221021,Mr. Ali Khan,03993331021
11th,Pre-Medical,A,11A-22,Faisal Ali,male,03992221022,Mr. Ali Khan,03993331021
"""


class CollegeAdminConsole(ApiBase):
    """F22: the college admin registers and manages their own college, and nothing else."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        from .models import College, SchoolClass, StudentProfile
        other = College.objects.create(name="Other College")
        User.objects.create_user(OTHER_ADMIN, "Other Admin", User.COLLEGE_ADMIN, college=other, gender="male")
        cls.other_class = SchoolClass.objects.create(college=other, grade="11th", stream="Pre-Medical", section="Z",
                                                     academic_year="2026-2027", gender="male")
        parent = User.objects.create_user("+923993339901", "Other Parent", User.PARENT, college=other, gender="male")
        cls.other_student = User.objects.create_user("+923992229902", "Other Student", User.STUDENT, college=other,
                                                     gender="male")
        StudentProfile.objects.create(user=cls.other_student, school_class=cls.other_class, roll_number="Z-01",
                                      parent=parent)

    def admin(self):
        return self.login(COLLEGE_ADMIN)

    def my_class_id(self, t):
        _, classes = self.call("get", "admin/classes", token=t)
        return next(c["id"] for c in classes if c["name"] == "11th Pre-Medical A")

    # 1: lists are limited to the admin's college
    def test_lists_only_own_college(self):
        t = self.admin()
        for role in ("student", "teacher", "parent"):
            _, rows = self.call("get", f"admin/people?role={role}", token=t)
            self.assertTrue(rows)
            self.assertNotIn("Other", " ".join(r["name"] for r in rows))
        _, classes = self.call("get", "admin/classes", token=t)
        self.assertNotIn(str(self.other_class.id), [c["id"] for c in classes])
        _, people = self.call("get", "admin/people?role=student&q=Other", token=t)
        self.assertEqual(people, [])

    # 2: another college's ids are 404 and change nothing
    def test_other_college_ids_are_404(self):
        t = self.admin()
        sid = self.other_student.id
        self.assertEqual(self.call("post", f"admin/people/{sid}", {"active": False, "reason": "test"}, token=t)[0], 404)
        self.assertTrue(User.objects.get(id=sid).is_active)
        teacher = User.objects.get(phone_number_hash=hash_phone(A_TEACHER))
        status, _ = self.call("post", "admin/assignments", {"teacherId": str(teacher.id),
                                                            "classId": str(self.other_class.id), "subject": "chem11"}, token=t)
        self.assertEqual(status, 404)

    # 3: other roles are refused
    def test_admin_endpoints_refuse_other_roles(self):
        for phone in (ALI, A_TEACHER, ALI_PARENT):
            t = self.login(phone)
            for url in ("admin/overview", "admin/people?role=student", "admin/classes", "admin/audit"):
                self.assertEqual(self.call("get", url, token=t)[0], 403, (phone, url))

    def add_teacher(self, t, phone="03991119001"):
        return self.call("post", "admin/people", {"role": "teacher", "name": "Ms. New Teacher", "phone": phone,
                                                  "gender": "female"}, token=t)

    # 4: a newly added teacher can sign in and sees only their classes
    def test_new_teacher_signs_in_and_sees_assigned_class(self):
        t = self.admin()
        status, teacher = self.add_teacher(t)
        self.assertEqual(status, 200)
        tt = self.login("+923991119001")
        self.assertEqual(self.call("get", "teacher/assignments", token=tt)[1], [])
        status, _ = self.call("post", "admin/assignments", {"teacherId": teacher["id"], "classId": self.my_class_id(t),
                                                            "subject": "eng11"}, token=t)
        self.assertEqual(status, 200)
        _, rows = self.call("get", "teacher/assignments", token=tt)
        self.assertEqual([(r["class"], r["subject"]) for r in rows], [("11th Pre-Medical A", "English")])

    # 5: suspend and reactivate
    def test_suspend_and_reactivate(self):
        t = self.admin()
        ali = User.objects.get(phone_number_hash=hash_phone(ALI))
        self.login(ALI)
        self.assertEqual(self.call("post", f"admin/people/{ali.id}", {"active": False}, token=t)[0], 400)  # reason needed
        self.assertEqual(self.call("post", f"admin/people/{ali.id}", {"active": False, "reason": "Left college"}, token=t)[0], 200)
        self.assertEqual(self.call("post", "auth/login", {"phone": ALI, "pin": "1234"})[1]["error"], "suspended")
        self.call("post", f"admin/people/{ali.id}", {"active": True}, token=t)
        self.assertEqual(self.call("post", "auth/login", {"phone": ALI, "pin": "1234"})[0], 200)

    # 6: phone numbers are unique across all accounts
    def test_duplicate_phone_is_409(self):
        t = self.admin()
        self.assertEqual(self.add_teacher(t, phone=ALI_PARENT)[0], 409)
        self.assertEqual(self.add_teacher(t, phone="+923992229902")[0], 409)  # another college's student

    def import_csv(self, t, csv, kind="students"):
        return self.call("post", "admin/imports", {"kind": kind, "csv": csv}, token=t)

    # 7: the check reports each bad row, and a file with errors cannot be committed
    def test_import_reports_errors_and_blocks_commit(self):
        t = self.admin()
        bad = STUDENT_CSV + "11th,Pre-Medical,A,11A-01,Dup Roll,male,03992221023,Mr. X,03993331023\n" \
                            "12th,Arts,Q,1,No Class,male,03992221024,Mr. Y,03993331024\n" \
                            "11th,Pre-Medical,A,11A-25,Bad Phone,male,12345,Mr. Z,03993331025\n"
        status, report = self.import_csv(t, bad)
        self.assertEqual(status, 200)
        errors = {e["row"]: e["message"] for e in report["errors"]}
        self.assertEqual(sorted(errors), [4, 5, 6])
        self.assertIn("roll", errors[4].lower())
        self.assertIn("class", errors[5].lower())
        self.assertIn("phone", errors[6].lower())
        self.assertEqual(self.call("post", f"admin/imports/{report['id']}/commit", token=t)[0], 409)
        self.assertFalse(User.objects.filter(full_name="Imran Ali").exists())

    # 8, 9: a clean file commits once; a parent with two children is created once
    def test_import_commits_once(self):
        t = self.admin()
        _, report = self.import_csv(t, STUDENT_CSV)
        self.assertEqual((report["errors"], report["counts"]["rows"]), ([], 2))
        status, done = self.call("post", f"admin/imports/{report['id']}/commit", token=t)
        self.assertEqual((status, done["created"]["students"], done["created"]["parents"]), (200, 2, 1))
        parent = User.objects.get(phone_number_hash=hash_phone("+923993331021"))
        self.assertEqual(sorted(c.user.full_name for c in parent.children.all()), ["Faisal Ali", "Imran Ali"])
        self.assertEqual(self.call("post", f"admin/imports/{report['id']}/commit", token=t)[0], 409)
        _, other_report = self.import_csv(self.login(OTHER_ADMIN), STUDENT_CSV.replace("Pre-Medical,A", "Pre-Medical,Z")
                                          .replace("0399222102", "0399222202").replace("0399333102", "0399333202"))
        self.assertEqual(self.call("post", f"admin/imports/{other_report['id']}/commit", token=t)[0], 404)

    def test_teacher_import(self):
        t = self.admin()
        csv = ("teacher_name,teacher_phone,teacher_gender,subject,class_grade,class_stream,class_section\n"
               "Ms. Hira Saleem,03991119002,female,English,11th,Pre-Medical,A\n"
               "Ms. Hira Saleem,03991119002,female,cs11,11th,Pre-Engineering,B\n")
        _, report = self.import_csv(t, csv, kind="teachers")
        self.assertEqual(report["errors"], [])
        self.call("post", f"admin/imports/{report['id']}/commit", token=t)
        tt = self.login("+923991119002")
        _, rows = self.call("get", "teacher/assignments", token=tt)
        self.assertEqual(sorted(r["subject"] for r in rows), ["Computer Science", "English"])

    # 10: every change is in the audit log, with masked phone numbers
    def test_audit_log_masks_phones(self):
        from .models import AuditLog
        t = self.admin()
        self.add_teacher(t)
        _, report = self.import_csv(t, STUDENT_CSV)
        self.call("post", f"admin/imports/{report['id']}/commit", token=t)
        _, rows = self.call("get", "admin/audit", token=t)
        actions = [r["action"] for r in rows]
        self.assertIn("person.add", actions)
        self.assertIn("import.commit", actions)
        text = json.dumps(rows) + " ".join(AuditLog.objects.values_list("summary", flat=True))
        self.assertNotIn("3991119001", text)
        self.assertNotIn("3993331021", text)
        _, other = self.call("get", "admin/audit", token=self.login(OTHER_ADMIN))
        self.assertEqual(other, [])

    def test_add_student_with_new_and_existing_parent(self):
        t = self.admin()
        cls = self.my_class_id(t)
        body = {"role": "student", "name": "Kashif Noor", "phone": "03992221031", "gender": "male", "classId": cls,
                "roll": "11A-31", "parentPhone": "03993331031", "parentName": "Mr. Noor"}
        status, kashif = self.call("post", "admin/people", body, token=t)
        self.assertEqual((status, kashif["parent"]["name"]), (200, "Mr. Noor"))
        sibling = dict(body, name="Asif Noor", phone="03992221032", roll="11A-32", parentName="")
        status, asif = self.call("post", "admin/people", sibling, token=t)
        self.assertEqual((status, asif["parent"]["id"]), (200, kashif["parent"]["id"]))
        self.assertEqual(self.call("post", "admin/people", dict(sibling, phone="03992221033"), token=t)[0], 409)  # roll taken
        girl = dict(body, name="Sara Noor", phone="03992221034", roll="11A-34", gender="female")
        self.assertEqual(self.call("post", "admin/people", girl, token=t)[0], 400)  # boys' class
        self.assertEqual(self.call("post", "admin/people", dict(body, phone="03992221035", roll="11A-35",
                                                                parentPhone="+923992229902"), token=t)[0], 409)

    def test_create_college_command(self):
        from .models import College
        call_command("create_college", "New Test College", admin_phone="03994448001", admin_name="Ms. First Admin",
                     stdout=open(os.devnull, "w"))
        admin = User.objects.get(phone_number_hash=hash_phone("+923994448001"))
        self.assertEqual((admin.role, admin.college.name), (User.COLLEGE_ADMIN, "New Test College"))
        _, rows = self.call("get", "admin/people?role=student", token=self.login("+923994448001"))
        self.assertEqual(rows, [])
        from django.core.management.base import CommandError
        with self.assertRaises(CommandError):
            call_command("create_college", "Another", admin_phone="03994448001", admin_name="X Y Z",
                         stdout=open(os.devnull, "w"))
        self.assertFalse(College.objects.filter(name="Another").exists())

    # 11: the Django admin panel is for superusers only
    def test_college_admin_cannot_use_django_admin(self):
        admin = User.objects.get(phone_number_hash=hash_phone(COLLEGE_ADMIN))
        self.assertFalse(admin.is_staff)
        admin.is_staff = True  # even if someone ticks "staff" by mistake
        admin.save()
        self.client.force_login(admin)
        self.assertNotEqual(self.client.get("/admin/").status_code, 200)

    # 12: approving a subject request in the app creates the assignment; other colleges cannot
    def test_admin_decides_subject_request_in_app(self):
        a = self.login(A_TEACHER)
        _, rows = self.call("get", "teacher/assignments", token=a)
        _, req = self.call("post", "teacher/subject-requests", {"classId": rows[0]["classId"], "subject": "math11"}, token=a)
        self.assertEqual(self.call("post", f"admin/subject-requests/{req['id']}/decide", {"approve": True},
                                   token=self.login(OTHER_ADMIN))[0], 404)
        t = self.admin()
        _, overview = self.call("get", "admin/overview", token=t)
        self.assertEqual([r["id"] for r in overview["requests"]], [req["id"]])
        status, _ = self.call("post", f"admin/subject-requests/{req['id']}/decide", {"approve": True}, token=t)
        self.assertEqual(status, 200)
        _, rows = self.call("get", "teacher/assignments", token=a)
        self.assertIn("Mathematics", [r["subject"] for r in rows])


class FakeResponse:
    def __init__(self, status_code):
        self.status_code = status_code


SUB = {"endpoint": "https://push.example.test/send/abc123",
       "keys": {"p256dh": "BNcRd" + "x" * 80, "auth": "tBHItJI5svbpez7KI4CCXg"}}


@mock.patch("lms.push._keys", return_value=(object(), "BPublicKeyForTests"))
class FreeAlerts(ApiBase):
    """F3: inbox + web push by default, and the teacher's one-tap WhatsApp message."""

    def subscribe(self, phone, sub=SUB):
        return self.call("post", "push/subscribe", sub, token=self.login(phone))

    def absent(self, *names):
        t = self.login(A_TEACHER)
        _, rows = self.call("get", "teacher/assignments", token=t)
        aid = rows[0]["id"]
        _, cls = self.call("get", f"teacher/assignments/{aid}", token=t)
        statuses = {s["id"]: ("absent" if s["name"] in names else "present") for s in cls["students"]}
        self.call("post", f"teacher/assignments/{aid}/attendance", {"lesson": LESSON, "statuses": statuses}, token=t)
        return t, aid

    # 1: inbox + push to each device, no paid provider called
    def test_absence_goes_to_inbox_and_push(self, _keys):
        from . import notify
        self.subscribe(ALI_PARENT)
        self.subscribe(ALI_PARENT, dict(SUB, endpoint="https://push.example.test/send/second"))
        with mock.patch("lms.push.webpush") as wp, mock.patch.object(notify.SimulatedWhatsApp, "send") as wa, \
                mock.patch.object(notify.SimulatedSMS, "send") as sms:
            self.absent("Ali Raza")
        self.assertEqual(wp.call_count, 2)
        payload = json.loads(wp.call_args.kwargs["data"])
        self.assertEqual(payload["title"], "Absence alert")
        self.assertIn("Ali Raza", payload["body"])
        wa.assert_not_called()
        sms.assert_not_called()
        _, msgs = self.call("get", "messages", token=self.login(ALI_PARENT))
        self.assertEqual([(m["channel"], m["pushed"]) for m in msgs], [("inbox", {"ok": 2, "total": 2})])

    # 2: expired subscriptions are removed, the inbox alert still arrives
    def test_expired_subscription_is_removed(self, _keys):
        from pywebpush import WebPushException
        from .models import PushSubscription
        self.subscribe(ALI_PARENT)
        with mock.patch("lms.push.webpush", side_effect=WebPushException("gone", response=FakeResponse(410))):
            self.absent("Ali Raza")
        self.assertFalse(PushSubscription.objects.exists())
        self.assertTrue(Notification.objects.filter(recipient__phone_number_hash=hash_phone(ALI_PARENT), status="delivered").exists())

    # 3: no devices -> inbox only
    def test_no_devices_inbox_only(self, _keys):
        with mock.patch("lms.push.webpush") as wp:
            self.absent("Ali Raza")
        wp.assert_not_called()
        _, msgs = self.call("get", "messages", token=self.login(ALI_PARENT))
        self.assertEqual(msgs[0]["pushed"], {"ok": 0, "total": 0})

    # 4: subscriptions belong to the caller only
    def test_subscribe_and_unsubscribe_own_only(self, _keys):
        from .models import PushSubscription
        self.assertEqual(self.call("get", "push/key", token=self.login(ALI_PARENT))[1], {"publicKey": "BPublicKeyForTests"})
        self.assertEqual(self.call("get", "push/key")[0], 401)
        self.assertEqual(self.subscribe(ALI_PARENT, {"endpoint": "http://insecure", "keys": {}})[0], 400)
        self.subscribe(ALI_PARENT)
        self.subscribe(ALI_PARENT)  # the same browser again: updated, not duplicated
        self.assertEqual(PushSubscription.objects.count(), 1)
        other = self.login(SAAD_PARENT)
        self.call("post", "push/unsubscribe", {"endpoint": SUB["endpoint"]}, token=other)
        self.assertEqual(PushSubscription.objects.get().user.phone_number, ALI_PARENT)  # not removed by someone else
        self.call("post", "push/unsubscribe", {"endpoint": SUB["endpoint"]}, token=self.login(ALI_PARENT))
        self.assertFalse(PushSubscription.objects.exists())

    # 5, 6: one-tap WhatsApp for today's absences, own classes only
    def test_teacher_whatsapp_link_and_mark_sent(self, _keys):
        t, aid = self.absent("Ali Raza")
        _, cls = self.call("get", f"teacher/assignments/{aid}", token=t)
        c = cls["clearances"][0]
        self.assertEqual((c["whatsapp"]["phone"], c["whatsapp"]["notifiedAt"]), (ALI_PARENT.lstrip("+"), None))
        self.assertIn("Ali Raza was marked absent today", c["whatsapp"]["text"])
        status, _ = self.call("post", f"teacher/clearances/{c['id']}/whatsapp-sent", token=self.login(B_TEACHER))
        self.assertEqual(status, 404)
        status, d = self.call("post", f"teacher/clearances/{c['id']}/whatsapp-sent", token=t)
        self.assertEqual(status, 200)
        self.assertIsNotNone(d["notifiedAt"])
        self.call("post", f"teacher/clearances/{c['id']}/whatsapp-sent", token=t)  # twice: logged once
        manual = Notification.objects.filter(provider_msg_id="manual")
        self.assertEqual((manual.count(), manual.get().channel, manual.get().status), (1, "whatsapp", "sent"))
        _, cls = self.call("get", f"teacher/assignments/{aid}", token=t)
        self.assertIsNotNone(cls["clearances"][0]["whatsapp"]["notifiedAt"])

    # 8: no phone numbers or push endpoints in the logs
    def test_push_failures_do_not_log_personal_data(self, _keys):
        self.subscribe(ALI_PARENT)
        with self.assertLogs("lms", level="WARNING") as logs, mock.patch("lms.push.webpush", side_effect=OSError("down")):
            self.absent("Ali Raza")
        text = "\n".join(logs.output)
        self.assertNotIn("push.example.test", text)
        self.assertNotIn("3993330001", text)


@mock.patch("lms.push._keys", return_value=(object(), "BPublicKeyForTests"))
class UrduLanguage(ApiBase):
    """F23: each user's own language; parents' alerts follow it."""

    def test_language_setting(self, _keys):
        t = self.login(ALI_PARENT)
        self.assertEqual(self.call("get", "me", token=t)[1]["language"], "en")
        self.assertEqual(self.call("post", "me/language", {"language": "fr"}, token=t)[0], 400)
        self.assertEqual(self.call("post", "me/language", {"language": "ur"})[0], 401)
        self.assertEqual(self.call("post", "me/language", {"language": "ur"}, token=t)[1], {"language": "ur"})
        self.assertEqual(self.call("get", "me", token=t)[1]["language"], "ur")
        self.assertEqual(User.objects.get(phone_number_hash=hash_phone(SAAD_PARENT)).language, "en")  # only the caller changed

    def test_urdu_parent_gets_urdu_alerts(self, _keys):
        self.call("post", "me/language", {"language": "ur"}, token=self.login(ALI_PARENT))
        self.call("post", "push/subscribe", SUB, token=self.login(ALI_PARENT))
        t = self.login(A_TEACHER)
        _, rows = self.call("get", "teacher/assignments", token=t)
        aid = rows[0]["id"]
        _, cls = self.call("get", f"teacher/assignments/{aid}", token=t)
        statuses = {s["id"]: ("absent" if s["name"] in ("Ali Raza", "Hamza Khan") else "present") for s in cls["students"]}
        with mock.patch("lms.push.webpush") as wp:
            self.call("post", f"teacher/assignments/{aid}/attendance", {"lesson": LESSON, "statuses": statuses}, token=t)
        ali = Notification.objects.get(recipient__phone_number_hash=hash_phone(ALI_PARENT))
        self.assertIn("محترم والدین", ali.body)
        self.assertIn("غیر حاضر تھا", ali.body)
        self.assertEqual(json.loads(wp.call_args.kwargs["data"])["title"], "غیر حاضری کی اطلاع")
        hamza = Notification.objects.get(recipient__phone_number_hash=hash_phone("+923993330002"))  # English parent
        self.assertTrue(hamza.body.startswith("Dear Parent"))
        _, cls = self.call("get", f"teacher/assignments/{aid}", token=t)
        links = {c["student"]: c["whatsapp"]["text"] for c in cls["clearances"]}
        self.assertIn("محترم والدین", links["Ali Raza"])
        self.assertTrue(links["Hamza Khan"].startswith("Dear Parent"))

    def test_urdu_weekly_summary(self, _keys):
        User.objects.filter(phone_number_hash=hash_phone(ALI_PARENT)).update(language="ur")
        call_command("send_weekly_summaries", stdout=open(os.devnull, "w"))
        body = Notification.objects.get(recipient__phone_number_hash=hash_phone(ALI_PARENT), template_type="weekly_summary").body
        self.assertTrue(body.startswith("ہفتہ وار رپورٹ"))
        self.assertIn("فزکس", body)


class UrduNarration(ApiBase):
    """F12: the Urdu narration track."""

    def listen(self, token, track, n=400):
        prog, _ = LessonProgress.objects.get_or_create(student=User.objects.get(phone_number_hash=hash_phone(ALI)), lesson_id=LESSON)
        LessonProgress.objects.filter(pk=prog.pk).update(updated_at=timezone.now() - timedelta(hours=1))
        return self.call("post", f"lessons/{LESSON}/progress", {"secs": list(range(0, n)), "track": track}, token=token)

    def test_lesson_offers_urdu_track(self):
        from .models import Lesson
        self.assertTrue(Lesson.objects.get(id=LESSON).ur_audio, "seed imports the Urdu narration")
        _, d = self.call("get", f"lessons/{LESSON}", token=self.login(ALI))
        self.assertTrue(d["urdu"]["audio"].endswith("audio-ur.mp3"))
        self.assertEqual(d["urdu"]["script"][0]["t"], 0)
        self.assertIn("السلام علیکم", d["urdu"]["script"][0]["x"])

    def test_listening_to_urdu_unlocks_quiz(self):
        t = self.login(ALI)
        self.call("get", f"lessons/{LESSON}", token=t)
        status, prog = self.listen(t, "ur")
        self.assertEqual(status, 200)
        self.assertTrue(prog["unlocked"])
        self.assertEqual(prog["heardShareMix"], 0)
        self.assertGreaterEqual(prog["heardShareUr"], 0.9)
        self.assertEqual(self.call("post", f"lessons/{LESSON}/quiz", token=t)[0], 200)

    def test_unknown_or_hidden_track_is_rejected(self):
        from .models import Lesson
        t = self.login(ALI)
        self.call("get", f"lessons/{LESSON}", token=t)
        self.assertEqual(self.listen(t, "fr")[0], 400)
        with override_settings(SHOW_DRAFT_LESSONS=False):
            Lesson.objects.filter(id=LESSON).update(review_status="approved", ur_review_status="draft")
            _, d = self.call("get", f"lessons/{LESSON}", token=t)
            self.assertIsNone(d["urdu"], "a draft Urdu track stays hidden outside demo mode")
            self.assertEqual(self.listen(t, "ur")[0], 400)
            Lesson.objects.filter(id=LESSON).update(ur_review_status="approved")
            _, d = self.call("get", f"lessons/{LESSON}", token=t)
            self.assertIsNotNone(d["urdu"])


class Frontend(TestCase):
    def test_audio_supports_range_requests(self):
        resp = self.client.get("/media/phy11/lessons/u1-estimation/audio.mp3", HTTP_RANGE="bytes=100-199")
        self.assertEqual(resp.status_code, 206)
        self.assertEqual(len(resp.content), 100)
        self.assertTrue(resp["Content-Range"].startswith("bytes 100-199/"))

    def test_text_is_gzipped_but_audio_is_not(self):
        import gzip
        resp = self.client.get("/manifest.webmanifest", HTTP_ACCEPT_ENCODING="gzip, deflate")
        self.assertEqual(resp["Content-Encoding"], "gzip")
        self.assertIn(b"EduSaas", gzip.decompress(resp.content))
        audio = self.client.get("/media/phy11/lessons/u1-estimation/audio.mp3", HTTP_ACCEPT_ENCODING="gzip")
        self.assertFalse(audio.has_header("Content-Encoding"))

    def test_path_traversal_blocked(self):
        self.assertEqual(self.client.get("/../backend/db.sqlite3").status_code, 404)
        self.assertEqual(self.client.get("/%2e%2e/backend/db.sqlite3").status_code, 404)
        self.assertEqual(self.client.get("/media/../backend/db.sqlite3").status_code, 404)
        self.assertEqual(self.client.get("/media/%2e%2e/backend/db.sqlite3").status_code, 404)

    def test_old_app_address_redirects(self):
        self.assertEqual(self.client.get("/app/").headers["Location"], "/")

class OfflineSyncApi(ApiBase):
    def test_sync_progress_and_quiz(self):
        t = self.login(ALI)
        
        payload = {
            "actions": [
                {
                    "id": "1",
                    "type": "progress_update",
                    "payload": {
                        "lesson_id": LESSON,
                        "secs": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                        "track": "mix"
                    }
                }
            ]
        }
        
        status, data = self.call("post", "sync/", payload, token=t)
        self.assertEqual(status, 200)
        self.assertEqual(data["synced"], 1)
        self.assertEqual(data["total"], 1)
        
        # Verify progress was saved
        _, prog_data = self.call("get", f"lessons/{LESSON}", token=t)
        self.assertGreater(prog_data["progress"]["heardShare"], 0)
