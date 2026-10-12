import copy
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from cf import pipeline, tts  # noqa: E402
from cf.schema import validate_script  # noqa: E402
from cf.script_sources import AuthoredSource  # noqa: E402
from cf.util import retry  # noqa: E402

GOOD = {
    "sections": [{"page": 8, "text": "Intro."}, {"page": 8, "text": "More."}, {"page": 9, "text": "End."}],
    "quiz": [{"question": f"Q{i}?", "options": ["a", "b", "c", "d"], "answer": i % 4, "explanation": "e"}
             for i in range(5)],
    "review_notes": [],
}


def test_valid_script_passes():
    assert validate_script(GOOD, [8, 9]) == []


@pytest.mark.parametrize("mutate, expected", [
    (lambda s: s["quiz"][0].update(answer=4), "out of range"),
    (lambda s: s["quiz"][0]["options"].pop(), "exactly 4 options"),
    (lambda s: s["quiz"].pop(), "at least 5"),
    (lambda s: s["sections"][0].update(page=99), "not one of the lesson pages"),
    (lambda s: s["sections"].reverse(), "page order"),
    (lambda s: s["quiz"][1].update(question="Q0?"), "duplicate question"),
    (lambda s: s["quiz"][0].update(options=["a", "a", "b", "c"]), "duplicate options"),
    (lambda s: s.pop("review_notes"), "schema"),
])
def test_invalid_scripts_are_rejected(mutate, expected):
    s = copy.deepcopy(GOOD)
    mutate(s)
    assert any(expected in p for p in validate_script(s, [8, 9]))


def test_retry_gives_up_after_three_attempts(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda s: None)
    calls = []

    def flaky():
        calls.append(1)
        raise RuntimeError("timeout")

    with pytest.raises(RuntimeError):
        retry(flaky, "test")
    assert len(calls) == 3


def test_retry_recovers(monkeypatch):
    monkeypatch.setattr("time.sleep", lambda s: None)
    calls = []

    def once_flaky():
        calls.append(1)
        if len(calls) == 1:
            raise RuntimeError("timeout")
        return "ok"

    assert retry(once_flaky, "test") == "ok"


@pytest.fixture
def book(tmp_path, monkeypatch):
    import pymupdf

    pdf = tmp_path / "book.pdf"
    doc = pymupdf.open()
    for n in range(1, 11):
        doc.new_page().insert_text((72, 72), f"Page {n}")
    doc.save(pdf)

    authored = tmp_path / "authored"
    authored.mkdir()
    (authored / "t1.json").write_text(json.dumps(GOOD), encoding="utf-8")

    synth_calls = []

    def fake_synth(text, voice, rate, target):
        synth_calls.append(text)
        Path(target).write_bytes(text.encode("utf-8") * 10)

    monkeypatch.setattr(tts, "duration", lambda p: Path(p).stat().st_size / 100)
    b = {"id": "t", "pdf_path": pdf, "out": tmp_path / "out", "subject": "Physics", "grade": "Grade 11",
         "voice": "v", "units": [{"number": 1, "title": "U", "lessons": [
             {"id": "t1", "topic": "1.1", "title": "T", "pages": [8, 9]}]}]}
    return b, AuthoredSource(authored), fake_synth, synth_calls, authored


def build(b, source, synth):
    unit = b["units"][0]
    return pipeline.build_lesson(b, unit, unit["lessons"][0], source, synth=synth)


def test_build_creates_lesson_object(book):
    b, source, synth, calls, _ = book
    obj = build(b, source, synth)
    assert obj["images"] == ["pages/p8.webp", "pages/p9.webp"]
    assert [s["start"] for s in obj["sections"]][0] == 0
    assert obj["sections"][1]["start"] > 0
    assert obj["review"]["status"] == "draft"
    assert (b["out"] / "lessons/t1/audio.mp3").exists()
    assert len(calls) == 3


def test_rebuild_is_idempotent(book):
    b, source, synth, calls, _ = book
    build(b, source, synth)
    files = {p: p.stat().st_mtime_ns for p in b["out"].rglob("*") if p.is_file()}
    build(b, source, synth)
    assert len(calls) == 3, "unchanged sections must not be narrated again"
    assert {p: p.stat().st_mtime_ns for p in b["out"].rglob("*") if p.is_file()} == files


def test_edit_renarrates_only_changed_section_and_resets_review(book):
    b, source, synth, calls, authored = book
    build(b, source, synth)
    pipeline.set_review(b, "t1", "approved", "Teacher")
    edited = copy.deepcopy(GOOD)
    edited["sections"][1]["text"] = "Changed."
    (authored / "t1.json").write_text(json.dumps(edited), encoding="utf-8")
    obj = build(b, source, synth)
    assert calls[-1] == "Changed." and len(calls) == 4
    assert obj["review"]["status"] == "draft", "approval must not survive a script change"


def test_review_survives_unchanged_rebuild(book):
    b, source, synth, _, _ = book
    build(b, source, synth)
    pipeline.set_review(b, "t1", "approved", "Teacher")
    assert build(b, source, synth)["review"]["status"] == "approved"


def test_oversized_audio_is_rejected(tmp_path):
    big = tmp_path / "a.mp3"
    big.write_bytes(b"x" * (tts.MAX_AUDIO_BYTES + 1))
    with pytest.raises(ValueError, match="5 MB"):
        tts.join([(big, 1.0)], tmp_path / "out.mp3")


URDU = [{"page": 8, "text": "پہلا حصہ۔"}, {"page": 8, "text": "دوسرا حصہ۔"}, {"page": 9, "text": "تیسرا حصہ۔"}]


def test_urdu_track_is_built_with_its_own_voice_and_review(book):
    b, source, synth, calls, authored = book
    (authored / "t1.json").write_text(json.dumps(dict(GOOD, sections_ur=URDU)), encoding="utf-8")
    voices = []
    obj = build(b, source, lambda text, voice, rate, target: (voices.append(voice), synth(text, voice, rate, target)))
    ur = obj["tracks"]["ur"]
    assert ur["audio"] == "lessons/t1/audio-ur.mp3" and (b["out"] / ur["audio"]).exists()
    assert ur["voice"] == "ur-PK-AsadNeural" and voices.count("ur-PK-AsadNeural") == 3
    assert [s["start"] for s in ur["sections"]][0] == 0 and ur["sections"][2]["start"] > 0
    assert obj["review_ur"]["status"] == "draft"
    pipeline.set_review(b, "t1", "approved", "Teacher", track="ur")
    again = build(b, source, synth)
    assert again["review_ur"]["status"] == "approved", "Urdu approval survives an unchanged rebuild"
    assert again["review"]["status"] == "draft", "approving Urdu does not approve the main lesson"


def test_urdu_sections_are_validated(book):
    _, _, _, _, _ = book
    bad = dict(GOOD, sections_ur=[{"page": 9, "text": "x"}, {"page": 8, "text": "y"}, {"page": 99, "text": ""}])
    problems = validate_script(bad, [8, 9])
    assert any("Urdu section 3" in p for p in problems)
    assert any("Urdu sections jump back" in p for p in problems)


def test_lesson_without_urdu_has_no_tracks(book):
    b, source, synth, _, _ = book
    obj = build(b, source, synth)
    assert obj["tracks"] == {} and obj["review_ur"] is None
    with pytest.raises(ValueError):
        pipeline.set_review(b, "t1", "approved", "Teacher", track="ur")
