# EduSaas Roadmap: LMS Research, Features and Responsive UI

As of 30 September 2026 · Status: decisions D1–D8 recorded (D7 deferred); features in progress one at a time

## Summary

Don't try to become Moodle or Canvas. Win on one job no general LMS does: making sure every absent FBISE student catches up on the exact textbook lesson they missed, with proof for the teacher and the parent. Build the rest of a normal LMS only where it serves that loop.

- **Strategy:** a narrow product with depth. The absence → narrated lesson → quiz → clearance → parent loop is the core. Each new feature must make that loop more trusted, cheaper to run or easier to sell to a principal.
- **Order:** first harden what exists for a real pilot college (security, parent alerts on free channels, offline lessons, the responsive UI). Then add the features that competitors prove schools expect: mastery-based remediation, analytics for the principal, and AI practice checked by a teacher.
- **Stack:** keep Django and PostgreSQL. Rebuild the web app as a mobile-first installable app (PWA) in React and TypeScript, built with Vite. It ships as one codebase for phone, tablet and desktop, with no separate Android app until the pilot proves demand.
- **Method:** one feature at a time, each as a thin working slice from database to screen. Each slice goes through the same quality gate: a one-page spec, acceptance criteria written as tests, an access-rule test, a device test on a low-end Android phone, and review by a teacher where content is involved. Nothing merges without passing the gate.
- **Next step:** the decisions at the end of this doc are recorded. We start with feature F1 (the design system and responsive shell), because every later feature builds its screens on it.

## What popular LMSs do

The big LMSs all use role-based home screens, have parent visibility and offline mobile access, and now add AI that a teacher reviews before students see it. None of them does textbook-exact catch-up for absent students, which is EduSaas's opening.

| Product | Who it serves | What it does best | Copy for EduSaas | Avoid |
|---|---|---|---|---|
| [Google Classroom](https://workspaceupdates.googleblog.com/2026/07/redesigned-google-classroom-homepage-with-tailored-views-based-on-users-role.html) | Schools worldwide, free with Workspace | Role-based homepage (Teaching, Enrolled, Admin, rolled out from July 2026); Gemini drafts quizzes and feedback for teachers | A separate home per role; a teacher dashboard that shows who has not done the work | General-purpose assignment flow that knows nothing about the syllabus |
| [Canvas](https://raccoongang.com/blog/what-is-canvas-lms/) | Universities and large districts, paid licence | Separate Student, Teacher and Parent apps; SpeedGrader; analytics; Mastery Paths (the next task depends on the quiz score; from memory) | Mastery Paths logic for failed quizzes; a read-only parent view | Three separate apps and a heavy admin setup |
| [Moodle](https://docs.moodle.org/502/en/Moodle_app_offline_features) | Open source, self-hosted, everywhere | Offline app: download a course, do activities offline, sync every 10 minutes; warns before large downloads on mobile data | Download a lesson on Wi-Fi, study offline, sync progress later; file-size warnings | Plugin sprawl and a dated, complex UI |
| [Khan Academy / Khanmigo](https://blog.khanacademy.org/new-ai-tools-bring-interactive-diagrams-and-targeted-practice-thanks-to-khan-academys-partnership-with-google-org/) | Students and teachers, AI tutor | AI-generated MCQs that teachers review, refine and curate before assigning; reports on strengths and gaps | Teacher approval before any AI question reaches students (our factory review already does this) | Open chat tutors that can drift off syllabus |
| [Maqsad](https://maqsad.io/) | Pakistani students, MDCAT/ECAT/O-Level (direct to consumer) | Live classes, 15,000+ MCQs per exam, mock tests, instant doubt solving, 4M+ downloads | Big topic-wise question banks; doubt solving later | Selling to students rather than colleges; video-heavy data use |
| [Taleemabad](https://www.unesco.org/en/dtc-financing-toolkit/taleemabad) | Pakistani primary schools, funded by partners | Scripted lesson plans, teacher training, AI grading, dashboards for school leaders | Dashboards for the principal; teacher onboarding built in | Donor-dependent funding model |
| [ClassDojo](https://blog.classdojo.com/introducing-classdojo-translate/) | Primary schools, parent communication | One-tap translation of posts and messages (34 languages at launch) | Messages to parents in Urdu or English, as each parent chooses | A social feed; it adds moderation work |

Across all of them:

- **Parents read, they don't manage.** The Canvas Parent app is for watching, not doing. Our parent screen should stay read-only, plus a reply channel through WhatsApp.
- **AI output goes through a teacher.** Khan Academy and Google both frame AI as a draft for the teacher. This supports our rule that no lesson or quiz reaches students before a teacher approves it.
- **Offline is a first-class mode.** Moodle's offline app is its main advantage in low-bandwidth regions, and that describes most of our students.

## Where EduSaas stands today

The core loop works from end to end in the demo: 76 backend tests, 19 Content Factory tests and a three-person browser test pass. What's missing is production depth: real messaging, offline use, a responsive layout above phone size, and the analytics and admin tools that principals expect.

| Area | In the demo today | Gap before a paying college |
|---|---|---|
| Sign-in and access | Registered numbers only, OTP, per-relationship checks on the server | Free sign-in by activation code and PIN (D6), a college admin limited to their own college, encrypted phone numbers (CR-18), audit log of admin actions |
| Content | 3 narrated lessons (Unit 1 Physics); pipeline with a review status | Full syllabus; a review screen for teachers instead of the command line; Urdu voice option; textbook rights (CR-02) |
| Absence and clearance | Attendance, clearance, quiz unlocks at 90% heard, teacher override | Mastery path after a failed quiz; weekly class report; bulk attendance for many classes |
| Parent messaging | Simulated WhatsApp with SMS fallback, 5 per day limit | Free channels (D6): web push, in-app inbox and one-tap WhatsApp links; Urdu or English per parent; opt-out |
| Student app | Lesson player, quiz, home screen | Offline download and sync, practice mode outside clearance, streaks |
| Principal and admin | Django admin only | Principal dashboard, CSV roster import, term setup |
| UI | F1 done: React + TypeScript app at `/`, every screen, components and gallery, 12 unit tests, 76 KB JS, LCP ≤ 2.1 s on 3G, 0 serious axe issues | Apply the Stitch designs; OpenAPI-generated client; real-device tests |
| Operations | SQLite, development server | PostgreSQL, HTTPS hosting, R2 or CDN for media, backups, error monitoring |

## Feature catalogue

There are 23 features in total (F20–F23 were added on 30 September 2026; see [the implementation plan](implementation-plan-subjects-languages-admin-parent.md)): 9 must-haves (8 for the first paying college, plus billing before the second), 4 differentiators that make principals choose us, 4 for later and 2 to avoid. Each one gets its own deep-dive spec in [features/](features/) and goes through the quality gate. Edit the Tier column to re-rank.

| ID | Feature | What it includes | Why (evidence) | Tier | Phase |
|---|---|---|---|---|---|
| F1 | Design system and responsive shell | Tokens, 20 to 25 components, layouts for phone, tablet and desktop, installable PWA | Every later screen uses it; the current UI has one breakpoint | Must-have | 1 |
| F2 | Pilot-grade sign-in and security | Free sign-in (activation code and device PIN now; Google sign-in and school-issued credentials later, see D6), college admin limited to their college, encrypted phone numbers, audit log, rate limits at the edge | Selling trust to principals; CR-18 | Must-have | 1 |
| F3 | Parent alerts on free channels (D6) | Web push and in-app inbox; one-tap "Send on WhatsApp" links for the teacher or office; Urdu or English per parent; opt-out. A paid WhatsApp API and SMS can be added later behind the same interface | The parent alert is the moment the principal sees value | Must-have | 1 |
| F4 | Offline lessons | Download on Wi-Fi with a size warning, play offline, queue progress and quiz answers, sync later | Moodle's offline app; students on patchy mobile data | Must-have | 1 |
| F5 | Roster onboarding | CSV import of classes, students, parents and teacher assignments; term setup; validation report | A college will not type 800 students into Django admin | Must-have | 1 |
| F6 | Hosting and operations | PostgreSQL, HTTPS, R2 for media, daily backups, error monitoring, uptime alerts | Required for any real data | Must-have | 1 |
| F7 | Teacher review screen for content | Listen section by section, edit the script and quiz, approve or reject; replaces the command-line review | Khanmigo: teachers curate AI output before students see it | Must-have | 2 |
| F8 | Full syllabus production | All of 11th Physics, then Chemistry, Biology and Maths, then 12th; production tracking per chapter | No college buys three lessons | Must-have | 2 |
| F9 | Mastery path after a failed quiz | Replay the weak sections, a fresh question set, escalate to the teacher after 3 fails | Canvas Mastery Paths | Differentiator | 2 |
| F10 | Principal dashboard | Absence rate, clearance rate, median time to clear, by class and teacher; export | Google Classroom and Taleemabad admin dashboards | Differentiator | 2 |
| F11 | Teacher weekly report and at-risk list | Students with repeated absences or failed quizzes, sent every week | Google Classroom teacher dashboard | Differentiator | 2 |
| F12 | Urdu narration option | A second voice track per lesson; the student chooses | Comprehension for students who find English narration hard | Differentiator | 2 |
| F13 | Billing and multi-college setup | College sign-up, seats per term, invoices, a suspended state | Needed before the second college | Must-have | 3 |
| F14 | Practice mode and question bank | Topic practice outside clearance, past-paper MCQs | Maqsad's 15,000+ MCQs per exam | Later | 3 |
| F15 | Grounded doubt solving | Ask about the page; the answer quotes the textbook page; the teacher can see the questions | Khanmigo, kept on the syllabus | Later | 3 |
| F16 | Streaks and badges | Weekly streaks, a cleared-on-time badge | Engagement, low cost | Later | 3 |
| F17 | Homework photo submission | The student photographs written work; the teacher marks it | Canvas and Classroom core, but outside our loop | Later | 3 |
| F18 | Live classes and video lectures | Streaming classes | Maqsad does this; heavy on data and cost, off our focus | Avoid | none |
| F19 | Fees, timetable, full ERP | School management system | Colleges already have one; integrate by CSV instead | Avoid | none |
| F20 | Multi-subject catalogue | Subject cards on the student home, subject tabs in the library, units from data, per-subject teacher classes | Colleges teach 5+ subjects; one subject is not a product | Must-have | 1 |
| F21 | Parent progress view | Progress by subject, quiz scores, 30-day attendance, weekly summary by web push and inbox | Parents today see only clearance status | Differentiator | 1 |
| F22 | College admin console | In-app registration of teachers, students and parents; CSV import (F5); suspend; audit log; limited to own college | Colleges must register their own people; the Django admin sees every college | Must-have | 1 |
| F23 | Urdu interface and message language | Urdu screens (right-to-left), parent chooses Urdu or English for alerts | Many parents read Urdu more easily than English | Differentiator | 2 |

## Roadmap by phase

There are three phases, and each ends at a gate the team checks before moving on. Getting to a pilot-ready product takes about 10–12 weeks for 2–3 developers, then one term of piloting at one college, then scaling out. The durations are estimates; the gate targets are proposals for the team to set.

```text
Phase 1: Pilot-ready base   ──▶   Phase 2: Pilot term        ──▶   Phase 3: Scale out
about 10–12 weeks (estimate)      one college, one term              from the second college
F1 F2 F5 F3 F4 F6                 F7 F8 F9 F10 F11 F12               F13 F14 F15 F16 F17, more subjects, 12th
        │                                 │                                  │
   Gate 1: ready for pilot           Gate 2: ready to sell              Gate 3: ready to scale
```

| Phase | Features (in order) | Gate to leave the phase |
|---|---|---|
| 1. Pilot-ready base (about 10–12 weeks, estimate) | F1 Responsive design system, F2 Sign-in and security, F5 Roster onboarding, F3 Parent alerts on free channels, F4 Offline lessons, F6 Hosting and operations | **Ready for pilot:** all F1–F6 done-lists ticked; security review passed; Units 1–2 approved by a teacher |
| 2. Pilot term (one college, one term) | F7 Teacher review screen, F8 All of 11th Physics, F9 Mastery path, F10 Principal dashboard, F11 Weekly teacher report, F12 Urdu narration option | **Ready to sell:** 80% of absences cleared within 7 days; the principal agrees to renew; no access-rule incidents |
| 3. Scale out (from the second college) | F13 Billing and multi-college, F14 Practice and question bank, F15 Grounded doubt solving, F16 Streaks and badges, F17 Homework photos, more subjects and 12th class | **Ready to scale:** 3 colleges live; support load per college stays flat as we grow |

Features inside a phase run one at a time, in the order shown, each through the quality process below. Phase 2 starts only when Gate 1 is met, even if some Phase 1 polish is still left.

## Responsive UI rebuild

Rebuild the web app as a mobile-first PWA in React, TypeScript and Vite. Build it next to the current app and switch over screen by screen, so the working demo is never broken.

### Stack decision

| Option | For | Against | Verdict |
|---|---|---|---|
| Keep vanilla JS | No build step, very small | 685 lines already; no components, types or tests for the UI; hard for a team to share | Stop here |
| Next.js (the blueprint's choice) | Popular, good tooling | Server rendering adds nothing when every screen is behind a login; needs a Node server; offline support is harder | Not needed |
| **React + TypeScript + Vite PWA** | Static files served from a CDN; mature offline tooling (Workbox); typed API client; large hiring pool in Pakistan | A build step | **Recommended** |

The Django API stays. Add an OpenAPI schema to it (for example with Django Ninja) so the app gets a generated, typed client. A mismatch between the screen and the API then shows up at build time, not in front of a principal.

### Layout rules

| Width | Devices | Layout |
|---|---|---|
| 360–599 px | Most students' and parents' phones | One column, bottom tab bar, player docked at the bottom |
| 600–899 px | Large phones, small tablets | One column, wider cards, two-column lists |
| 900–1199 px | Tablets in landscape, small laptops | Two panes: lesson page on the left with sections and quiz on the right; class list with the roster beside it |
| 1200 px and up | Staff-room and principal desktops | Side navigation, three panes for teachers, full-width dashboard tables |

- **Built mobile-first:** the base style is the 360 px phone, and wider layouts are added on top.
- **Components size to their space:** they use container queries, so a card looks right in any pane, not just at one screen width.
- **Text and touch:** fluid type (16 px minimum for body text) and touch targets of at least 44 px.
- **The attendance screen fits in one hand:** one tap per student, with the Submit button always reachable.
- **Urdu:** Urdu text renders right to left in Noto Nastaliq Urdu, with a line height to match. Numbers stay in Western digits.

### Quality bars for every screen

- **Speed:** under 150 KB of JavaScript (compressed) on first load. The largest content appears within 2.5 s on a low-end Android phone on a simulated 3G connection.
- **Page images:** a lesson page image is at most 150 KB (WebP).
- **Accessibility:** WCAG 2.2 AA, checked automatically with axe on every screen, plus a manual screen-reader pass on the lesson player and the quiz.
- **Screen sizes:** screenshot tests at 360×640, 390×844, 768×1024, 1024×768 and 1440×900 in light and dark mode. Any unreviewed visual change fails the build.
- **Real devices:** each release is tested by hand on one low-end Android phone (2–3 GB of RAM), one iPhone and one laptop.

### Migration order

1. Design tokens and components, with a gallery page showing each one at every width.
2. Sign-in, then the student home screen and lesson player, because students use the app most.
3. Quiz and result, then the parent home screen.
4. Teacher screens: class, attendance, override and messages.
5. Remove the old app once the browser tests pass on the new one.

## Quality process for each feature

We take one feature at a time through the same seven steps. It is done only when every item in the definition of done is ticked. This is how we get the "highest quality control" you asked for without slowing to a crawl.

### The seven steps

1. **Spec (one page).** The problem, who uses it, the screens at 360 px and 1200 px, the API changes and the access rules. Out-of-scope items are listed too. The team signs it off before any code is written. Use [features/_template.md](features/_template.md).
2. **Acceptance criteria as tests.** Each criterion is written as "Given … when … then …" and becomes an automated test. At least one test tries to break an access rule (for example, a teacher opening another teacher's class).
3. **Build a thin slice.** Database, API, screen and test in one small change, working end to end, before any polish.
4. **Automated checks.** Backend and frontend unit tests, a browser test of the user journey, screenshot tests at the five sizes, accessibility checks and the performance budget. Any failure blocks the merge.
5. **Review.** A second developer reviews the code. A physics teacher reviews anything students will read or hear. You review the screens.
6. **Device and pilot check.** Test on a low-end Android phone on mobile data. Then run it with 2 or 3 real users (a teacher, a student, a parent) and write down where they hesitate.
7. **Release and watch.** Ship it behind a switch that can turn it off. Watch errors and usage for one week, then close the feature with a short report.

### Definition of done (copy into each feature spec)

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

### Tools

| Check | Tool |
|---|---|
| Backend tests | Django test runner (already 76 tests) |
| Frontend unit tests | Vitest and Testing Library |
| User journeys, screenshots at five sizes | Playwright |
| Accessibility | axe-core inside Playwright |
| Performance | Lighthouse CI with the budget above |
| Merge gate | GitHub Actions: nothing merges while a check is red |
| Errors in production | Sentry (with personal data scrubbed) |

## Decisions

Decided on 30 September 2026 by Muhammad Noor Khan. D7 is deferred.

| # | Decision | Outcome | What it changes |
|---|---|---|---|
| D1 | Frontend stack | **Decided: React + TypeScript + Vite PWA** (as recommended) | F1 starts with it |
| D2 | Separate Android app | **Decided: no app for now.** The PWA, which installs from the browser, is the only client | No Play Store work; revisit only if colleges ask |
| D3 | Pilot college and size | **Decided: one college, 2–4 classes, one term** (as recommended) | Sets the scale for F5, F6 and F22 |
| D4 | Subjects | **Decided: build for many subjects now and add content over time.** An "Add subject" option lets a teacher ask for a subject on their portal; the college admin approves it; the EduSaas team produces the content. Grade 12 shows as "Coming soon". Content order: Chemistry, then Biology and Maths | F20 gains the add-subject request and Grade 12 placeholders; sets the F8 queue |
| D5 | Narration language | **Decided: English mix narration now, Urdu option (F12) in Phase 2** (as recommended) | Voice cost and review work |
| D6 | Messaging provider | **Decided: free methods only for now.** No paid WhatsApp Business API or SMS gateway. Parent alerts go by web push and the in-app inbox, plus a one-tap "Send on WhatsApp" link that the teacher or college office sends from their own WhatsApp | F3 is redesigned (see below); sign-in uses an activation code and PIN, with Google sign-in and school credentials later |
| D7 | Textbook rights (CR-02) | **Deferred.** Not being pursued for now. The rule that textbook pages stay internal stays in force | The demo stays internal |
| D8 | Order of the Phase 1 features | **Decided: F1 → F2 → F5 → F3 → F4 → F6** (as recommended; F20 and F22 slot in as set out in the [implementation plan](implementation-plan-subjects-languages-admin-parent.md)) | Build order |

### D6 in detail: free messaging

From 1 October 2026, Meta charges for every utility template message, which is what an absence alert is. The 1,000 free service messages a month only cover replies to a parent who messaged the college first, so they cannot carry alerts ([YCloud](https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-october-1-2026), [Courier](https://www.courier.com/blog/whatsapp-pricing-changes-october-2026)). The free design is:

| Channel | How it works | Automatic? | Cost |
|---|---|---|---|
| Web push notification | The parent opens the web app once, adds it to the home screen and allows notifications; alerts then arrive like an app notification | Yes | Free |
| In-app parent inbox | Every alert is also saved in the parent's Messages screen | Yes | Free |
| "Send on WhatsApp" link | After attendance, the teacher or office sees one button per absent student. It opens WhatsApp with the message and the parent's number filled in, and they tap Send | No, one tap per parent | Free (uses the sender's own WhatsApp) |

- **Not used:** unofficial WhatsApp automation libraries (for example whatsapp-web.js or Baileys). They break WhatsApp's terms, and the sending number can be banned.
- **Limits to accept:** on iPhone, web push works only after the parent adds the app to the home screen. Parents who never open the app get only the WhatsApp message the teacher sends.
- **Sign-in (decided 30 September 2026):** SMS codes cost money, so sign-in is free: (1) **now**, the college hands each person a one-time activation code, and they set a PIN on their phone; the college admin can reset it. (2) **Later**, Google sign-in and school-issued login credentials (a username and password created by the college admin). Every method signs in only people the college has registered: a Google account works only if its email was added to that person's record by the college.
- **Upgrade path:** `backend/lms/notify.py` keeps one sending interface, so a paid API can be switched on later without changing the screens.

## Sources

- [Google Classroom: redesigned homepage with role-based views (July 2026)](https://workspaceupdates.googleblog.com/2026/07/redesigned-google-classroom-homepage-with-tailored-views-based-on-users-role.html)
- [Moodle app offline features](https://docs.moodle.org/502/en/Moodle_app_offline_features)
- [Khan Academy: new Khanmigo AI tools](https://blog.khanacademy.org/new-ai-tools-bring-interactive-diagrams-and-targeted-practice-thanks-to-khan-academys-partnership-with-google-org/)
- [Maqsad](https://maqsad.io/)
- [UNESCO: Taleemabad](https://www.unesco.org/en/dtc-financing-toolkit/taleemabad)
- [ClassDojo Translate](https://blog.classdojo.com/introducing-classdojo-translate/)
- [What is Canvas LMS (Raccoon Gang)](https://raccoongang.com/blog/what-is-canvas-lms/)
- The EduSaas demo, [change register](Change-Register-v1.1.md) and test results in this project
