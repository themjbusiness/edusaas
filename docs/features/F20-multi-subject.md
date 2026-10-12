# F20: Multiple subjects

Status: Built 2026-09-30 (signed off the same day; subject list: the six proposed, no extras) · Owner: Muhammad Noor Khan · Last updated: 2026-09-30

Plan: [implementation plan, F20](../implementation-plan-subjects-languages-admin-parent.md#f20-multiple-subjects) · Decisions: D4 and plan decision 2 (add a `Unit` model)

## Problem

A college teaches five or more subjects per class, but the app is built around Physics only. The student home takes its course title from the first lesson it finds, and the Library's list of 14 units is typed into the web app's code. A teacher who teaches Chemistry, or a Grade 12 class, has nothing to show. Subjects will be added over time (D4), so the app has to show the full catalogue now and label subjects without content as "Coming soon". Teachers also need a way to ask for a subject on their portal.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Student | See every subject taught to their own class, with progress; open approved lessons of those subjects; see "Coming soon" subjects and units | Lessons of subjects not taught to their class; draft lessons; other students' progress |
| Teacher | See each class-and-subject they are assigned; ask for a subject on a class they already teach; see the status of their requests | Give themselves a class; ask for a subject on a class they don't teach; see other teachers' requests |
| Parent | No change in F20 (subject progress comes in F21) | — |
| College admin | Approve or decline subject requests from their own college (in the Django admin panel until F22) | Requests from other colleges |
| Content admin (EduSaas team) | Manage the subject catalogue, units and subject status | — |

## Screens

**Phone (360 px):**
- **Student home:**
  - Pending clearances stay at the top, whatever the subject.
  - Below them, a "My subjects" list shows one card per subject with an icon, the name, a "2/3 topics" progress bar and a pending badge.
  - "Coming soon" subjects are greyed and sorted last.
  - Tapping a subject opens its page.
- **Subject page (new):** the units in order. Each unit lists its topics (as the home screen does today). A unit with no approved lessons shows "Coming soon" and can't be opened.
- **Library:**
  - Subject tabs across the top, scrolling sideways, each showing the same unit list.
  - For Grade 11 students, a final "Grade 12 · Coming soon" section lists the Grade 12 subjects.
- **Lesson and quiz:** the subject name appears in the breadcrumb and quiz header ("Chemistry · Unit 1").
- **Teacher, My classes:**
  - One card per class-and-subject ("11th Pre-Medical A · Chemistry").
  - The teacher's pending requests appear as greyed cards marked "Waiting for college admin".
  - An **Add subject** button opens a dialog: pick a class (only the teacher's own), pick a subject (from the catalogue, marked "Coming soon" where there is no content yet), then Send request.
- **Empty states:**
  - no subjects assigned: "Your college hasn't added subjects to your class yet."
  - request declined: the admin's note is shown, with a Dismiss button.

**Desktop (1200 px):** subject cards in a grid on the student home. The subject page shows units in a left list and topics on the right. The rest follows the phone layout.

**Offline:** there is no offline mode yet (F4). Lists show the existing "You are offline" card with Try again. There are no blank screens.

## API and data changes

| Method and path | Who can call it | Request | Response | Errors |
|---|---|---|---|---|
| `GET /api/student/home` (changed) | Student | — | Replaces `course` with `subjects: [{code, name, icon, status, done, total, pending}]`; keeps `lessons` (for pending cards) and `clearances` | — |
| `GET /api/student/subjects/<code>` (new) | Student, only subjects taught to their class | — | `{subject, units: [{number, title, status, lessons: [summary]}]}` | 404 if not taught to the class, or unknown |
| `GET /api/catalogue?grade=11` (new) | Teacher, college admin | — | `[{code, name, grade, status}]` | 400 bad grade |
| `GET /api/teacher/assignments` (changed) | Teacher | — | Adds `subject: {code, name, status}` | — |
| `GET /api/teacher/subject-requests` (new) | Teacher | — | Their own requests | — |
| `POST /api/teacher/subject-requests` (new) | Teacher | `{class_id, subject_code}` | The new request | 403 not their class; 409 already taught or already requested; 400 subject grade doesn't match class grade |

Model and migration changes:

- **`Subject`:** add `code` (unique, e.g. `phy11`), `status` (`live` or `coming_soon`), `icon`, `sort_order`.
- **New `Unit`:** subject, number, title, sort_order; unique on (subject, number).
- **`Lesson`:** add `unit` (foreign key). A data migration creates `Unit` rows from the existing `unit_number` and `unit_title`, then links each lesson. The old two fields are removed in a later migration, once `import_lessons` writes `unit`.
- **New `SubjectRequest`:** teacher, school_class, subject, status (`pending`, `approved`, `declined`), note, decided_by, decided_at, created_at. On approval, a `TeachingAssignment` is created in the same transaction.
- **Catalogue seed (`seed_catalogue` command):**
  - Grade 11 and Grade 12 × Physics, Chemistry, Biology, Mathematics, English, Computer Science.
  - Physics 11 is `live` with its 14 units; everything else is `coming_soon`.
- **`import_lessons`:** sets a subject to `live` when it gains its first approved lesson.
- **Subject status rule:** a subject is `live` for students only if it has at least one approved, published lesson, even if its catalogue status says `live`.

## Acceptance criteria

1. Given a class taught Physics and Chemistry, when a student opens home, then both subjects appear with correct done/total counts, and Chemistry shows "Coming soon" until it has an approved lesson.
2. Given Biology is not taught to the student's class, when the student requests `/api/student/subjects/bio11`, then the server returns 404.
3. Given a draft lesson, when a student opens its subject, then the lesson is not listed, and `/api/lessons/<id>` returns 404.
4. Given an absence recorded in Chemistry, when the student opens home, then the pending card names the Chemistry topic and links to it.
5. Given a Chemistry teacher, when they open the Physics assignment of the same class, then the server returns 403 "You are not assigned to this class".
6. Given a teacher assigned only to 11th Pre-Medical A, when they request a subject for 11th Pre-Engineering B, then the server returns 403 and saves nothing.
7. Given a request for a subject the class already has, or a second identical pending request, then the server returns 409.
8. Given a Grade 12 subject and a Grade 11 class, when the teacher requests it, then the server returns 400.
9. Given a pending request, when the teacher opens My classes, then it shows "Waiting for college admin", and the subject cannot be used for attendance.
10. Given an admin approves a request, then a `TeachingAssignment` exists, the teacher sees the class-and-subject, and the class's students see the subject.
11. Given a college admin of College B, when they approve a College A request, then it is refused.
12. Given a Grade 12 class, when its student opens home, then every subject shows "Coming soon" and no lessons.
13. Given the existing Physics data, after migration, then every lesson has a `unit`, and all 27 existing backend tests still pass.

## Out of scope

- Content for any subject other than Physics 11 Unit 1 (that is content work, see the plan's content runbook).
- The in-app admin screen for approving requests (F22). Until then, requests are approved in the Django admin panel.
- Parent subject progress (F21), Urdu labels (F23) and offline (F4).
- A teacher removing a subject from their portal (the college admin does this).

## Risks and open questions

- **Subject list:** the seed list above is a proposal. Add or remove subjects (Urdu, Islamiat, Pakistan Studies) before the seed is written.
- **Crowded home screen:** six subject cards on a phone make the home screen long. Mitigation: pending cards first, then subjects with content, then "Coming soon" collapsed into one row that expands.
- **Screens are built in the current web app,** because F1 (the React rebuild) has not started. They will be ported during F1, which roughly doubles the screen work for this feature.

## Definition of done

- [x] Spec signed off, with out-of-scope items listed
- [x] Every acceptance criterion has a passing automated test
- [x] Access-rule tests pass: wrong role, wrong college, wrong class, not linked
- [ ] Screens checked at 360, 390, 768, 1024 and 1440 px in light and dark mode
- [ ] Accessibility checks pass, with no serious or critical issues
- [ ] Performance budget met on the low-end phone profile
- [ ] Works offline or fails with a clear message (no blank screens)
- [ ] English and Urdu text reviewed by a native speaker (English only in F20; Urdu comes with F23)
- [ ] Content approved by a subject teacher (if students see it)
- [x] Errors are logged; personal data is not written to the logs
- [x] README or admin guide updated (demo script, and how to approve a subject request in the admin panel)
- [ ] Tried by at least 2 real users; their issues fixed or logged

## Implementation notes

Built on 30 September 2026. Where the build differs from the spec above:

- **Draft lessons in the demo.** Students only see teacher-approved lessons. A new setting, `SHOW_DRAFT_LESSONS`, is on only in demo mode, because none of the three Physics lessons has been approved yet; drafts keep their "Draft, not yet reviewed" badge. Outside demo mode it is off unless set explicitly. Criterion 3 is tested with it off.
- **No stored `status` or `icon` on `Subject`.** "Live" is worked out from whether the subject has lessons students may see, so it can never go stale. Icons are chosen in the web app from the subject code.
- **Criterion 5 returns 404, not 403,** with "You are not assigned to this class.", matching the existing rule that ids of other people's records are not confirmed.
- **Extra check in the Add subject dialog:** `GET /api/catalogue?classId=…` marks subjects the class already has (by any teacher), so the teacher sees "Already taught here" before sending.
- **Teacher class page for a "Coming soon" subject** explains that attendance with clearance starts when the first lesson is approved, instead of an empty topic list.
- **Demo roster:** a third teacher, Mr. Adeel Anwar (Chemistry and Biology for class A), and Mathematics for Mr. Kamran's class B.

Checks run: 39 backend tests (27 existing and 12 new), 16 Content Factory tests, and a browser journey (teacher request, admin approve and decline, student home, subject page, library, lesson, quiz header) at 390 px and 1280 px, light and dark, with no page errors.

Definition of done still open: accessibility and performance tooling (not set up yet, see roadmap tools), screenshot checks at 768 and 1024 px, a low-end phone test, and trying it with 2 real users.

## Release report

Filled in one week after release.
