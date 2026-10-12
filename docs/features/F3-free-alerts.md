# F3: Parent alerts on free channels

Status: Built 2026-10-01 (signed off the same day under the instruction "continue with the whole development") · Owner: Muhammad Noor Khan · Last updated: 2026-10-01

Roadmap: F3, redesigned by decision D6 (free methods only) · Related: F21 weekly summary, which uses the same channels

## Problem

The demo sends absence and clearance alerts by simulated WhatsApp with SMS fallback. Both cost money per message in real life (from 1 October 2026 Meta charges for every alert-type WhatsApp message), and D6 says free methods only for now. Parents still need to hear about an absence the same day, and the teacher needs to know who has been told.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Parent | Turn on alerts on their phone (web push); read every alert in Messages | Alerts about other children |
| Teacher | Turn on alerts on their phone; after attendance, send each absent student's parent a ready-made WhatsApp message with one tap from their own WhatsApp; see who has not been told yet | Links or messages for students outside their classes |
| Student, college admin | No change | — |

A push subscription belongs to the signed-in user only. Alerts are pushed only to that user's own devices.

## Screens

- **Parent home and teacher "My classes":** an **Alerts on this phone** card, with these states:
  - **Off:** a *Turn on alerts* button.
  - **On:** *Alerts are on for this phone* and a Turn off link.
  - **Blocked:** how to allow notifications in the browser settings.
  - **Not supported:** on iPhone, "Add EduSaas to your Home Screen first"; otherwise "Open in Chrome".
- **Teacher class page, after attendance:**
  - A **Tell parents on WhatsApp** list shows each parent of a student marked absent today who hasn't been told yet, with a **Send on WhatsApp** button.
  - The button opens WhatsApp with the parent's number and the message filled in, and marks the parent as told.
  - A badge reads "2 parents not told yet" until all are sent.
- **Messages and the teacher's alerts log:** show each alert with how it was delivered: *In app*, *In app · sent to 1 phone*, or *WhatsApp (sent by the teacher)*.
- **Phone and desktop** use the existing layouts. Push works on Android Chrome and desktop browsers, and on iPhone only after "Add to Home Screen" (iOS 16.4 and later).

## API and data changes

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/push/key` | Any signed-in user | The server's public VAPID key |
| `POST /api/push/subscribe` | Any signed-in user | Save this browser's push subscription for the caller |
| `POST /api/push/unsubscribe` | Any signed-in user | Remove it (only the caller's own) |
| `GET /api/teacher/assignments/<id>` (changed) | Teacher | Each pending clearance from today carries `whatsapp: {phone, text, notifiedAt}` |
| `POST /api/teacher/clearances/<id>/whatsapp-sent` | Teacher of that class | Record that the parent was told by WhatsApp |

Model and migration changes:
- **New `PushSubscription`:** user, endpoint (unique), keys, user agent, created time.
- **`Clearance.parent_notified_at`:** set when the teacher taps *Send on WhatsApp*.
- **`Notification.channel`** adds `push`.
- **New setting `PAID_MESSAGING`,** default off (D6):
  - **Off:** every alert goes to the recipient's in-app inbox and is pushed to their devices. No WhatsApp or SMS gateway is called.
  - **On:** the previous WhatsApp-then-SMS chain is used, simulated in demo mode; this keeps the upgrade path.
- **VAPID keys:** read from `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`, or generated once into `backend/vapid.json`. That file is a secret and must not be shared.
- **New `demo/sw.js`** (service worker: shows the notification, and opens the app on tap) and a small `manifest.webmanifest` so the app can be added to the Home Screen.

## Acceptance criteria

1. Given free messaging, when a student is marked absent, then the parent gets one inbox alert, it is pushed to each of the parent's subscribed devices, and no WhatsApp or SMS provider is called.
2. Given a push endpoint that answers 404 or 410 (expired), when an alert is sent, then that subscription is deleted, and the inbox alert is still delivered.
3. Given a user with no subscriptions, when an alert is sent, then the inbox alert is delivered and shown as "In app".
4. Given a signed-in user, when they subscribe, then the subscription is saved for them only. Subscribing the same endpoint again updates it rather than duplicating it. Unsubscribing removes only their own.
5. Given a teacher's class with a student marked absent today, then the class response gives the parent's WhatsApp link text and number. Given another teacher, then marking it sent returns 404.
6. Given the teacher marks it sent, then `notifiedAt` is set and the parent drops out of the "not told yet" count.
7. Given `PAID_MESSAGING` on, then the old WhatsApp-then-SMS behaviour and the daily limit still work (existing tests).
8. No phone number or push endpoint appears in the logs.

## Out of scope

- Real WhatsApp Business API or SMS gateway (paid; `PAID_MESSAGING` keeps the path open).
- Free sign-in codes (activation code and PIN, F2).
- Push on phones that open the demo over plain `http://` on the Wi-Fi. Browsers only allow push on HTTPS or `localhost`; this works once the app is hosted with HTTPS (F6).
- Offline lessons (F4).

## Risks and open questions

- **Fewer parents reached automatically.** Parents who never install the app only get the teacher's WhatsApp message. Mitigation: the "not told yet" count, and onboarding at the parent-teacher meeting.
- **iPhone:** push needs the app added to the Home Screen first; the card explains this.

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

- **Default is free:** `PAID_MESSAGING` is off. Every alert creates one in-app Notification, and the push result is stored on it (`push:2/2` means 2 of 2 phones). The old WhatsApp-then-SMS path is kept behind `PAID_MESSAGING=1` and still tested.
- **Weekly summary (F21)** now also pushes to the parent's phones.
- **Teacher WhatsApp:** the class page lists today's absences whose parent hasn't been told. Tapping **Send on WhatsApp** opens `https://wa.me/<number>?text=<message>` and records a "WhatsApp, sent by the teacher" entry once.
- **Logging out** removes this browser's push subscription, so the next person signing in on a shared phone doesn't get the previous person's alerts.
- **Push keys** are generated into `backend/vapid.json` on first use, unless they are set in the environment.

Checks run: 70 backend tests (7 new for F3; four older messaging tests now run with `PAID_MESSAGING=1`). Browser journey at 390 px: the teacher marks Ali absent, sees the WhatsApp card, opens the link with the right number and message, and the card clears; the parent sees both entries in Messages.

**Not yet verified:** a real push notification arriving on a phone. Headless Chrome has no push service, so turning on alerts there fails with "permission denied", and the app shows that error and stays off. The server-side sending is covered by tests with the push service mocked. Check it once on a real Android phone over HTTPS, or on this computer at `http://localhost:8000`.

Definition of done still open: a real-device push check, accessibility and performance tooling, screenshots at 768 and 1024 px, a low-end phone test, and real-user trials.

## Release report

Filled in one week after release.
