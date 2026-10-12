# F4: Offline lessons

Status: Draft | In review | Signed off | Building | Done · Owner: Antigravity · Last updated: 2026-10-08

## Problem

Students in Pakistan often have patchy or limited mobile data. They may have Wi-Fi at home or college, but lose connection while studying or commuting. If the app requires a constant connection, a drop will interrupt their lesson or fail to submit a quiz, causing frustration. We need to allow students to download lessons on Wi-Fi (with a size warning), play them offline, queue their listening progress and quiz answers, and sync automatically when they reconnect.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Student | Download their assigned lessons, view them offline, save progress locally, sync when online. | Access lessons from subjects or classes they are not enrolled in. |
| Teacher | N/A (Offline mode primarily focuses on student lesson player) | N/A |
| Parent | View cached progress when offline. | N/A |
| College admin | N/A | N/A |

## Screens

- **Phone (360 px):** 
  - **Lesson Player:** Displays an "Offline Ready" icon if downloaded. If offline and not downloaded, shows the offline banner: "You are offline. Reconnect to download this lesson."
  - **Download Dialog:** When tapping download on a lesson or unit, a bottom sheet appears warning about file size: "This unit is 45 MB. Download on Wi-Fi recommended."
  - **Subject Page:** Shows a download icon next to each unit.
- **Desktop (1200 px):** Same layout, download dialog appears centered.
- **Offline behaviour:** The PWA serves cached HTML/JS/CSS. Attempting to view un-cached media fails with a clear message. Queued actions (like quiz submissions or progress updates) show a "Saved offline, waiting to sync" toast.

## API and data changes

| Method and path | Who can call it | Request | Response | Errors |
|---|---|---|---|---|
| `POST /api/sync/` | Student | `{ "progress": [...], "quizzes": [...] }` | 200 OK, `{ "synced": true }` | 400 Bad Request, 401 Unauthorized |

Model or migration changes:
- No major DB schema changes needed on the backend, as the sync payload will just translate to existing progress/clearance endpoints.
- **Frontend changes:** Heavy reliance on Workbox (Service Worker) for asset caching, and IndexedDB (e.g. `idb` or `dexie`) for queuing offline mutations.

## Acceptance criteria

1. Given a student on Wi-Fi, when they tap "Download unit", then a warning shows the size, and upon confirmation, the audio and image assets are cached.
2. Given a student who has downloaded a lesson, when they turn off internet and open the lesson, then the page image and audio play seamlessly.
3. Given a student offline, when they finish the lesson and submit the quiz, then the UI shows a "Saved offline" toast and records the answers in IndexedDB.
4. Given a student with queued quiz answers, when they regain internet access, then the Service Worker/app syncs the answers to the backend and updates their clearance status.
5. Given a student attempting to view an un-cached lesson while offline, when they open the page, then they see the "Offline" banner and the content is blocked gracefully.

## Out of scope

- Peer-to-peer lesson sharing between students over Bluetooth/Wi-Fi Direct.
- Offline teacher attendance (teachers usually have reliable college Wi-Fi or data).
- Background Sync API for older browsers (we will use app-foreground sync for simplicity and iOS compatibility).

## Risks and open questions

- **Storage limits:** Phones with full storage may fail to cache media. We need a graceful fallback or a "Storage full" error.
- **iOS constraints:** Safari restricts PWA storage. Will need to ensure media caches don't get arbitrarily wiped too quickly.

## Definition of done

- [ ] Spec signed off, with out-of-scope items listed
- [ ] Every acceptance criterion has a passing automated test
- [ ] Access-rule tests pass: wrong role, wrong college, wrong class, not linked
- [ ] Screens checked at 360, 390, 768, 1024 and 1440 px in light and dark mode
- [ ] Accessibility checks pass, with no serious or critical issues
- [ ] Performance budget met on the low-end phone profile
- [ ] Works offline or fails with a clear message (no blank screens)
- [ ] English and Urdu text reviewed by a native speaker
- [ ] Content approved by a subject teacher (if students see it)
- [ ] Errors are logged; personal data is not written to the logs
- [ ] README or admin guide updated
- [ ] Tried by at least 2 real users; their issues fixed or logged

## Release report

Filled in one week after release: what shipped, errors seen, usage, follow-ups.
