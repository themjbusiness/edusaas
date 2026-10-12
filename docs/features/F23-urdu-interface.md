# F23: Urdu interface and alert language

Status: Built 2026-10-01 (signed off the same day under the instruction "continue with the whole development"); Urdu text awaits native-speaker review · Owner: Muhammad Noor Khan · Last updated: 2026-10-01

Plan: [implementation plan, F12 and F23](../implementation-plan-subjects-languages-admin-parent.md#f12-and-f23-urdu) · Related: F12 (Urdu narration)

## Problem

Many parents, and some students, read Urdu far more easily than English. Today every screen and every alert is in English, so a parent may not understand an absence alert or their child's progress.

## Users and access rules

| Role | What changes | Notes |
|---|---|---|
| Student | Can switch the app to Urdu (اردو) | Lesson titles, the textbook page and physics terms stay as in the book |
| Parent | Can switch the app to Urdu; alerts and the weekly summary arrive in the parent's chosen language | The language is saved to the parent's account, so alerts use it even when the app is closed |
| Teacher, college admin | Can switch, but their screens stay in English in this release | Out of scope below |

Users can only change their own language.

## Screens

- **Header:** a language button showing **اردو** (or **English** when Urdu is on). It switches at once, without a reload.
- **Urdu mode:**
  - The page reads right to left (`dir="rtl"`), in a Nastaliq font with taller line spacing.
  - Numbers, phone numbers, physics formulas, units (m/s², kg) and the textbook page stay left to right.
  - Dates use Urdu month and day names.
- **Screens translated in this release:**
  - sign-in
  - bottom navigation
  - student home, subject page, library, lesson player and quiz, including result and review
  - parent home, child subject detail, Messages
  - the alerts card, offline and error cards, and common toasts
- **Before signing in:** the choice is remembered on the device (so the sign-in screen can be Urdu). After signing in it is also saved to the account.

## API and data changes

| Method and path | Who | Purpose |
|---|---|---|
| `POST /api/me/language` | Any signed-in user | `{language: "en" or "ur"}`; saves it to the caller's account |
| `GET /api/me` (changed) | Any signed-in user | Includes `language` |

Model and migration changes:
- **`User.language`:** `en` or `ur`, default `en`.
- **Urdu alert texts:** absence alert, cleared by quiz, cleared by teacher and the weekly summary each have an Urdu version in `notify.py`. The parent's language decides which is sent (inbox, push and the teacher's WhatsApp link).
- **Teacher alerts** stay in English.

## Acceptance criteria

1. Given a parent who chose Urdu, when their child is marked absent, then the inbox alert, the push text and the teacher's WhatsApp link text are in Urdu.
2. Given a parent who chose English (the default), then alerts stay in English.
3. Given any user, when they post `language: "fr"`, then the server returns 400. A user can only change their own language.
4. Given Urdu is on, then the student and parent screens in scope show no untranslated English labels (checked by a browser test listing every visible label), and the layout is right to left with no text overflowing at 360 px.
5. Given the weekly summary for an Urdu parent, then it is written in Urdu.

## Out of scope

- Teacher and college admin screens in Urdu (a later release).
- Translating lesson titles, textbook pages or quiz questions (content; F12 adds Urdu narration).
- Roman Urdu as an interface language.

## Risks and open questions

- **The Urdu text must be reviewed by a native speaker** before parents see it. The first version was written during development, so it is a draft.
- **Fonts:** some Android phones have no Nastaliq font. The app falls back to Naskh-style Arabic script, which is readable, and loads Noto Nastaliq Urdu from Google Fonts only when Urdu is on, to save data.

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

- **Texts:** `demo/i18n.js` holds the Urdu for about 150 sentences, keyed by the English sentence with `{placeholders}`. `T()` in `app.js` picks the language, and server error codes (wrong code, not registered, quiz locked and so on) have their own Urdu messages.
- **Which language wins:** before sign-in, the device's choice. After sign-in, the account's saved language (so a parent's phone and their alerts agree). Switching in the header saves to the account.
- **Layout:** `dir="rtl"`. Phone numbers, codes, scores, the audio controls and the textbook page stay left to right (media controls are not mirrored).
- **Fonts:** Urdu uses Noto Nastaliq Urdu (from Google Fonts, loaded only when Urdu is on). A Latin-only font alias keeps English names in the normal UI font; without it, Windows rendered Urdu in Segoe UI's Naskh letters.
- **Alerts:** absence, cleared, cleared-by-teacher and the weekly summary have Urdu versions, chosen by the parent's language for the inbox, the push title and text, and the teacher's WhatsApp link. Subject names are translated (فزکس and so on); lesson titles stay as in the book.

Checks run: 73 backend tests (3 new for F23). Browser journey at 360 px in Urdu: sign-in (including Urdu validation and server errors), student home, subject, library, lesson, quiz and result, parent home and child detail. A script listed every visible Latin word on each screen: only names, class names, the brand and textbook content remain. No horizontal overflow at 360 px, and no page errors.

**Still open:** a native Urdu speaker must review every sentence in `i18n.js` and the alert texts in `backend/lms/notify.py`; teacher and admin screens in Urdu; dark-mode and 768/1024 px screenshots in Urdu.

## Release report

Filled in one week after release.
