"""Teacher At-Risk Digest and Catch-Up API (F11).

Endpoints:
- GET /api/teacher/at-risk: Returns flagged at-risk students across teacher's assigned classes.
- POST /api/teacher/at-risk/<id>/nudge: Sends reminder push & in-app alert to registered parent.
- GET /api/teacher/weekly-digest: Returns weekly metrics (absences, cleared count, at-risk list).
"""
from collections import defaultdict
from datetime import timedelta
import logging

from django.utils import timezone

from . import notify
from .auth import api, ApiError, mask_phone
from .models import (
    Attendance, Clearance, Notification, QuizAttempt, SchoolClass, StudentProfile, TeachingAssignment, User
)

log = logging.getLogger("lms")
TEACHER = (User.TEACHER,)


def _at_risk_students_for_teacher(teacher, class_id=None):
    """Compute at-risk students strictly scoped to teacher's assignments."""
    assigned_classes = SchoolClass.objects.filter(assignments__teacher=teacher).distinct()
    if class_id is not None:
        try:
            cid = int(class_id)
            if not assigned_classes.filter(id=cid).exists():
                raise ApiError(404, "not_found", "Class not assigned to teacher.")
            assigned_classes = assigned_classes.filter(id=cid)
        except ValueError:
            raise ApiError(400, "bad_request", "Invalid class_id.")

    profiles = StudentProfile.objects.filter(
        school_class__in=assigned_classes,
        user__is_active=True
    ).select_related("user", "parent", "school_class").order_by(
        "school_class__grade", "school_class__section", "roll_number"
    )

    # Clearances for students in these classes that are not cleared or overridden
    clearances_qs = Clearance.objects.filter(
        student__student__school_class__in=assigned_classes
    ).exclude(status__in=[Clearance.CLEARED, Clearance.OVERRIDE]).select_related("lesson", "attendance")

    uncleared_by_student = defaultdict(list)
    for c in clearances_qs:
        uncleared_by_student[c.student_id].append(c)

    # Quiz attempts grouped by student and lesson to identify failures
    attempts_qs = QuizAttempt.objects.filter(
        student__student__school_class__in=assigned_classes
    ).order_by("student_id", "lesson_id", "started_at")

    attempts_by_student_lesson = defaultdict(lambda: defaultdict(list))
    for att in attempts_qs:
        attempts_by_student_lesson[att.student_id][att.lesson_id].append(att)

    # Latest parent nudge/contact
    latest_nudges = {}
    for n in Notification.objects.filter(
        recipient_role="parent",
        student__student__school_class__in=assigned_classes
    ).order_by("sent_at"):
        latest_nudges[n.student_id] = n.sent_at

    at_risk_list = []
    for p in profiles:
        student_clearances = uncleared_by_student.get(p.user_id, [])
        uncleared_count = len(student_clearances)

        max_failures = 0
        is_escalated = False

        if any(c.status == Clearance.LOCKED for c in student_clearances):
            is_escalated = True
            max_failures = max(max_failures, 3)

        student_lessons = attempts_by_student_lesson.get(p.user_id, {})
        for lesson_id, att_list in student_lessons.items():
            fails = sum(1 for a in att_list if not a.passed)
            if fails > max_failures:
                max_failures = fails
            consecutive = 0
            for a in att_list:
                if not a.passed:
                    consecutive += 1
                    if consecutive >= 3:
                        is_escalated = True
                else:
                    consecutive = 0

        # At-risk criteria:
        # - unclearedCount >= 2 (chronic absenteeism)
        # - isEscalated (locked clearance or >= 3 consecutive failed quiz attempts)
        # - max_failures >= 3
        if uncleared_count >= 2 or is_escalated or max_failures >= 3:
            last_contact = latest_nudges.get(p.user_id)
            at_risk_list.append({
                "studentId": str(p.user_id),
                "name": p.user.full_name,
                "rollNumber": p.roll_number,
                "className": f"{p.school_class.grade} {p.school_class.section}",
                "classId": p.school_class.id,
                "unclearedCount": uncleared_count,
                "quizFailureCount": max_failures,
                "isEscalated": is_escalated,
                "parentPhoneMasked": mask_phone(p.parent.phone_number) if p.parent else "",
                "clearanceIds": [c.id for c in student_clearances],
                "lastParentContact": last_contact.isoformat() if last_contact else None,
            })

    return at_risk_list


@api(roles=TEACHER)
def teacher_at_risk(request):
    class_id = request.GET.get("class_id")
    return _at_risk_students_for_teacher(request.user, class_id)


@api(methods=("POST",), roles=TEACHER)
def teacher_nudge_parent(request, student_id):
    profile = StudentProfile.objects.select_related("user", "parent", "school_class").filter(user_id=student_id).first()
    if profile is None:
        raise ApiError(404, "not_found", "Student not found.")

    teaches_class = TeachingAssignment.objects.filter(
        teacher=request.user,
        school_class=profile.school_class
    ).exists()
    if not teaches_class:
        raise ApiError(403, "forbidden", "You do not teach this student's class.")

    parent = profile.parent
    if not parent:
        raise ApiError(400, "no_parent", "No parent registered for this student.")

    channel = request.json.get("channel", "push") if getattr(request, "json", None) else "push"

    # Message text in parent's preferred language
    lang = notify.lang_of(parent)
    if lang == "ur":
        body = (f"محترم والدین، یہ {profile.user.full_name} کے بارے میں کالج کی طرف سے اہم اطلاع ہے۔ "
                f"براہ کرم ان کے چھوٹے ہوئے لیکچرز اور کوئز مکمل کروائیں تاکہ کلاس کے لیے حاضری کلیئرنس بحال ہو سکے۔")
    else:
        body = (f"Dear Parent, this is an urgent reminder from college regarding {profile.user.full_name}. "
                f"Please ensure your child completes the missed backup lectures and quizzes to regain clearance for class attendance.")

    # Always create an in-app notification & web push alert for the parent
    notify.inbox(profile.user, parent, "parent", "parent_nudge", body)

    # If WhatsApp was explicitly requested or paid messaging enabled, also record/dispatch
    if channel == "whatsapp":
        Notification.objects.create(
            student=profile.user, recipient=parent, recipient_phone=parent.phone_number,
            recipient_role="parent", channel="whatsapp", template_type="parent_nudge",
            body=body, status="sent", provider_msg_id="manual"
        )

    return {"success": True, "message": "Alert sent to parent"}


@api(roles=TEACHER)
def teacher_weekly_digest(request):
    teacher = request.user
    today = timezone.localdate()
    # Monday to Sunday of the current week
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    assigned_classes = SchoolClass.objects.filter(assignments__teacher=teacher).distinct()

    total_absences = Attendance.objects.filter(
        school_class__in=assigned_classes,
        status=Attendance.ABSENT,
        date__range=(week_start, week_end)
    ).count()

    total_cleared = Clearance.objects.filter(
        attendance__school_class__in=assigned_classes,
        status__in=[Clearance.CLEARED, Clearance.OVERRIDE],
        cleared_at__date__range=(week_start, week_end)
    ).count()

    at_risk = _at_risk_students_for_teacher(teacher)

    return {
        "weekStart": week_start.isoformat(),
        "weekEnd": week_end.isoformat(),
        "totalAbsences": total_absences,
        "totalCleared": total_cleared,
        "atRiskStudents": at_risk,
    }
