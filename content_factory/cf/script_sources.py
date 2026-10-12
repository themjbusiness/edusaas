"""Stage 2: produce the teaching script and quiz for a lesson.

Two providers share one output shape (see schema.py):
- "authored": a hand-written or teacher-edited JSON file in authored/<lesson-id>.json.
- "claude": Claude reads the page images and writes the script (needs an Anthropic API key).
"""
import base64
import json
from pathlib import Path

from .schema import SCRIPT_SCHEMA, validate_script
from .util import file_sha, log, retry, sha

ROOT = Path(__file__).resolve().parent.parent
PROMPT_FILE = ROOT / "prompts" / "teaching_script.md"
CLAUDE_MODEL = "claude-opus-5-5"


class AuthoredSource:
    name = "authored"

    def __init__(self, folder=ROOT / "authored"):
        self.folder = Path(folder)

    def path(self, lesson):
        return self.folder / f"{lesson['id']}.json"

    def input_key(self, lesson, page_files):
        p = self.path(lesson)
        return sha(self.name, file_sha(p) if p.exists() else "missing")

    def generate(self, lesson, book, page_files):
        p = self.path(lesson)
        if not p.exists():
            raise FileNotFoundError(f"no authored script at {p}; write one or use --source claude")
        data = json.loads(p.read_text(encoding="utf-8"))
        keys = ("sections", "quiz", "review_notes") + (("sections_ur",) if data.get("sections_ur") else ())
        return {k: data.get(k, []) for k in keys}, {"source": str(p.name)}


class ClaudeSource:
    name = "claude"

    def __init__(self, model=CLAUDE_MODEL):
        import anthropic  # imported here so the authored path works without the SDK

        self.anthropic = anthropic
        self.client = anthropic.Anthropic()
        self.model = model

    def input_key(self, lesson, page_files):
        return sha(self.name, self.model, PROMPT_FILE.read_text(encoding="utf-8"),
                   [file_sha(page_files[p]) for p in lesson["pages"]])

    def _prompt(self, lesson, book):
        return PROMPT_FILE.read_text(encoding="utf-8").format(
            topic=lesson["topic"], title=lesson["title"], subject=book["subject"],
            grade=book["grade"], pages=", ".join(str(p) for p in lesson["pages"]))

    def _call(self, content):
        response = self.client.beta.messages.create(
            model=self.model,
            max_tokens=16000,
            thinking={"type": "adaptive"},
            output_config={
                "effort": "high",
                "format": {"type": "json_schema", "schema": SCRIPT_SCHEMA},
            },
            # If a safety classifier declines, the API re-runs the request on its recommended fallback model.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": content}],
        )
        if response.stop_reason == "refusal":
            raise RuntimeError(f"model declined the request: {response.stop_details}")
        if response.stop_reason == "max_tokens":
            raise RuntimeError("output was cut off at max_tokens")
        text = next(b.text for b in response.content if b.type == "text")
        return json.loads(text), response

    def generate(self, lesson, book, page_files):
        content = []
        for p in lesson["pages"]:
            data = base64.standard_b64encode(Path(page_files[p]).read_bytes()).decode("utf-8")
            content.append({"type": "text", "text": f"Textbook page {p}:"})
            content.append({"type": "image", "source": {"type": "base64", "media_type": "image/webp", "data": data}})
        content.append({"type": "text", "text": self._prompt(lesson, book)})

        def attempt():
            script, response = self._call(content)
            problems = validate_script(script, lesson["pages"])
            if problems:  # a malformed quiz is retried, never saved
                raise ValueError("; ".join(problems))
            return script, response

        script, response = retry(attempt, f"Claude script for {lesson['id']}")
        usage = response.usage
        log.info("claude %s: %s in / %s out tokens", lesson["id"], usage.input_tokens, usage.output_tokens)
        return script, {"model": response.model, "input_tokens": usage.input_tokens,
                        "output_tokens": usage.output_tokens}


def get_source(name):
    if name == "authored":
        return AuthoredSource()
    if name == "claude":
        return ClaudeSource()
    raise ValueError(f"unknown script source {name!r} (use 'authored' or 'claude')")
