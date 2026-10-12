# Implementation plan: subjects, languages, admin registration and parent progress

As of 1 October 2026 · Status: built: F20, F21, F22 (with F5), F3, F23 and F12 (1 October 2026). Still open: native-speaker and teacher review of the Urdu content, real-device and real-user checks · Owner: Muhammad Noor Khan

## Summary

This plan adds four capabilities to the working demo, in this order:

1. **Multiple subjects** (F20): students, teachers and the library work with Physics, Chemistry, Biology, Maths and English, not only Physics.
2. **Parent progress view** (F21): a parent sees their child's progress by subject, quiz scores, attendance rate and a weekly summary (by web push and the in-app inbox, which are free).
3. **College admin console** (F22, includes F5 roster import): the college registers its own teachers, students and parents inside the app, limited to its own college.
4. **Urdu** (F12 narration and F23 interface): an Urdu narration track per lesson, Urdu app screens, and alerts in each parent's chosen language.

- **Effort:** about 9–11 weeks for two developers, plus content production that runs in parallel. All durations are estimates to confirm after the F20 spec.
- **Order:** F20 comes first because F21, F22 and F12 all depend on lessons being grouped by subject.
- **Rules that apply to every step:** each feature follows the seven-step quality process in [roadmap.md](roadmap.md#quality-process-for-each-feature). No code is written before its spec in `docs/features/` is signed off. Every endpoint checks role and relationship on the server, and every access rule gets a test that tries to break it.

## How the four requests map to the roadmap

| Request | Feature | New or existing | Phase in the roadmap |
|---|---|---|---|
| Options for other subjects | **F20** Multi-subject catalogue (structure and screens) | New | Moves into Phase 1 |
| | F8 Full syllabus production (the content itself) | Existing | Phase 2 (starts in parallel now) |
| Other languages | **F12** Urdu narration option | Existing | Phase 2 |
| | **F23** Urdu interface and parent message language | New | Phase 2 |
| Register teachers and admins | **F22** College admin console | New; absorbs F5 roster import and the "admin limited to own college" part of F2 | Phase 1 |
| Parent tracking progress | **F21** Parent progress view and weekly summary | New | Phase 1 (weekly summary uses the web push built for F3) |

## Timeline

Estimates for two developers (A and B), one content producer, and subject teachers as reviewers.

```text
Week        1    2    3    4    5    6    7    8    9    10   11
Dev A       [F20 spec+build ][F22 admin console + roster import  ][F23 Urdu UI  ]
Dev B       [F20 ] [F21 parent progress][F12 Urdu narration pipeline+player ]
Content     [Chemistry Unit 1][Biology Unit 1][Maths Unit 1][English Unit 1][Urdu tracks]
Teachers         review ──────── review ──────── review ──────── review ──── review
Gates          G1 ▲              G2 ▲                  G3 ▲                 G4 ▲
```

| Gate | When | Passes when |
|---|---|---|
| G1 | End of week 2 | F20 done-list ticked; a second subject (Chemistry Unit 1) plays end to end in the demo |
| G2 | End of week 5 | F21 done; a parent checks their child's progress on a real phone without help |
| G3 | End of week 8 | F22 done; a college admin registers a teacher and imports a 40-student CSV without developer help; cross-college access tests pass |
| G4 | End of week 11 | F12 and F23 done; a native Urdu speaker has reviewed every screen and one full lesson |

---

## Before you start (every feature)

1. Copy [features/_template.md](features/_template.md) to `docs/features/F<N>-<name>.md` and fill it in from the sections below.
2. Get the spec signed off. Record the date in its Status line.
3. Run the existing checks so you start from green:

   ```text
   cd backend && python manage.py test lms
   cd content_factory && python -m pytest tests
   ```

4. Write the acceptance criteria as failing tests in `backend/lms/tests.py` first, including the access-rule tests listed for each feature.
5. Build the thin slice (model, migration, API, screen, test), then polish.
6. Test the screens at 360, 390, 768, 1024 and 1440 px, light and dark.
7. Update the README demo script and accounts table if the demo changes.

---

## F20: Multiple subjects

**Goal:** a student in *11th Pre-Medical A* sees every subject their class is taught. A teacher sees each class-and-subject they teach.

### What exists already

- `Subject` (name, grade) and `Lesson.subject` exist.
- `TeachingAssignment` links a teacher, a class and a subject.
- `student_lessons()` returns lessons for every subject assigned to the student's class, so the server side is mostly ready.
- The gaps are on screen: `GET /api/student/home` returns one `course` taken from the first lesson, and the Library hard-codes the 14 Physics units in `demo/app.js`.

### Data changes

| Change | Why |
|---|---|
| `Subject`: add `code` (e.g. `phy11`), `sort_order`, `icon`, `colour_token` | Stable ids for URLs and a consistent look per subject |
| New `Unit` model (subject, number, title, sort_order), or keep `unit_number`/`unit_title` on `Lesson` and derive units | The Library needs the full unit list, including units with no lessons yet. **Recommendation:** add `Unit` so "Coming soon" units come from data, not from code |
| Book config: one file per subject in `content_factory/books/` (`chem11.json`, `bio11.json`, …) | The factory already builds one book at a time |

### API changes

| Method and path | Who | Response change |
|---|---|---|
| `GET /api/student/home` | Student | Replace `course` with `subjects: [{code, name, done, total, pending}]`; keep `lessons` and `clearances` |
| `GET /api/student/subjects/<code>` | Student, only for subjects taught to their class | `{subject, units: [{number, title, lessons: [...], available}]}` |
| `GET /api/teacher/assignments` | Teacher | Already per subject; add `subject.code` |

### Screens

- **Student home:** one card per subject with a progress ring and a pending-clearance badge. Pending clearances stay at the top, whatever the subject.
- **Library:** subject tabs (horizontal scroll on phone, a list on desktop), then units, then topics. A unit with no approved lessons shows "Coming soon".
- **Lesson and quiz:** the subject name appears in the breadcrumb and quiz header.
- **Teacher:** "My classes" shows "11th Pre-Medical A · Chemistry" as a separate card from Physics.

### "Add subject" and Grade 12 (decision D4)

Subjects will be added over time, so the structure must not assume a fixed list.

- **Subject catalogue.** Every subject the EduSaas team offers is a `Subject` row, for Grade 11 and Grade 12, whether or not it has content yet. A subject with no approved lessons shows "Coming soon" wherever it appears.
- **Grade 12.** Grade 12 subjects are created in the catalogue now. Students and teachers of Grade 12 classes see their subjects as "Coming soon". The Library shows a "Grade 12, coming soon" section to Grade 11 students.
- **Teacher "Add subject".** Your rule is that the college decides who teaches what, so a teacher cannot give themselves a class. The flow is:
  1. On **My classes**, the teacher taps **Add subject**, picks a subject from the catalogue and one of the classes they already teach, and sends the request.
  2. The request shows as "Waiting for college admin" on the teacher's portal.
  3. The college admin sees it in **Admin → Requests** (F22) and approves or declines it. On approval, a `TeachingAssignment` is created and the subject appears on the portal of the teacher and of the class's students.
  4. If the subject has no content yet, it shows as "Coming soon", and the request is added to the EduSaas content queue so the team knows which subjects colleges want next.
- **Until F22 ships,** the EduSaas team approves requests in the Django admin panel.

| Data change | Purpose |
|---|---|
| `Subject.status`: `live` (has approved lessons) or `coming_soon` | Drives "Coming soon" labels without code changes |
| New `SubjectRequest` (teacher, school class, subject, status `pending/approved/declined`, decided_by, decided_at, note) | The teacher's request and the admin's decision, kept for audit |

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/catalogue?grade=11` | Teacher, college admin | Subjects offered, with status |
| `POST /api/teacher/subject-requests` | Teacher, only for classes they are already assigned to | Ask for a subject on a class |
| `GET /api/teacher/subject-requests` | Teacher | Their own requests and statuses |
| `GET /api/admin/subject-requests`, `POST /api/admin/subject-requests/<id>/decide` | College admin, own college only | Approve or decline |

### Acceptance criteria (become tests)

1. Given a class taught Physics and Chemistry, when a student opens home, then both subjects appear with correct done/total counts.
2. Given Biology is not taught to the student's class, when the student requests `/api/student/subjects/bio11`, then the server returns 404.
3. Given a Chemistry teacher, when they open the Physics assignment id of the same class, then the server returns 403 "You are not assigned to this class".
4. Given a draft (unapproved) lesson, when a student lists a subject, then the lesson is not shown.
5. Given an absence recorded in Chemistry, when the student opens home, then the pending card names the Chemistry topic.
6. Given a teacher assigned to 11th Pre-Medical A only, when they request a subject for 11th Pre-Engineering B, then the server refuses with 403 and no request is saved.
7. Given a pending subject request, when the teacher opens My classes, then the subject is shown as "Waiting for college admin" and is not yet usable for attendance.
8. Given a college admin of College B, when they try to approve a College A request, then the server returns 404.
9. Given an approved subject with no approved lessons, when a student opens home, then the subject card shows "Coming soon" and no lessons.
10. Given a Grade 12 class, when its student opens home, then every subject shows "Coming soon".

### Content runbook: adding a new subject

Run for each subject (Chemistry first). Keep textbook pages internal until the National Book Foundation grants permission (change register CR-02).

1. Put the textbook PDF in the project root. Create `content_factory/books/chem11.json`, copying `phy11.json`, and set `pdf`, `subject`, `voice` and the units and lessons with their page numbers. Check the page numbers against the PDF by eye; the PDFs are scans with no text layer.
2. Draft the script and quiz:
   - with Claude: `python factory.py build chem11 --source claude --only <lesson-id>` (needs `ANTHROPIC_API_KEY`, model `claude-opus-5-5`), then copy the script into `authored/<lesson-id>.json`; or
   - by hand in `authored/<lesson-id>.json`.
3. Build: `python factory.py build chem11`, then `python factory.py status chem11`. Check that audio is under 5 MB per lesson and the quiz pool has at least 8 questions.
4. Teacher review: the subject teacher listens and reads each lesson, then
   `python factory.py review chem11 <lesson-id> --approve --by "<teacher name>"`
   or `--request-changes --comment "…"`. Fix, rebuild, repeat.
5. Export and import: `python factory.py export chem11 --approved-only`, then `cd backend && python manage.py import_lessons chem11`.
6. In the admin panel, add a `TeachingAssignment` so the subject is taught to the pilot class.
7. Smoke test: sign in as a student of that class, play a lesson, pass the quiz.

**Estimate:** 2 weeks of development (1.5 weeks plus the add-subject request flow). Content is about 1–2 days per unit per subject, plus teacher review time.

---

## F21: Parent progress view

**Goal:** a parent sees how their child is doing without asking the college, and gets a short weekly summary in the app and as a push notification.

### What exists already

`GET /api/parent/home` returns each child's clearances and last 10 attendance records. The parent screen shows the clearance status, a 7-day attendance strip and WhatsApp messages.

### API changes

| Method and path | Who | Response |
|---|---|---|
| `GET /api/parent/home` | Parent | Add per child: `subjects: [{name, done, total, avgScore}]`, `attendanceRate30d`, `clearedWithinDays` (median) |
| `GET /api/parent/children/<id>/subjects/<code>` | Parent, **only for their own child** | Topics with status (not started, listening, quiz passed and score, missed and cleared) |

No new tables. The data comes from `LessonProgress`, `QuizAttempt`, `Attendance` and `Clearance`.

### Weekly summary (free channels, decision D6)

- A management command `send_weekly_summaries` runs every Sunday at 18:00 Pakistan time, from cron or the host's scheduler.
- One summary per parent per child:
  *"Ali this week: present 5 of 6 days. 1 missed lecture, cleared in 1 day. Physics 3/3 topics, Chemistry 1/4."*
- **Delivery:** a web push notification (free) to parents who have installed the app and allowed notifications, and always a copy in the parent's in-app inbox. It uses the parent's language (F23).
- **No automatic WhatsApp or SMS**, because both cost money (D6). For parents without push, the teacher's weekly class screen offers an optional "Send summaries on WhatsApp" list: one tap per parent opens WhatsApp with the text filled in.
- Parents can turn the summary off in the app. The opt-out is stored on the parent's record.

### Screens

- **Parent home, one card per child:** a status line (Up to date / Clearance pending), subject progress bars, 30-day attendance percentage, and "last active" (the child's last lesson or quiz).
- **Child detail:** tap a subject to see its topics with scores. Read-only, with no buttons that change anything.
- **Empty state:** "No lessons started yet" rather than 0%.

### Acceptance criteria

1. Given a parent linked to Ali, when they open Ali's Physics detail, then they see each topic's status and best score.
2. Given a parent **not** linked to Bilal, when they request Bilal's detail by id, then the server returns 404 (never 403, so the id's existence is not revealed).
3. Given a parent with two children, when they open home, then each child has their own card and numbers.
4. Given the weekly job runs twice in one week, then each parent gets only one summary (idempotent).
5. Given a parent who opted out, when the job runs, then no message is sent and the log records "skipped: opted out".

**Estimate:** 1.5 weeks, plus about 1 week for web push and the weekly summary (web push is also used by F3).

---

## F22: College admin console (registering teachers, students and admins)

**Goal:** the college registers and manages its own people in the app. The EduSaas team never types rosters, and a college admin can never see another college.

### Who registers whom

| Who | Can register | How |
|---|---|---|
| EduSaas team (Content admin, Django admin panel) | A new college and its first college admin | `/admin`, or `python manage.py create_college "<name>" --admin-phone 03xx… --admin-name "…"` (new command) |
| College admin | Teachers, students, parents, classes, teaching assignments, other college admins in the same college | The new **Admin** area in the app, or a CSV import |
| Teacher | Nothing new; can only correct a parent's phone number (exists) | — |
| Anyone else | Nobody. There is no public sign-up. | Unregistered numbers stay refused |

### Data changes

| Change | Why |
|---|---|
| `AuditLog` (actor, college, action, object type and id, before/after summary, time) | Every add, edit, suspend and import is traceable. Phone numbers are masked in the log (`+92 3** ***0001`) |
| `ImportBatch` (college, uploaded by, file name, row counts, errors JSON, status) | Shows the validation report, and lets an admin undo a bad import |
| `User.language` (`en` or `ur`, default `en`) | Needed by F23; added here to avoid a second migration on User |

### API (all under `/api/admin/`, role `college_admin`, every query filtered by `request.user.college`)

| Method and path | Purpose |
|---|---|
| `GET/POST /api/admin/classes` | List and create classes |
| `GET/POST /api/admin/people?role=teacher|student|parent` | List (search, paging) and add a person |
| `PATCH /api/admin/people/<id>` | Edit name, phone, class or roll; suspend or reactivate (`is_active`). Never hard-delete |
| `GET/POST/DELETE /api/admin/assignments` | Link a teacher to a class and subject |
| `POST /api/admin/imports` (CSV or XLSX upload) | Validate only, returning a row-by-row report. Nothing is saved yet |
| `POST /api/admin/imports/<id>/commit` | Save a validated import |
| `GET /api/admin/audit` | Recent changes in this college |

### Roster import format

One file, one row per student, with a downloadable template in the Admin area:

```text
class_grade, class_stream, class_section, roll_number, student_name, student_gender, student_phone, parent_name, parent_phone, parent_language
11th, Pre-Medical, A, 11A-01, Ali Raza, male, 03001234567, Fatima Raza, 03007654321, ur
```

- **Validation:**
  - phones normalised to `+92…`
  - no duplicate roll numbers per class
  - a student's phone must not already belong to another college
  - class gender matches student gender
  - a parent with several children is matched by phone number
- **Errors:** the report lists each bad row with the reason. The admin fixes the file and uploads again. Commit is all-or-nothing.
- **Teachers:** a second template (`teacher_name, phone, subject, class_grade, class_stream, class_section`).

### Screens (Admin area, desktop-first but usable on a phone)

- **People:** tabs for Teachers, Students and Parents; search; an "Add" button opens a form in a side sheet; suspend with a reason.
- **Classes:** each class with its students and teaching assignments.
- **Import:** upload, then a validation report (green, amber and red rows), then Commit.
- **Activity:** the audit log.

### Acceptance criteria

1. Given a college admin of College A, when they list people, then only College A people are returned.
2. Given a college admin of College A, when they PATCH a College B student by id, then the server returns 404 and writes nothing.
3. Given a teacher or student token, when they call any `/api/admin/` endpoint, then the server returns 403.
4. Given a CSV with one duplicate roll number, when validated, then the report flags that row and commit is refused until it is fixed.
5. Given a newly registered teacher, when they request a code, then they can sign in and see only their assigned classes.
6. Given a suspended student, when they request a code, then they are refused with "This account is suspended. Please contact your college."
7. Given any add, edit or suspend, then an AuditLog row exists, and no full phone number appears in it.
8. The Django admin panel is limited to the EduSaas team (superusers). College admins use only the in-app Admin area.

**Estimate:** 3 weeks (the import validation takes the most time).

### Runbook: onboarding a new college (after F22)

1. The EduSaas team runs `create_college`, then sends the college admin the sign-in link.
2. The college admin signs in with their phone and code, opens **Admin → Import**, and downloads both templates.
3. The college fills in the student and teacher files from its own records.
4. They upload, fix the red rows, and commit.
5. Spot check: the admin opens two random students and confirms class, roll and parent phone.
6. The EduSaas team checks the audit log and that every class has at least one teaching assignment.
7. Teachers sign in and take their first attendance. The first alerts reach parents by push and inbox, and teachers send the one-tap WhatsApp links.

**Before F22 shipped (1 October 2026):** people were registered in `/admin`. Now the college admin does this in the app.
- **Teacher:** add a *User* (role Teacher, college, phone in `+923…` format), then a *Teaching assignment* (teacher, class, subject).
- **Student:** add a *User* (role Student), then a *Student profile* (class, roll number, parent).
- **Parent:** add the parent *User* first (role Parent).

---

## F12 and F23: Urdu

### F12: Urdu narration track

- **Content factory:**
  - Each lesson gets an optional second script in Urdu script (`sections_ur`), narrated with `ur-PK-AsadNeural` (or `ur-PK-UzmaNeural`).
  - The existing Roman Urdu track stays as the default "English mix".
  - `factory.py build <book> --lang ur` builds only the Urdu track.
- **Review:** the subject teacher approves the Urdu track separately. It is only shown to students once approved.
- **Data:** `Lesson.tracks = {"mix": {audio, sections, duration}, "ur": {…}}`. Migrate the existing single track into `tracks.mix`.
- **Heard-time rule:** progress counts per track. Hearing 90% of either track unlocks the quiz. The server still decides the unlock.
- **Player:** a "Mix | اردو" toggle. The caption and transcript switch with the track and remember the student's choice.
- **Cost:** about 1 extra MB per lesson, and one extra review per lesson.

### F23: Urdu interface and message language

- **Strings:** every screen label goes into `demo/i18n/en.json` and `ur.json`. A header toggle switches language, saved to `User.language`.
- **Layout:** `<html lang="ur" dir="rtl">` when Urdu is on. Use CSS logical properties (`margin-inline-start`), mirror the back arrows, and use an Urdu font (Noto Nastaliq Urdu). Keep the textbook page and physics formulas left-to-right.
- **Parent messages:** every alert text (push notification, inbox and the "Send on WhatsApp" text) exists in English and Urdu, and uses `parent.language`. No Meta template approval is needed while messaging is free (D6).
- **Review:** a native Urdu speaker checks every screen at 360 px and 1440 px.

### Acceptance criteria

1. Given a lesson with only the mix track approved, then the Urdu toggle is hidden.
2. Given a student who hears 90% of the Urdu track, then the quiz unlocks.
3. Given a parent with language `ur`, when their child is marked absent, then the push notification, the inbox message and the WhatsApp link text are in Urdu.
4. Given the Urdu interface, then no screen at 360 px has text overflowing or overlapping, as checked by screenshot tests.

**Estimate:** F12 2 weeks of development plus narration and review per lesson; F23 2 weeks.

---

## Release runbook (every feature)

1. All checks green: backend tests, factory tests, and the browser journey at five sizes.
2. Second-developer review. The owner reviews the screens.
3. Back up the database: `cp db.sqlite3 backups/db-<date>.sqlite3` now, or `pg_dump` after F6.
4. Deploy with the feature switch **off**. Run migrations (`python manage.py migrate`).
5. Turn the switch on for the demo college only. Run the smoke test for that feature.
6. Watch errors and usage for one week. Write the release report at the bottom of the feature spec.
7. **Rollback:** turn the switch off. If a migration must be reversed, restore the backup from step 3.

## Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Content is the bottleneck, not code | Subjects show "Coming soon" for months | Start Chemistry Unit 1 in week 1; one producer; teachers booked for review in advance |
| Textbook permission (CR-02) not granted | New subjects can't show page images | Keep the demo internal; plan an audio-only fallback |
| A college admin sees another college's data | Loss of trust, legal risk | Every admin query filtered by college; cross-college tests are required to merge |
| Roster files are messy | Import fails at onboarding | Validate first, clear per-row errors, a downloadable template, all-or-nothing commit |
| Urdu script voice mispronounces technical words | Students confused | Keep English terms in Latin script inside the Urdu narration; teacher review |
| Free alerts reach fewer parents (D6) | Parents who never install the app miss automatic alerts | Onboard parents at the first parent-teacher meeting (install the app, allow notifications); teachers use the one-tap WhatsApp links for the rest; track the share of parents with push enabled |
| Teachers skip the one-tap WhatsApp step | Some parents are never told | Show "3 parents not yet notified" on the teacher's class screen until they are sent or dismissed |

## Decisions

Roadmap decisions D1–D8 (30 September 2026) already settle several points: subjects are added over time with a teacher request and admin approval (D4), Grade 12 shows as "Coming soon" (D4), messaging uses free channels only (D6), and textbook rights are deferred (D7). See [roadmap.md](roadmap.md#decisions).

| # | Decision | Status |
|---|---|---|
| 1 | Content order after Physics | **Decided (D4):** Chemistry, then Biology and Maths; English and Grade 12 later |
| 2 | Add a `Unit` model, or derive units from lessons | **Decided:** add `Unit` |
| 3 | Can a college admin also be a teacher on the same phone number | **Decided:** no. One role per phone number |
| 4 | Weekly summary day and time | **Decided:** Sunday 18:00 PKT |
| 5 | Default narration for new students | **Decided (D5):** English mix now; Urdu option in Phase 2 |
| 6 | Who reviews Urdu content | **Decided:** the subject teacher reviews the Urdu track, as for the English mix track |
| 7 | Free sign-in method (from D6) | **Decided:** now, a one-time activation code from the college, then a PIN on the device. Later, add Google sign-in and school-issued login credentials (username and password created by the college admin). Every method only signs in people the college has registered |
