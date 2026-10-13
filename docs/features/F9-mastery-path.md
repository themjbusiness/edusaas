# F9: Mastery Path After Failed Quiz

**Status:** Ready to Build  
**Owner:** Muhammad Noor Khan  
**Date:** 2026-10-13  
**Part of:** v1.2 Pilot Term Release  

---

## 1. Problem

Currently, if an absent student scores below the 80% threshold on a clearance quiz, there is no guided catch-up path. Students could simply guess repeatedly until passing, undermining the trust principals and teachers place in the clearance green tick. 

To ensure genuine comprehension, students scoring < 80% must enter a **Mastery Remediation Loop**:
1. Review the specific textbook sections corresponding to questions they missed.
2. Undergo a 10-minute cooldown period before retaking.
3. Receive an alternate set of MCQs on subsequent attempts.
4. If a student fails 3 consecutive times, clearance is locked and escalated to the teacher for direct consultation and manual override.

---

## 2. Users and Access Rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| **Student** | View quiz score breakdown; listen to recommended remediation audio clips; retake quiz after cooldown; see attempt counter (Attempt X of 3). | Cannot bypass cooldown timer; cannot retake after 3 failures without teacher intervention; cannot self-clear. |
| **Teacher** | Receive notification when a student reaches 3 failed attempts; view quiz answer breakdown; grant manual clearance override with required reason. | Cannot override clearance for students in other classes or colleges. |
| **Parent** | Receive alert when child fails 2nd and 3rd quiz attempts; view attempt history. | Cannot override or take quizzes. |
| **College Admin** | View aggregate pass/fail rates and escalation volume. | Cannot take quizzes. |

---

## 3. Screens

### Phone (360 px)
- **Quiz Results Screen (Score < 80%):**
  - Score badge (e.g. `Score: 60% — 3/5 Correct`).
  - Status banner: *"Clearance requires 80%. Let's review the topics you missed."*
  - **Remediation Playlist:** Direct links to play missed audio segments (e.g. "Section 2: Base vs Derived Quantities").
  - **Cooldown Timer:** *"Next attempt available in 08:45"*. Retake button is disabled until countdown reaches zero.
  - **Attempt Pill:** Displays `Attempt 1 of 3` or `Attempt 2 of 3`.
- **Escalation Lockout Screen (After 3 Failures):**
  - Red alert card: *"Maximum attempts reached. Please consult Mr. Tariq Mehmood in college."*
  - "Contact Teacher via WhatsApp" quick action button.
- **Teacher Escalation & Override Modal (Teacher App):**
  - Teacher clicks on flagged student card in class roster.
  - Shows student's 3 attempt scores and timestamps.
  - Form: Reason dropdown (*"Attended office hours"*, *"Sick leave with medical cert"*, *"Oral test passed"*) + free-text notes + "Grant Clearance Override" button.

### Desktop (1200 px)
- In the student player, the right-hand panel shifts to Remediation Mode, highlighting missed textbook paragraphs in yellow with accompanying audio snippet controls.

---

## 4. API and Data Changes

### Data Model
In `backend/lms/models.py`:
- `QuizAttempt`:
  ```python
  attempt_number = models.PositiveSmallIntegerField(default=1)
  missed_sections = models.JSONField(default=list)
  cooldown_until = models.DateTimeField(null=True, blank=True)
  ```
- `Clearance`:
  ```python
  status = models.CharField(max_length=20, default="pending", choices=[("pending", "Pending"), ("cleared", "Cleared"), ("override", "Teacher Override"), ("locked", "Locked Escalation")])
  override_reason = models.CharField(max_length=255, blank=True)
  override_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="clearance_overrides")
  ```

### Endpoints
| Method & Path | Who Can Call | Request Body | Response | Error Codes |
|---|---|---|---|---|
| `GET /api/student/lessons/<id>/remediation` | Student | None | `{ attemptCount: 2, maxAttempts: 3, cooldownSecondsLeft: 420, missedSections: [{ title, startSec, endSec }] }` | 401, 403 |
| `POST /api/student/lessons/<id>/quiz` | Student | `{ answers: { q1: "a", ... } }` | `{ score: 60, passed: false, attemptNumber: 1, cooldownUntil: "...", missedSections: [...] }` | 429 (Cooldown active), 403 (Max attempts exceeded) |
| `POST /api/teacher/clearances/<id>/override` | Teacher | `{ reason: "Oral exam verified", notes: "..." }` | `{ status: "override", clearedAt: "...", overrideBy: "..." }` | 400 (Missing reason), 403 (Wrong teacher) |

---

## 5. Acceptance Criteria (Automated Tests)

1. **Attempt tracking and cooldown:** Given a student scoring 60%, when submitting a quiz, `attempt_number` increases to 1, and `cooldown_until` is set to 10 minutes in the future.
2. **Cooldown enforcement:** Given an active cooldown, when the student tries to submit a retake before expiry, the server rejects with `429 Too Many Requests`.
3. **Escalation on 3rd failure:** Given a student failing 3 attempts consecutively, when the 3rd attempt is scored, clearance status transitions to `locked`, and student is blocked from retaking.
4. **Teacher override clearance:** Given a locked clearance, when the assigned class teacher submits an override with a valid reason, status becomes `override` and clearance is granted.
5. **Cross-teacher override refusal:** Given a teacher from another class or subject, when attempting to override a clearance, the server returns `403 Forbidden`.

---

## 6. Out of Scope

- Live video tutoring between teacher and student.
- Infinite retakes without teacher review.

---

## 7. Definition of Done

- [ ] Spec signed off.
- [ ] Automated tests in `backend/lms/tests.py` covering cooldown, 3-attempt escalation, and teacher override.
- [ ] Responsive checks on 360px and 1200px.
- [ ] Access rule verification for teacher overrides.
