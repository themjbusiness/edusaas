# F22: College admin console

Status: Built 2026-10-01 (signed off the same day under the instruction "continue with the whole development") · Owner: Muhammad Noor Khan · Last updated: 2026-10-01

Plan: [implementation plan, F22](../implementation-plan-subjects-languages-admin-parent.md#f22-college-admin-console-registering-teachers-students-and-admins) · Includes F5 (roster import) · Decisions: one role per phone number; free sign-in (D6)

## Problem

Today every teacher, student and parent is typed into the Django admin panel by the EduSaas team. That panel shows every college's data to whoever signs in, so it cannot be handed to a college. Colleges need to register and manage their own people, import a whole class from a spreadsheet, and approve teachers' "Add subject" requests, without ever seeing another college.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| College admin | Sign in to the app; add, edit, suspend and reactivate teachers, students and parents of **their college**; create classes; assign teachers to classes and subjects; import a roster from CSV; approve or decline subject requests; read their college's activity log | Anything belonging to another college (lists, ids, imports, requests, audit); the Django admin panel |
| EduSaas team (superuser) | Create a college and its first admin (`create_college` command or the Django admin panel) | — |
| Teacher, student, parent | No change. Calling any admin endpoint returns 403 | — |

All admin queries are filtered by the admin's college on the server. An id from another college returns 404, never 403, so ids are not confirmed.

## Screens

**Phone (360 px)**, bottom bar: Home, People, Classes, Import.
- **Home:**
  - counts (teachers, students, parents, classes)
  - **Subject requests** waiting, with Approve and Decline (the Decline note is shown to the teacher)
  - the last 10 activity entries, with a link to the full log
- **People:**
  - tabs for Teachers, Students and Parents
  - a search box (name, phone or roll number)
  - each row shows name, phone, class or roll, and a Suspended badge
  - **Add** opens a form in a dialog; tapping a row opens the same form to edit or suspend
- **Classes:**
  - each class with its student count and teaching assignments
  - **New class**
  - **Assign teacher**, which picks a teacher and a subject of the class's grade
  - remove an assignment
- **Import:**
  - choose Students or Teachers, download the CSV template, paste or upload the file
  - **Check file** shows a row-by-row report (green or red with the reason)
  - **Import** saves everything or nothing
- **Empty, loading and error states** as in the rest of the app.

**Desktop (1200 px):** side menu; People as a table; the dialog centred.

## API and data changes

All endpoints are under `/api/admin/` and need the `college_admin` role. Every query is limited to `request.user.college`.

| Method and path | Purpose |
|---|---|
| `GET admin/overview` | Counts, pending subject requests, recent activity |
| `GET, POST admin/classes` | List classes; create one (`grade`, `stream`, `section`, `gender`, `academicYear`) |
| `GET, POST admin/people?role=&q=` | List or search; add a teacher, student or parent |
| `POST admin/people/<id>` | Edit name, phone, class or roll; suspend or reactivate (`active`, with a `reason` when suspending) |
| `GET, POST admin/assignments`, `DELETE admin/assignments/<id>` | Teaching assignments |
| `GET admin/subject-requests`, `POST admin/subject-requests/<id>/decide` | `{approve, note}`; uses the F20 rule (same college only) |
| `POST admin/imports` | `{kind: "students"/"teachers", csv}`: validate only, returns a report and an import id |
| `POST admin/imports/<id>/commit` | Save a validated import, all or nothing |
| `GET admin/audit` | The college's activity log, newest first |

Model and migration changes:
- **`AuditLog`:** college, actor, action, object type, object id, summary, time. Phone numbers in summaries are masked (`+92 3** ***0001`).
- **`ImportBatch`:** college, uploaded by, kind, rows (validated data), errors, status (`checked`/`committed`), counts.
- **Sign-in:** `college_admin` accounts sign in to the app with the same code flow. Superusers still use `/admin`.
- **Django admin:** the panel is for superusers only. College admin accounts are never staff.
- **New command `create_college "<name>" --admin-phone 03… --admin-name "…"`.**

**Roster CSV (students):** `class_grade, class_stream, class_section, roll_number, student_name, student_gender, student_phone, parent_name, parent_phone`. Checks:
- phones are valid and normalised, and not used by another college or another role
- the class exists in this college
- roll numbers are unique in the class, both in the file and in the database
- gender matches the class
- a parent with several children appears once, matched by phone

**Teacher CSV:** `teacher_name, teacher_phone, teacher_gender, subject, class_grade, class_stream, class_section` (subject by code or name). It creates the teacher if new, then the teaching assignment.

## Acceptance criteria

1. Given an admin of College A, when they list people, classes, requests or the audit log, then only College A records are returned.
2. Given an admin of College A, when they edit, suspend, assign or approve using a College B id, then the server returns 404 and nothing changes.
3. Given a teacher, student or parent token, when they call any `/api/admin/` endpoint, then the server returns 403.
4. Given a new teacher added by the admin, when they request a sign-in code, then they can sign in and see only their assigned classes.
5. Given a suspended student, when they request a code, then they are refused with the suspended message; when reactivated, they can sign in again.
6. Given a phone number already used by any account, when the admin adds a person with it, then the server returns 409.
7. Given a student CSV with a duplicate roll number, an unknown class and a bad phone, then the check reports each row with its reason, and commit is refused until a clean file is checked.
8. Given a clean student CSV, when committed, then students and parents exist with profiles in the right class, and a parent with two children is created once.
9. Given a committed or another college's import id, when committing, then the server refuses (409 or 404).
10. Given any add, edit, suspend, import, assignment or request decision, then an AuditLog row exists, and no full phone number appears in it.
11. Given a college admin account, when it tries the Django admin panel, then it is refused.
12. Given the admin approves a subject request in the app, then the teaching assignment is created (as in F20).

## Out of scope

- XLSX upload (Excel's "Save as CSV" is enough for now); undoing a committed import.
- Deleting people (suspend instead; records are kept).
- Activation code and PIN sign-in (F2), billing (F13), a principal dashboard (F10).
- Editing lessons or content.

## Risks and open questions

- **Bad imports.** A wrong file could create many wrong accounts. Mitigation: check first, all-or-nothing commit, and the audit log names who imported what.
- **Phone numbers reused across colleges.** A parent may have children at two colleges. For now one number belongs to one account and one college; the import reports the clash.

## Definition of done

- [x] Spec signed off, with out-of-scope items listed
- [x] Every acceptance criterion has a passing automated test
- [x] Access-rule tests pass: wrong role, wrong college, wrong class, not linked
- [ ] Screens checked at 360, 390, 768, 1024 and 1440 px in light and dark mode
- [ ] Accessibility checks pass, with no serious or critical issues
- [ ] Performance budget met on the low-end phone profile
- [ ] Works offline or fails with a clear message (no blank screens)
- [ ] English and Urdu text reviewed by a native speaker
- [ ] Content approved by a subject teacher (if students see it)
- [x] Errors are logged; personal data is not written to the logs
- [x] README or admin guide updated
- [ ] Tried by at least 2 real users; their issues fixed or logged

## Implementation notes

Built on 1 October 2026.

- **Code:** the endpoints live in `backend/lms/admin_api.py`; every query is filtered by the admin's college.
- **Demo admin:** Ms. Sana Javed (`+92 399 4440001`) is added by `seed_demo`. The `create_college` command sets up a new college and its first admin.
- **Imports:** the check stores the validated rows. The commit re-creates them inside one transaction; if anything changed since the check (for example a phone number was registered in between), nothing is saved and the admin is asked to check again.
- **Teacher import:** a teacher who appears on several rows is created once and gets one assignment per row.
- **Removing an assignment** keeps attendance and clearances already recorded.
- **Logs:** while building this, phone numbers and sign-in codes were removed from the server logs (a project rule); a test now checks it.

Checks run: 63 backend tests (14 new for F22, plus the log test), and a browser journey: real sign-in through the code screen, adding a teacher, assigning a subject, an import with an error and then a clean import, suspending a student with a reason, the activity log, and the new teacher signing in. Screens at 390 px and 1280 px. No page errors.

Definition of done still open: accessibility and performance tooling, screenshots at 768 and 1024 px, a low-end phone test, and real-user trials.

## Release report

Filled in one week after release.
