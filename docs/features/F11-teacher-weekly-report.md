# F11: Teacher Weekly At-Risk Report & Digest

**Status:** Ready to Build  
**Owner:** Muhammad Noor Khan  
**Date:** 2026-10-13  
**Part of:** v1.2 Pilot Term Release  

---

## 1. Problem

Subject teachers in FBISE intermediate colleges typically manage between 80 and 150 students across multiple class sections. Manually cross-referencing attendance sheets, quiz scores, and clearance progress to identify who is slipping behind is too time-consuming. 

Teachers need an automated **Weekly At-Risk Digest** that:
- Flags students with &ge; 2 uncleared absences.
- Highlights students locked out due to 3 failed quiz attempts.
- Gives the teacher immediate one-tap actions: send a WhatsApp reminder to the parent or grant an in-person clearance override.

---

## 2. Users and Access Rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| **Teacher** | View the at-risk digest for **their assigned classes and subjects only**; trigger automated parent reminder notifications; view quiz failure history; grant clearance overrides. | Cannot see students in classes they do not teach; cannot access other colleges. |
| **College Admin** | View an aggregated summary of at-risk students across all classes in the college. | Cannot access other colleges. |
| **Student & Parent** | Cannot access teacher digests or at-risk lists (403 Forbidden). | — |

---

## 3. Screens

### Phone (360 px)
- **Teacher Home Tab Badge:** Notification indicator on "At-Risk" tab (e.g. `At-Risk (4)`).
- **Filter Chips:**
  - `All At-Risk`
  - `Repeated Absences (≥2)`
  - `Failed Quizzes (3x)`
  - `Pending Override`
- **Student At-Risk Card:**
  - Student photo/avatar, name, roll number, class section.
  - Risk pills: `2 Uncleared Absences`, `Last Quiz: 40% (Failed 3x)`.
  - Primary actions:
    - **"Nudge Parent"**: Pre-fills a WhatsApp message or sends an in-app web push to the registered parent.
    - **"Review & Override"**: Opens the clearance override modal.

### Desktop (1200 px)
- Dedicated table view in Teacher Portal:
  - Columns: Roll No, Student Name, Class, Uncleared Absences, Latest Quiz Score, Escalation Status, Last Parent Contact Date, Quick Actions.
  - Bulk Action Toolbar: "Nudge All Parents", "Export At-Risk List".

---

## 4. API and Data Changes

### Endpoints
All endpoints are scoped to `request.user` (teacher assignments) and require `teacher` role.

| Method & Path | Who Can Call | Query Params | Response | Error Codes |
|---|---|---|---|---|
| `GET /api/teacher/at-risk` | Teacher | `class_id` (optional) | `[{ studentId, name, rollNumber, className, unclearedCount, quizFailureCount, isEscalated, parentPhoneMasked }]` | 401, 403 |
| `POST /api/teacher/at-risk/<id>/nudge` | Teacher | `{ channel: "push" \| "whatsapp" }` | `{ success: true, message: "Alert sent to parent" }` | 400, 404, 403 |
| `GET /api/teacher/weekly-digest` | Teacher | None | `{ weekStart, weekEnd, totalAbsences, totalCleared, atRiskStudents: [...] }` | 401, 403 |

---

## 5. Acceptance Criteria (Automated Tests)

1. **Chronic absence detection:** Given a student with 2 absences where clearances are pending, the student appears in `/api/teacher/at-risk` with `unclearedCount = 2`.
2. **Quiz failure escalation detection:** Given a student who has failed 3 consecutive quiz attempts on any lesson, the student appears with `isEscalated = true`.
3. **Teacher class scoping:** Given Teacher A assigned to Section A, calling `/api/teacher/at-risk` returns only students from Section A, never Section B.
4. **Parent nudge delivery:** Given a valid request to `/api/teacher/at-risk/<id>/nudge`, an in-app notification and web push alert are created for the linked parent.
5. **Unauthorized access refusal:** Given a student or parent token calling `/api/teacher/at-risk`, the server responds with `403 Forbidden`.

---

## 6. Out of Scope

- Automated disciplinary suspension (EduSaas only flags and notifies; actions remain in the college's hands).

---

## 7. Definition of Done

- [ ] Spec signed off.
- [ ] Automated tests in `backend/lms/tests.py` covering chronic absence detection, escalation flagging, and teacher class isolation.
- [ ] Responsive design verified on 360px and 1200px.
- [ ] Integrated with demo teacher account (`Mr. Tariq Mehmood`).
