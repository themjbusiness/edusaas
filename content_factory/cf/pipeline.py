"""Run the stages for each lesson and bundle the result into a Lesson Object (lesson.json).

Output layout (per book):
  output/<book>/pages/p<N>.webp
  output/<book>/lessons/<lesson-id>/script.json    validated script + quiz, with its input key
  output/<book>/lessons/<lesson-id>/sections/*.mp3 per-section narration cache
  output/<book>/lessons/<lesson-id>/audio.mp3      the full lecture
  output/<book>/lessons/<lesson-id>/audio-ur.mp3   the Urdu narration, when the script has one (F12)
  output/<book>/lessons/<lesson-id>/lesson.json    the Lesson Object

Every stage is idempotent: re-running with unchanged inputs changes nothing on disk.
"""
import datetime as dt
import math
import shutil
from pathlib import Path

from . import tts
from .pages import render_pages
from .schema import validate_script
from .util import log, read_json, sha, write_json

ROOT = Path(__file__).resolve().parent.parent


def now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def load_book(book_id):
    path = ROOT / "books" / f"{book_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"no book config at {path}")
    book = read_json(path)
    book["pdf_path"] = (path.parent / book["pdf"]).resolve()
    book["out"] = ROOT / "output" / book["id"]
    return book


def all_lessons(book):
    for unit in book["units"]:
        for lesson in unit["lessons"]:
            yield unit, lesson


def pick(book, ids=None):
    chosen = [(u, l) for u, l in all_lessons(book) if not ids or l["id"] in ids]
    missing = set(ids or []) - {l["id"] for _, l in chosen}
    if missing:
        raise ValueError(f"unknown lesson id(s): {', '.join(sorted(missing))}")
    return chosen


def build_lesson(book, unit, lesson, source, force=False, synth=tts.synthesize):
    out = book["out"]
    ldir = out / "lessons" / lesson["id"]
    log.info("[%s] %s %s", lesson["id"], lesson["topic"], lesson["title"])

    # 1. Pages
    page_files = render_pages(book["pdf_path"], lesson["pages"], out / "pages",
                              offset=book.get("pdf_page_offset", 0), force=force)

    # 2. Script + quiz (skipped when the inputs have not changed)
    key = source.input_key(lesson, page_files)
    cached = read_json(ldir / "script.json")
    if cached and cached["key"] == key and not force:
        script, meta = cached["script"], cached["meta"]
        log.info("  script: unchanged, reusing")
    else:
        script, meta = source.generate(lesson, book, page_files)
        problems = validate_script(script, lesson["pages"])
        if problems:
            raise ValueError(f"{lesson['id']}: invalid script:\n  - " + "\n  - ".join(problems))
        write_json(ldir / "script.json", {"key": key, "source": source.name, "meta": meta, "script": script})
        log.info("  script: %d sections, %d quiz questions (%s)", len(script["sections"]), len(script["quiz"]), source.name)

    # 3. Audio
    voice, rate = lesson.get("voice", book["voice"]), book.get("rate", "+0%")
    parts = tts.narrate(script["sections"], voice, rate, ldir / "sections", synth=synth)
    audio = ldir / "audio.mp3"
    cues, total = tts.join(parts, audio)
    log.info("  audio: %s, %.1f MB", f"{int(total // 60)}:{int(total % 60):02d}", audio.stat().st_size / 1e6)

    # 3b. Urdu narration (F12): its own voice, file, cue times and review.
    previous = read_json(ldir / "lesson.json", {})
    tracks, review_ur, ur_key = {}, None, None
    if script.get("sections_ur"):
        voice_ur = book.get("voice_ur", "ur-PK-AsadNeural")
        parts_ur = tts.narrate(script["sections_ur"], voice_ur, rate, ldir / "sections-ur", synth=synth)
        audio_ur = ldir / "audio-ur.mp3"
        cues_ur, total_ur = tts.join(parts_ur, audio_ur)
        ur_key = sha([s["text"] for s in script["sections_ur"]], voice_ur)
        tracks["ur"] = {"audio": f"lessons/{lesson['id']}/audio-ur.mp3", "audio_bytes": audio_ur.stat().st_size,
                        "duration_sec": total_ur, "voice": voice_ur,
                        "sections": [dict(s, start=c) for s, c in zip(script["sections_ur"], cues_ur)]}
        review_ur = previous.get("review_ur") if previous.get("generated", {}).get("ur_key") == ur_key else None
        review_ur = review_ur or {"status": "draft", "reviewed_by": None, "reviewed_at": None, "comment": None}
        log.info("  Urdu audio: %s, %.1f MB", f"{int(total_ur // 60)}:{int(total_ur % 60):02d}", audio_ur.stat().st_size / 1e6)

    # 4. Lesson Object. Review sign-off survives only while the script is unchanged.
    review = previous.get("review") if previous.get("generated", {}).get("script_key") == key else None
    review = review or {"status": "draft", "reviewed_by": None, "reviewed_at": None, "comment": None}
    obj = {
        "id": lesson["id"],
        "book": book["id"],
        "subject": book["subject"],
        "grade": book["grade"],
        "unit": {"number": unit["number"], "title": unit["title"]},
        "topic": lesson["topic"],
        "title": lesson["title"],
        "pages": lesson["pages"],
        "images": [f"pages/p{p}.webp" for p in lesson["pages"]],
        "images_sm": [f"pages/p{p}-sm.webp" for p in lesson["pages"]],
        "audio": f"lessons/{lesson['id']}/audio.mp3",
        "audio_bytes": audio.stat().st_size,
        "duration_sec": total,
        "minutes": max(1, math.ceil(total / 60)),
        "sections": [dict(s, start=c) for s, c in zip(script["sections"], cues)],
        "quiz": script["quiz"],
        "review_notes": script.get("review_notes", []),
        "review": review,
        "tracks": tracks,
        "review_ur": review_ur,
        "generated": {"source": source.name, "meta": meta, "voice": voice, "rate": rate, "script_key": key,
                      "ur_key": ur_key},
    }
    body = {k: v for k, v in obj.items() if k != "generated"}
    old_body = {k: v for k, v in previous.items() if k != "generated"}
    if body != old_body or previous.get("generated", {}).get("script_key") != key \
            or previous.get("generated", {}).get("ur_key") != ur_key:
        obj["generated"]["at"] = now()
        write_json(ldir / "lesson.json", obj)
        log.info("  lesson.json written (review: %s)", review["status"])
    else:
        log.info("  lesson.json unchanged")
    return obj


def set_review(book, lesson_id, status, by, comment=None, track="mix"):
    path = book["out"] / "lessons" / lesson_id / "lesson.json"
    obj = read_json(path)
    if obj is None:
        raise FileNotFoundError(f"{lesson_id} has not been built yet; run the factory first")
    entry = {"status": status, "reviewed_by": by, "reviewed_at": now(), "comment": comment}
    if track == "ur":
        if not obj.get("tracks", {}).get("ur"):
            raise ValueError(f"{lesson_id} has no Urdu narration to review")
        obj["review_ur"] = entry
    else:
        obj["review"] = entry
    write_json(path, obj)
    return obj


def export_demo(book, project_dir, approved_only=False):
    """Copy page images and audio into the web app's media folder.

    Lesson data itself goes into the backend with `python backend/manage.py import_lessons <book>`,
    which also copies media, so this is only needed to refresh media without touching the database.
    """
    media = Path(project_dir).resolve() / "media" / book["id"]
    count = 0
    for unit, lesson in all_lessons(book):
        obj = read_json(book["out"] / "lessons" / lesson["id"] / "lesson.json")
        if obj is None:
            continue
        if approved_only and obj["review"]["status"] != "approved":
            log.info("skip %s (review: %s)", obj["id"], obj["review"]["status"])
            continue
        for rel in obj["images"] + obj.get("images_sm", []) + [obj["audio"]] + [t["audio"] for t in obj.get("tracks", {}).values()]:
            src, dst = book["out"] / rel, media / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not dst.exists() or sha(dst.read_bytes()) != sha(src.read_bytes()):
                shutil.copyfile(src, dst)
        count += 1
    if not count:
        raise ValueError("nothing to export; build lessons first" + (" or approve them" if approved_only else ""))
    log.info("copied media for %d lesson(s) to %s", count, media)
    log.info("next: python ../backend/manage.py import_lessons %s", book["id"])
    return count
