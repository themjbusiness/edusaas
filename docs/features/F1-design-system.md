# F1: Design system and responsive shell (React + TypeScript + Vite PWA)

Status: Built 2026-10-01: all 7 steps, including the switch-over (approved: "continue with the rest") · Signed off 2026-10-01 (instructions "continue with the whole development" and "continue with F1") · Owner: Muhammad Noor Khan · Last updated: 2026-10-01

Roadmap: [Responsive UI rebuild](../roadmap.md#responsive-ui-rebuild) · Decision D1 (React + TypeScript + Vite PWA), D2 (no separate app) · Designs: [Stitch prompt pack](../stitch-ui-prompts.md)

## Problem

The web app is about 1,900 lines of hand-written JavaScript in one file, building HTML from strings. It works and is tested in the browser, but it has no components, no types and no unit tests, so every change risks breaking another screen. A team can't safely share it. It also can't take the Stitch designs without rewriting screens by hand. F1 rebuilds it on React, TypeScript and Vite, as a set of reusable components on design tokens, next to the current app, so the demo never breaks.

## Users and access rules

No change. Every rule is enforced by the Django API, which the new app calls unchanged. The new app only decides what to show for the signed-in role, as the current app does.

## Screens

- **Built next to the current app:** the new app is served at `/app/`, while the current app stays at `/`. Screens move over in the roadmap's order:
  1. **Foundation:** tokens, components, the gallery page `/app/#/gallery`, and the app shell (header, bottom tab bar on phones, side rail at 960 px and up, theme, language and right-to-left).
  2. **Sign-in, student home, subject, library.**
  3. **Lesson player, quiz and result.**
  4. **Parent:** home, child detail, messages.
  5. **Teacher:** classes, attendance and clearance, dialogs, alerts log.
  6. **College admin:** home, people, classes, import, activity.
  7. **Switch-over:** `/` serves the new app once its browser tests pass, and the old app is removed.
- **Look:** the same as today (same tokens), so the switch is invisible to users. The Stitch designs are applied afterwards through the tokens and components.

## API and data changes

None to the API. Frontend structure:
- `web/`: a Vite project (React 18, TypeScript in strict mode).
- `web/src/tokens.css`: the design tokens.
- `web/src/ui/`: components.
- `web/src/screens/`: one folder per role.
- `web/src/api.ts`: a typed API client.
- `web/src/i18n/`: English keys and Urdu, moved from `demo/i18n.js`.
- **Build:** `npm run build` outputs to `web/dist`. Django serves it at `/app/`. In development, Vite proxies `/api` and `/media` to Django.
- **Service worker and manifest:** reused from F3 (push).

## Acceptance criteria

1. Given `npm run build`, then the first load is at most 150 KB of compressed JavaScript.
2. Given the gallery page, then every component renders at 360, 768 and 1440 px, in light, dark and right-to-left.
3. Given each migrated screen, then a browser test signs in as the right role and completes the same journey as on the old app (for example, mark absent, listen, pass the quiz, cleared).
4. Given a role opening another role's route, then it is redirected to its own home (as today); the API still refuses the data.
5. Given `npm test`, then the component and API-client unit tests pass, and TypeScript reports no errors.
6. Given Urdu, then migrated screens are right to left with the same translations as the old app.

## Out of scope

- New features or new screens (only what exists today).
- Offline lessons (F4) and the free sign-in method (F2).
- Generating the API client from an OpenAPI schema. The client is typed by hand for now; adding the schema is a follow-up.

## Risks and open questions

- **Stitch designs arrive after the foundation.** Mitigation: everything visual comes from tokens and a small set of components, so applying the designs changes those, not every screen.
- **Two apps for a while.** Mitigation: the old app stays the default until every screen has moved over and the browser tests pass; then it is removed in one step.

## Definition of done

- [x] Spec signed off, with out-of-scope items listed
- [x] Every acceptance criterion has a passing automated test
- [x] Access-rule tests pass: wrong role, wrong college, wrong class, not linked
- [x] Screens checked at 360, 390, 768, 1024 and 1440 px in light and dark mode
- [x] Accessibility checks pass, with no serious or critical issues
- [x] Performance budget met on the low-end phone profile
- [ ] Works offline or fails with a clear message (no blank screens)
- [ ] English and Urdu text reviewed by a native speaker
- [ ] Content approved by a subject teacher (if students see it)
- [x] Errors are logged; personal data is not written to the logs
- [x] README or admin guide updated
- [ ] Tried by at least 2 real users; their issues fixed or logged

## Implementation notes

1 October 2026: steps 1–6 built; every screen of the current app now exists in `web/`.

- **Code:** about 2,000 lines of TypeScript.
  - `src/ui` holds the components (Icon, Badge, Ring, Bar, Stat, Tabs, Sheet, Toast, Skeleton, ErrorCard, OfflineBanner, PhoneInput, AlertsCard).
  - `src/screens` holds 18 screens across sign-in, student, parent, teacher and admin.
  - `src/lib` holds the typed API client, hash router, i18n, formatting, push and the `useLoad` hook.
- **Same look:** `styles.css` is carried over unchanged, so the switch is invisible. The Stitch designs ([prompt pack](../stitch-ui-prompts.md)) will be applied through these tokens and components.
- **Same URLs:** routes use the same hashes (`#/lesson/u1-estimation`). The service worker, manifest and icons are shared with the current app at the site root.

Checks run:
- `tsc` strict: no errors.
- 12 unit tests (i18n, router, API client errors and 401 sign-out, dialog, sign-in validation).
- Build: 77 KB of compressed JavaScript against a 150 KB budget (acceptance 1).
- Browser journey on `/app/`, 25 checks, all passing with no page errors (acceptance 3, 4, 6):
  - a stranger is refused
  - the teacher marks an absence and uses the WhatsApp link
  - the student plays the lesson, switches to Urdu narration and passes the quiz, getting Cleared
  - the student is redirected away from the admin route
  - the teacher sees the tick
  - the parent home and the child's subject detail
  - the admin adds a teacher, and an import is refused, then committed
  - the Urdu interface
  - the gallery at 360, 768 and 1440 px, light, dark and right to left, with no overflow (acceptance 2)
- 76 backend tests still pass.

**Finished the same day (steps 6–7):**
- **Remaining journeys:** a second browser suite (20 checks) covers the page zoom, page tabs, the locked quiz, the override and parent-phone dialogs with their validation, the add-subject request, the parent's weekly switch and sign-out, the admin declining a request, suspending and reactivating a student, and creating a class, then assigning and removing a teacher. All pass.
- **Accessibility:** axe (WCAG 2.2 AA rules) on 20 screens, light and dark: 0 serious or critical issues. To get there, the colour-contrast failures were fixed:
  - a darker teal for text (`--accent-ink`)
  - a darker WhatsApp green
  - greyed items dimmed with colour instead of opacity
- **Performance:** measured with Chrome throttled to a 3G-class network (1.6 Mbps, 150 ms) and a 4× slower CPU. Lighthouse itself could not paint in headless mode on Windows. To meet the 2.5 s budget:
  - The server now gzips text (JavaScript dropped from 246 KB to 76 KB on the wire), and Vite's hashed files are cached for a year.
  - The Content Factory makes 600 px phone versions of pages (about 40% smaller); wide screens and the zoom view keep the full page.
  - The first screen's data and the lesson's first page are fetched while the app checks the session.

  | Screen | Before | After |
  |---|---|---|
  | Sign-in | 2.09 s | 1.09 s |
  | Student home | 2.46 s | 1.37 s |
  | Lesson player | 4.07 s | 2.07 s |
- **1024 px:** no horizontal overflow on the lesson player, teacher and student home screens.
- **Switch-over:**
  - The web app is served at `/` (Vite base `/`).
  - `/app/…` redirects to `/`.
  - The service worker, manifest and icon moved to `web/public`.
  - Lesson media moved from `demo/media` to `media/`, served at `/media/` with that folder as the root, so `../` cannot leave it (tested).
  - The old app moved to `legacy/vanilla-app/`, which is not served.
  - Both browser suites and the speed check were rerun against `/`: all pass.

**Still open:**
- applying the Stitch designs
- the OpenAPI-generated client
- tests on a real low-end phone and with real users
- native-speaker review of the Urdu

## Release report

Filled in one week after release.
