"""Teacher content review and curation API (F7).

Allows subject teachers and content admins to:
1. List reviewable lessons (filtered by assigned subject for teachers).
2. Inspect full audio sections, transcripts, and quiz MCQs.
3. Edit transcript text and MCQs prior to student release.
4. Approve or reject lessons with review notes.
"""
from django.utils import timezone

from .api import iso
from .auth import ApiError, api
from .models import Lesson, Subject, TeachingAssignment, User

REVIEW_ROLES = (User.TEACHER, User.CONTENT_ADMIN)


def _check_teacher_subject_access(user, subject):
    """Ensure a teacher can only review lessons for subjects they are actively assigned to teach."""
    if user.role == User.CONTENT_ADMIN:
        return
    assigned = TeachingAssignment.objects.filter(teacher=user, subject=subject).exists()
    if not assigned:
        raise ApiError(403, "forbidden", "You cannot review or modify lessons for subjects you do not teach.")


@api(methods=("GET",), roles=REVIEW_ROLES)
def review_lessons(request):
    """List reviewable lessons. Teachers only see subjects they teach; admins see all."""
    qs = Lesson.objects.select_related("subject", "reviewed_by").all()

    if request.user.role == User.TEACHER:
        assigned_subject_ids = TeachingAssignment.objects.filter(
            teacher=request.user
        ).values_list("subject_id", flat=True)
        qs = qs.filter(subject_id__in=assigned_subject_ids)

    # Optional query param filters
    subject_param = request.GET.get("subject")
    if subject_param:
        qs = qs.filter(subject__code=subject_param) | qs.filter(subject__name=subject_param)

    status_param = request.GET.get("status")
    if status_param:
        qs = qs.filter(review_status=status_param)

    rows = []
    for l in qs.order_by("subject__sort_order", "sort_order", "topic"):
        rows.append({
            "id": l.id,
            "title": l.title,
            "topic": l.topic,
            "unitNumber": l.unit_number,
            "unitTitle": l.unit_title,
            "subject": l.subject.name,
            "subjectCode": l.subject.code,
            "status": l.review_status,
            "duration": l.duration_sec,
            "sectionCount": len(l.sections) if isinstance(l.sections, list) else 0,
            "questionCount": len(l.quiz) if isinstance(l.quiz, list) else 0,
            "reviewedBy": l.reviewed_by.full_name if l.reviewed_by else None,
            "reviewedAt": iso(l.reviewed_at),
            "reviewNotes": l.review_notes,
        })
    return rows


@api(methods=("GET", "PUT"), roles=REVIEW_ROLES)
def review_lesson_detail(request, lesson_id):
    """Retrieve or edit lesson curation payload (audio sections, transcripts, quiz MCQs)."""
    lesson = Lesson.objects.filter(id=lesson_id).select_related("subject", "reviewed_by").first()
    if not lesson:
        raise ApiError(404, "not_found", "Lesson not found.")

    _check_teacher_subject_access(request.user, lesson.subject)

    if request.method == "PUT":
        updates = []
        if "sections" in request.json:
            sections = request.json["sections"]
            if not isinstance(sections, list):
                raise ApiError(400, "invalid_sections", "sections must be a list.")
            for s in sections:
                if not isinstance(s, dict) or "text" not in s or "start" not in s:
                    raise ApiError(400, "invalid_sections", "Each section must have text and start timestamp.")
            lesson.sections = sections
            updates.append("sections")

        if "quiz" in request.json:
            quiz = request.json["quiz"]
            if not isinstance(quiz, list):
                raise ApiError(400, "invalid_quiz", "quiz must be a list of questions.")
            for q in quiz:
                if not isinstance(q, dict) or "question" not in q or "options" not in q or "answer" not in q:
                    raise ApiError(400, "invalid_quiz", "Each question must have question, options, and answer.")
                if not isinstance(q["options"], list) or len(q["options"]) < 2:
                    raise ApiError(400, "invalid_quiz", "Question options must be a list with at least 2 choices.")
                if not isinstance(q["answer"], int) or not (0 <= q["answer"] < len(q["options"])):
                    raise ApiError(400, "invalid_quiz", "Answer must be a valid 0-based index into options.")
            lesson.quiz = quiz
            updates.append("quiz")

        if "review_notes" in request.json:
            lesson.review_notes = str(request.json["review_notes"])
            updates.append("review_notes")

        if updates:
            lesson.save(update_fields=updates)

    base = "media/" + lesson.book + "/"
    data = {
        "id": lesson.id,
        "title": lesson.title,
        "topic": lesson.topic,
        "unitNumber": lesson.unit_number,
        "unitTitle": lesson.unit_title,
        "subject": lesson.subject.name,
        "subjectCode": lesson.subject.code,
        "status": lesson.review_status,
        "duration": lesson.duration_sec,
        "pages": lesson.pages,
        "images": [base + img for img in lesson.images],
        "imagesSm": [base + img for img in (lesson.images_sm or lesson.images)],
        "audio": base + lesson.audio,
        "sections": lesson.sections,
        "quiz": lesson.quiz,
        "reviewedBy": lesson.reviewed_by.full_name if lesson.reviewed_by else None,
        "reviewedAt": iso(lesson.reviewed_at),
        "reviewNotes": lesson.review_notes,
    }
    if lesson.ur_audio:
        data["ur"] = {
            "audio": base + lesson.ur_audio,
            "duration": lesson.ur_duration_sec,
            "sections": lesson.ur_sections,
            "status": lesson.ur_review_status,
        }
    return data


@api(methods=("POST",), roles=REVIEW_ROLES)
def review_lesson_decide(request, lesson_id):
    """Approve or reject a lesson with review attribution and notes."""
    lesson = Lesson.objects.filter(id=lesson_id).select_related("subject", "reviewed_by").first()
    if not lesson:
        raise ApiError(404, "not_found", "Lesson not found.")

    _check_teacher_subject_access(request.user, lesson.subject)

    action = request.json.get("action")
    if action not in ("approve", "reject"):
        raise ApiError(400, "invalid_action", "Action must be 'approve' or 'reject'.")

    notes = request.json.get("notes", "")

    lesson.review_status = Lesson.APPROVED if action == "approve" else Lesson.REJECTED
    lesson.reviewed_by = request.user
    lesson.reviewed_at = timezone.now()
    if notes:
        lesson.review_notes = str(notes)

    lesson.save(update_fields=["review_status", "reviewed_by", "reviewed_at", "review_notes"])

    return {
        "id": lesson.id,
        "status": lesson.review_status,
        "reviewedBy": lesson.reviewed_by.full_name,
        "reviewedAt": iso(lesson.reviewed_at),
        "reviewNotes": lesson.review_notes,
    }
