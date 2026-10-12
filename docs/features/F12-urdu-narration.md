# F12: Urdu narration option

Status: Built 2026-10-01 (signed off the same day under the instruction "continue with the whole development"); the Urdu narration awaits teacher review · Owner: Muhammad Noor Khan · Last updated: 2026-10-01

Plan: [implementation plan, F12](../implementation-plan-subjects-languages-admin-parent.md#f12-urdu-narration-track) · Decisions: D5 (English mix by default, Urdu option), plan decision 6 (the subject teacher reviews the Urdu)

## Problem

Lessons are narrated in Roman Urdu mixed with English, read by an Indian-English voice. Students who think in Urdu find the accent and the English terms hard to follow. They need the same lesson narrated in proper Urdu by a Pakistani voice, without losing the textbook page alongside.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Student | Switch the lesson between **English mix** and **اردو**; hearing 90% of either track unlocks the quiz | An Urdu track that a teacher has not approved (outside demo mode) |
| Subject teacher | Approve or request changes to the Urdu narration separately from the lesson | — |
| Parent, college admin | No change | — |

## Screens

- **Lesson player:** a **Narration: English mix | اردو** switch above the caption, shown only when the lesson has an Urdu track.
  - Switching changes the audio, the "Now explaining" caption and the full transcript (Nastaliq, right to left).
  - It keeps the textbook page and the quiz rule.
  - The choice is remembered on the device.
- **Media controls and the progress bar** stay left to right.
- **Desktop:** the switch sits at the top of the side column.

## API and data changes

| Method and path | Who | Change |
|---|---|---|
| `GET /api/lessons/<id>` | Student | Adds `urdu: {audio, duration, review, script}` when the Urdu track may be shown, else `null` |
| `POST /api/lessons/<id>/progress` | Student | Accepts `track: "mix"` or `"ur"`; heard seconds are kept per track; 90% of either unlocks the quiz |

- **Content Factory:**
  - Authored scripts take an optional `sections_ur` (same page order as `sections`).
  - `build` narrates it with `ur-PK-AsadNeural` (`voice_ur` in the book config) into `audio-ur.mp3`, with its own cue times.
  - `lesson.json` gets `tracks.ur` and a separate `review_ur`.
  - Review it with `python factory.py review phy11 <lesson> --approve --track ur --by "<teacher>"`.
- **Backend:**
  - `Lesson` gains `ur_audio`, `ur_audio_bytes`, `ur_duration_sec`, `ur_sections` and `ur_review_status`.
  - `LessonProgress` gains `heard_secs_ur`.
  - `import_lessons` copies the Urdu audio.

## Acceptance criteria

1. Given an authored script with `sections_ur`, when built, then `audio-ur.mp3` is narrated with the Urdu voice, with cue times, and its review starts as draft. Approving it survives an unchanged rebuild and does not approve the main lesson.
2. Given Urdu sections out of page order or on a page outside the lesson, then the build is refused.
3. Given a lesson with an Urdu track, then the lesson response includes it, with Urdu-script sections.
4. Given a student hears 90% of the Urdu track and none of the English mix, then the quiz unlocks.
5. Given an Urdu track still in draft outside demo mode, then it is not offered and its progress is refused. Once approved, it is offered.
6. Given an unknown track name, then the server returns 400.

## Out of scope

- Urdu quiz questions (the quiz stays in the textbook's English).
- Urdu narration for subjects without content.
- A paid voice service. `edge-tts` is free but unofficial; switching to Azure Speech only changes `cf/tts.py:synthesize`.

## Risks and open questions

- **The Urdu script is a first draft written during development.** Technical terms are written phonetically in Urdu script (فورس، ایکسلریشن) so the voice pronounces them reliably. A physics teacher who reads Urdu must check every term and number before it is approved.
- **Pronunciation of formulas** (for example "ایل ٹی کی طاقت منفی دو") needs a listening check by a teacher.

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

- **Content:** all three Unit 1 lessons now have Urdu narration: 1.1 (13 sections, 3:02), 1.2 (10 sections, 1:51) and 1.3 (12 sections, 3:03), about 0.7–1.1 MB each, voice `ur-PK-AsadNeural`. Each lesson's `review_notes` flags the Urdu as a draft.
- **Progress:** the quiz unlocks on 90% of either track. `heardShare` reports the larger of the two, so the home screen and parent view are unchanged.
- **Font:** the Nastaliq font is loaded when the Urdu track is chosen, even if the rest of the app is in English.

Checks run: 19 Content Factory tests (3 new) and 76 backend tests (3 new). Browser journey at 390 px (English and Urdu interface) and 1280 px: switching to Urdu plays the 1:51 Urdu audio with Urdu captions and transcript, the server records Urdu heard time separately (3.6% Urdu, 0% mix after a few seconds), switching back restores the English mix, and there are no page errors.

## Release report

Filled in one week after release.
