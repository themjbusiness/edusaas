# Content Factory (Phase 1)

This is the offline pipeline from the blueprint (System A). It turns textbook pages into
**Lesson Objects**: page images, a Roman Urdu teaching script, a quiz pool and a narrated MP3. The
student portal then serves these files as they are. Nothing is generated while a student is using
the app.

```text
textbook PDF ──► 1. pages      render pages to WebP (≤1080 px)
                 2. script     teaching script + quiz (authored JSON, or Claude reading the pages)
                               └─ validated against the schema; bad output is retried, never saved
                 3. audio      narrate each section (neural voice), join into one MP3 with cue times
                 4. bundle     lesson.json = images + audio + cues + quiz + review status
                 5. export     copy into ../demo so the student app plays it
```

## Current output: Physics Grade 11, Unit 1

| Lesson | Pages | Audio | Size | Quiz pool | Review |
|---|---|---|---|---|---|
| 1.1 Estimation of Physical Quantities | 8–10 | 3:30 | 1.3 MB | 9 | draft |
| 1.2 Derived Units in Terms of Base Units | 10–11 | 2:13 | 0.8 MB | 8 | draft |
| 1.3 Dimensions of Physical Quantities | 11–14 | 3:40 | 1.3 MB | 9 | draft |

This table was accurate when it was written. Run `python factory.py status phy11` for current numbers.

## Setup

```text
pip install -r requirements.txt
```

## Commands

```text
python factory.py build phy11                        # build every lesson in books/phy11.json
python factory.py build phy11 --only u1-dimensions   # one lesson
python factory.py build phy11 --export               # build, then copy into ../demo
python factory.py status phy11                       # durations, sizes, review status, reviewer notes
python factory.py review phy11 u1-estimation --approve --by "Mr. Tariq"
python factory.py review phy11 u1-estimation --request-changes --by "Mr. Tariq" --comment "Fix Q4"
python factory.py export phy11 --approved-only       # only teacher-approved lessons reach students
python -m pytest tests                               # 19 tests
```

## Where the script comes from

- **`--source authored` (default).** The script is read from `authored/<lesson-id>.json`. The three
  Unit 1 lessons are there now. This is also how a teacher's corrections go in: edit the JSON, then
  rebuild. Only the changed sections are narrated again.
- **`--source claude`.** Claude (`claude-opus-5-5`) reads the page images and writes the script and
  quiz using [prompts/teaching_script.md](prompts/teaching_script.md). The output is constrained to
  the JSON schema and then checked against the content rules (for example, 4 options per question and
  sections that follow page order). If it fails, it is retried up to 3 times.
  - Setup: set `ANTHROPIC_API_KEY`, then run `python factory.py build phy11 --source claude --only u1-estimation`.
  - Refusals: the request opts into Anthropic's server-side refusal fallback (`fallbacks: "default"`).
    If a safety classifier declines, the request re-runs on the recommended fallback model instead of failing.
  - Status: this path has not been run yet because no API key is set. The code matches the installed
    SDK's parameters, but the first real run should be checked by hand.
  - To keep Claude's output as a starting point, copy the `script` object from
    `output/phy11/lessons/<id>/script.json` into `authored/<id>.json`. A teacher can then edit it.

## Urdu narration (F12)

An authored script can carry a second narration in Urdu script, `sections_ur`, in the same page order as
`sections`. `build` narrates it with `ur-PK-AsadNeural` (set `voice_ur` in the book config to change it) into
`lessons/<id>/audio-ur.mp3`. It has its own review, separate from the lesson:

```text
python factory.py review phy11 u1-estimation --approve --track ur --by "Mr. Tariq"
```

`status` shows the Urdu track on its own line. All three Unit 1 lessons have an Urdu draft now. Write technical
terms phonetically in Urdu script (فورس، ایکسلریشن) so the voice pronounces them reliably.

## Voice

Narration uses Microsoft neural voices through `edge-tts`, which is free and needs no key. The
voice is set in `books/phy11.json` (`"voice"`). Output is 48 kbps mono MP3, about 0.36 MB per minute,
so a 10-minute lecture is about 3.6 MB, under the 5 MB limit.

Listen to the two samples in [samples/](samples/) and pick one:

- **A: `en-IN-PrabhatNeural` reading Roman Urdu.** This is the current setting. It reads the transcript
  as shown, but with an Indian-English accent on the Urdu words.
- **B: `ur-PK-AsadNeural` reading Urdu script.** The Pakistani accent is more natural, but the narration
  would need to be written in Urdu script for the voice, with Roman Urdu kept for on-screen text.
  Claude can produce both.

`edge-tts` uses an unofficial Microsoft endpoint that can change without notice. For production, use
Azure Speech (the same voices, on a paid plan with an SLA) or ElevenLabs. Only `cf/tts.py:synthesize`
needs to change.

## How the Definition of Done is met

| DoD item | How |
|---|---|
| Audio under 5 MB per lecture | `tts.join` fails the build above 5 MB |
| Quiz JSON validated before saving | `schema.validate_script`, run on every source |
| Retry 3 times, then log and move on | `util.retry`; a failed lesson is logged and the batch continues |
| Idempotent | Scripts are cached by an input hash, section audio by a text+voice hash, and unchanged files are never rewritten (tested) |
| Content review | `lesson.json.review` holds status, reviewer and time. Approval resets to draft when the script changes (tested) |

## Folder layout

```text
books/phy11.json          book config: PDF path, voice, units, lessons and their pages
authored/*.json           hand-written or teacher-edited scripts
prompts/                  prompt Claude uses to write scripts
cf/                       pipeline code
output/phy11/             generated pages and lesson objects (sections/ is a cache, not committed)
samples/                  voice comparison clips
```

## Adding a lesson

1. Add it to `books/phy11.json` with its `id`, `topic`, `title` and `pages` (book page numbers).
2. Either write `authored/<id>.json`, or run with `--source claude`.
3. Run `python factory.py build phy11 --only <id> --export`.
