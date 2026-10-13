# F7: Teacher Content Review Screen

**Status:** Ready to Build  
**Owner:** Muhammad Noor Khan  
**Date:** 2026-10-13  
**Part of:** v1.2 Pilot Term Release  

---

## 1. Problem

Today, AI-generated audio lectures and quizzes created by the Content Factory are reviewed through terminal CLI scripts. College teachers cannot inspect or curate lessons from their smartphones or laptops. To build trust with college principals and ensure 100% textbook accuracy without errors reaching absent students, subject teachers must have a streamlined web curation interface to listen section-by-section, modify transcripts and MCQs, and approve lessons before release.

---

## 2. Users and Access Rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| **Teacher** | View lessons for their assigned subjects; play section audio; edit script text; edit MCQ questions and correct answers; approve or reject lessons with notes. | Cannot approve lessons for subjects they do not teach; cannot access content from other colleges (unless content is global). |
| **Content Admin** | View, edit, approve, or reject all lessons across all subjects; trigger pipeline imports. | Cannot alter college student attendance records. |
| **Student** | Can only see and study `approved` lessons. | Must never see lessons in `draft`, `in_review`, or `rejected` state. |
| **Parent & College Admin** | Read-only visibility into approved catalogue. | Cannot edit transcripts or approve content. |

---

## 3. Screens

### Phone (360 px)
- **Review List:** Cards showing lesson title, subject pill, current status (`In Review`, `Draft`, `Approved`), and "Review" button.
- **Section Player & Transcript Editor:**
  - Sticky mini audio player with play/pause and 10s replay.
  - Section-by-section breakdown: textbook page thumbnail, timestamp, editable script text block.
- **MCQ Editor Accordion:**
  - Collapsible cards for each quiz question.
  - Radio button to select correct answer, input fields for question text and 4 choices.
  - Add/Delete question buttons.
- **Action Bar (Sticky Bottom):** "Reject (with notes)" and "Approve & Publish" buttons.

### Desktop (1200 px)
- Split screen: Left pane displays high-resolution FBISE textbook page with audio waveforms; right pane provides tabbed transcript editor and quiz validator.

### Offline Behaviour
- Reviewing requires online connectivity to stream audio files. If offline, display: *"Content review requires an internet connection. Draft changes are stored locally."*

---

## 4. API and Data Changes

### Data Model
In `backend/lms/models.py`, update `Lesson`:
```python
review_status = models.CharField(
    max_length=20,
    choices=[("draft", "Draft"), ("in_review", "In Review"), ("approved", "Approved"), ("rejected", "Rejected")],
    default="approved"
)
reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_lessons")
reviewed_at = models.DateTimeField(null=True, blank=True)
review_notes = models.TextField(blank=True)
```

### Endpoints
All endpoints are under `/api/review/` and require `teacher` or `content_admin` role.

| Method & Path | Who Can Call | Request Body | Response | Error Codes |
|---|---|---|---|---|
| `GET /api/review/lessons` | Teacher, Content Admin | Query params: `subject`, `status` | `[{ id, title, subject, status, sectionCount, questionCount }]` | 401, 403 |
| `GET /api/review/lessons/<id>` | Teacher, Content Admin | None | Full lesson JSON (sections, audio URLs, script text, quiz MCQs, review notes) | 404 if not found |
| `PUT /api/review/lessons/<id>` | Teacher, Content Admin | `{ sections: [...], quiz: [...] }` | Updated lesson object | 400 (validation), 403 |
| `POST /api/review/lessons/<id>/decide` | Teacher, Content Admin | `{ action: "approve" \| "reject", notes: "..." }` | `{ status: "approved" \| "rejected", reviewedAt: "..." }` | 400, 403 |

---

## 5. Acceptance Criteria (Automated Tests)

1. **Teacher list reviewable lessons:** Given a teacher assigned to Physics 11th, when requesting `/api/review/lessons`, then only Physics 11th draft/in-review lessons are returned.
2. **Unauthorized subject access refusal:** Given a teacher assigned only to English, when attempting to review or approve a Chemistry lesson, then the server returns `403 Forbidden`.
3. **Student isolation from unapproved content:** Given a lesson with `review_status = "in_review"`, when a student requests `/api/student/lessons/<id>`, then the server returns `404 Not Found`.
4. **Content edits persisted:** Given valid changes to transcript text and MCQ choices, when PUT is sent to `/api/review/lessons/<id>`, the changes are saved and reflected in subsequent retrievals.
5. **Approve transitions status:** Given a lesson in `in_review`, when a teacher posts `{ action: "approve" }`, its status becomes `approved` and it immediately appears on student library endpoints.

---

## 6. Out of Scope

- Audio voice re-synthesis inside the browser (edits update transcripts and quizzes; full voice re-rendering remains an offline Content Factory process).
- Re-authoring diagrams or graphics.

---

## 7. Definition of Done

- [ ] Spec signed off.
- [ ] Automated tests in `backend/lms/tests.py` covering all 5 acceptance criteria.
- [ ] Responsive tests at 360px and 1200px.
- [ ] Security access-rule tests verified (cross-subject, student isolation).
- [ ] Integrated with demo teacher account (`Mr. Tariq Mehmood`).
