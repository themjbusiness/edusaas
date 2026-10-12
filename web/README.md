# Web app (students, teachers, parents, college admins)

React 18 + TypeScript (strict) + Vite. Django serves the build from `web/dist` at `/`; the API is under `/api/`
and lesson media under `/media/`. Built in roadmap F1, replacing the vanilla app now in [../legacy](../legacy).

```text
npm install
npm run dev      # http://localhost:5173, proxies /api and /media to Django on :8000
npm test         # unit tests (Vitest + Testing Library)
npm run build    # type-check, then build into dist/ (served by Django at /)
```

| Folder | What it holds |
|---|---|
| `src/ui/` | Components (Icon, Badge, Ring, Bar, Stat, Tabs, Sheet, Toast, Skeleton, ErrorCard, OfflineBanner, PhoneInput, AlertsCard). Gallery: `/#/gallery` |
| `src/screens/` | One folder per role: `student/`, `parent/`, `teacher/`, `admin/`, plus sign-in, messages and the gallery |
| `src/lib/` | Typed API client (`api.ts`), hash router, i18n (English keys, Urdu in `src/i18n/ur.json`), push, prefetch, formatting |
| `src/styles.css` | Design tokens (CSS variables, light and dark) and all styles. Apply new designs here and in `src/ui` |
| `public/` | Service worker (`sw.js`, phone alerts), web manifest, icon |

Budgets checked on 1 October 2026: 76 KB of compressed JavaScript (limit 150 KB); largest paint on a 3G-class
connection with a 4x slower CPU: sign-in 1.1 s, student home 1.4 s, lesson player 2.1 s (limit 2.5 s); no serious or
critical axe issues on 20 screens in light and dark.

## How the screens talk to the server

| Screen | API |
|---|---|
| Sign in | `POST /api/auth/otp` (registered numbers only), `POST /api/auth/verify` → bearer token |
| Student home, library, subject | `GET /api/student/home`, `GET /api/student/subjects/<code>` |
| Lesson player | `GET /api/lessons/<id>`; heard seconds go to `POST /api/lessons/<id>/progress` every 5 s with the narration track; the server decides when the quiz unlocks |
| Quiz | `POST /api/lessons/<id>/quiz` (questions only), `POST /api/quiz/<attempt>/submit` (scored on the server) |
| Teacher | `GET /api/teacher/assignments`, `GET/POST /api/teacher/assignments/<id>[/attendance]`, `POST /api/teacher/clearances/<id>/override`, `POST /api/teacher/clearances/<id>/whatsapp-sent`, `POST /api/teacher/students/<id>/parent-phone`, `GET/POST /api/teacher/subject-requests`, `GET /api/catalogue` |
| Parent | `GET /api/parent/home`, `GET /api/parent/children/<id>/subjects/<code>`, `POST /api/parent/settings` |
| College admin | `/api/admin/…`: overview, people, classes, assignments, subject requests, imports, audit |
| Everyone | `GET /api/me`, `POST /api/me/language`, `GET /api/messages`, `GET /api/push/key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe` |
