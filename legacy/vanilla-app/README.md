# Web app (student, teacher and parent)

This is the single-page app that students, teachers and parents use. It is served and powered by the
Django backend in [../backend](../backend). It no longer works when you open `index.html` directly;
start the demo with `start-demo.bat` in the project root. See the [project README](../README.md) for the
demo accounts and the demo script.

- `index.html`, `app.js`, `styles.css`: the app, with no build step and no framework, to keep it light on low-end phones.
- `media/`: page images and lesson audio. `python backend/manage.py import_lessons phy11` copies them
  in from the Content Factory output.

## How it talks to the server

| Screen | API |
|---|---|
| Language (F23) | `POST /api/me/language`; texts in `i18n.js` |
| Sign in | `POST /api/auth/otp` (registered numbers only), `POST /api/auth/verify` → bearer token |
| Student home, library | `GET /api/student/home` (subjects, pending clearances, next grade), `GET /api/student/subjects/<code>` (units and topics of one subject) |
| Lesson player | `GET /api/lessons/<id>`; played seconds are sent every 5 s to `POST /api/lessons/<id>/progress` and the server decides when the quiz unlocks |
| Quiz | `POST /api/lessons/<id>/quiz` (questions only, no answers), `POST /api/quiz/<attempt>/submit` (scored on the server) |
| Add subject (teacher) | `GET /api/catalogue?grade=11&classId=…`, `GET/POST /api/teacher/subject-requests`; the college admin approves in `/admin` |
| Teacher | `GET /api/teacher/assignments`, `GET/POST /api/teacher/assignments/<id>[/attendance]`, `POST /api/teacher/clearances/<id>/override`, `POST /api/teacher/students/<id>/parent-phone` |
| Parent | `GET /api/parent/home` (children with progress numbers and subjects), `GET /api/parent/children/<id>/subjects/<code>` (topic statuses), `POST /api/parent/settings` (weekly summary on or off) |
| Alerts log / messages | `GET /api/messages` |
| Phone alerts (F3) | `GET /api/push/key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe`; `sw.js` shows the notification |
| Teacher WhatsApp link (F3) | `POST /api/teacher/clearances/<id>/whatsapp-sent` |
| College admin (F22) | `GET /api/admin/overview`, `GET/POST /api/admin/people`, `POST /api/admin/people/<id>`, `GET/POST /api/admin/classes`, `GET/POST /api/admin/assignments`, `DELETE /api/admin/assignments/<id>`, `GET /api/admin/subject-requests`, `POST /api/admin/subject-requests/<id>/decide`, `POST /api/admin/imports`, `POST /api/admin/imports/<id>/commit`, `GET /api/admin/audit` |
