"""Stage 3: narrate each script section, then join them into one lecture file.

Uses Microsoft's neural voices through edge-tts (free, no API key): 24 kHz mono MP3 at 48 kbps,
about 0.36 MB per minute, so a 10-minute lecture stays well under the 5 MB limit.
Swap `synthesize` for Azure Speech or ElevenLabs later without touching the rest of the pipeline.
"""
import asyncio
from pathlib import Path

from .util import log, retry, sha

MAX_AUDIO_BYTES = 5 * 1024 * 1024


def synthesize(text, voice, rate, target):
    import edge_tts

    async def run():
        await edge_tts.Communicate(text, voice, rate=rate).save(str(target))

    asyncio.run(run())
    if not Path(target).exists() or Path(target).stat().st_size == 0:
        raise RuntimeError("TTS produced no audio")


def duration(path):
    from mutagen.mp3 import MP3

    return MP3(str(path)).info.length


def narrate(sections, voice, rate, work_dir, synth=synthesize):
    """Create one MP3 per section, cached by (text, voice, rate). Returns [(path, seconds)]."""
    work_dir = Path(work_dir)
    work_dir.mkdir(parents=True, exist_ok=True)
    keep, parts = set(), []
    for i, s in enumerate(sections):
        target = work_dir / f"{i + 1:02d}-{sha(s['text'], voice, rate)}.mp3"
        keep.add(target.name)
        if not target.exists():
            tmp = target.with_suffix(".part")
            retry(lambda: synth(s["text"], voice, rate, tmp), f"TTS section {i + 1}")
            tmp.replace(target)
            log.info("  section %d narrated (%d KB)", i + 1, target.stat().st_size // 1024)
        parts.append(target)
    for old in work_dir.glob("*.mp3"):  # drop audio for sections that no longer exist
        if old.name not in keep:
            old.unlink()
    return [(p, duration(p)) for p in parts]


def join(parts, target):
    """Concatenate same-format MP3 files. Returns the cue start time (seconds) of each part."""
    cues, t, chunks = [], 0.0, []
    for path, seconds in parts:
        cues.append(round(t, 2))
        chunks.append(Path(path).read_bytes())
        t += seconds
    data, target = b"".join(chunks), Path(target)
    if not target.exists() or target.read_bytes() != data:  # leave an unchanged lecture untouched
        target.write_bytes(data)
    size = len(data)
    if size > MAX_AUDIO_BYTES:
        raise ValueError(f"{Path(target).name} is {size / 1e6:.1f} MB; the limit is 5 MB per lecture")
    return cues, round(t, 2)
