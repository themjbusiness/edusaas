"""Lesson script schema and validation (DoD: the quiz JSON is validated before it is saved)."""
import jsonschema

SCRIPT_SCHEMA = {
    "type": "object",
    "properties": {
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "page": {"type": "integer"},
                    "text": {"type": "string"},
                },
                "required": ["page", "text"],
                "additionalProperties": False,
            },
        },
        "quiz": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                    "answer": {"type": "integer"},
                    "explanation": {"type": "string"},
                },
                "required": ["question", "options", "answer", "explanation"],
                "additionalProperties": False,
            },
        },
        "review_notes": {"type": "array", "items": {"type": "string"}},
        # F12: optional second narration in Urdu script, read by a Pakistani Urdu voice.
        "sections_ur": {"type": "array", "items": {
                "type": "object",
                "properties": {
                    "page": {"type": "integer"},
                    "text": {"type": "string"},
                },
                "required": ["page", "text"],
                "additionalProperties": False,
            }},
    },
    "required": ["sections", "quiz", "review_notes"],
    "additionalProperties": False,
}

MIN_SECTIONS, MAX_SECTIONS = 3, 20
MIN_QUIZ = 5  # the student portal draws 5 questions per attempt


class ScriptError(ValueError):
    """The script is structurally valid JSON but breaks a content rule."""


def _check_sections(sections, pages, label):
    problems = []
    if not MIN_SECTIONS <= len(sections) <= MAX_SECTIONS:
        problems.append(f"expected {MIN_SECTIONS}-{MAX_SECTIONS} {label}sections, got {len(sections)}")
    for i, s in enumerate(sections):
        if s["page"] not in pages:
            problems.append(f"{label}section {i + 1}: page {s['page']} is not one of the lesson pages {pages}")
        if not s["text"].strip():
            problems.append(f"{label}section {i + 1}: empty text")
    order = [pages.index(s["page"]) for s in sections if s["page"] in pages]
    if order != sorted(order):
        problems.append(f"{label}sections jump back to an earlier page; narration must follow page order")
    return problems


def validate_script(script, pages):
    """Check a script against the schema and the content rules. Returns a list of problems."""
    try:
        jsonschema.validate(script, SCRIPT_SCHEMA)
    except jsonschema.ValidationError as e:
        return [f"schema: {e.message} at {'/'.join(str(p) for p in e.absolute_path)}"]

    problems = []
    sections, quiz = script["sections"], script["quiz"]
    problems += _check_sections(sections, pages, "")
    if script.get("sections_ur"):
        problems += _check_sections(script["sections_ur"], pages, "Urdu ")

    if len(quiz) < MIN_QUIZ:
        problems.append(f"quiz needs at least {MIN_QUIZ} questions, got {len(quiz)}")
    seen = set()
    for i, q in enumerate(quiz):
        n = i + 1
        if len(q["options"]) != 4:
            problems.append(f"question {n}: needs exactly 4 options, got {len(q['options'])}")
        if not 0 <= q["answer"] < len(q["options"]):
            problems.append(f"question {n}: answer index {q['answer']} is out of range")
        if len({o.strip().lower() for o in q["options"]}) != len(q["options"]):
            problems.append(f"question {n}: duplicate options")
        key = q["question"].strip().lower()
        if key in seen:
            problems.append(f"question {n}: duplicate question")
        seen.add(key)
    return problems
