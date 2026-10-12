"""Content Factory: turn textbook pages into narrated Lesson Objects.

Examples:
  python factory.py build phy11                          # all lessons, authored scripts
  python factory.py build phy11 --only u1-dimensions     # one lesson
  python factory.py build phy11 --source claude          # Claude writes the scripts (needs a key)
  python factory.py status phy11
  python factory.py review phy11 u1-estimation --approve --by "Mr. Tariq"
  python factory.py export phy11                         # copy media into ../media
"""
import argparse
import logging
import sys
from pathlib import Path

from cf import pipeline
from cf.script_sources import get_source

ROOT = Path(__file__).resolve().parent


def cmd_build(args):
    book = pipeline.load_book(args.book)
    source = get_source(args.source)
    ids = args.only.split(",") if args.only else None
    failed = []
    for unit, lesson in pipeline.pick(book, ids):
        try:
            pipeline.build_lesson(book, unit, lesson, source, force=args.force)
        except Exception as e:  # keep going: one bad lesson must not stop the batch
            logging.error("[%s] FAILED: %s", lesson["id"], e)
            failed.append(lesson["id"])
    if failed:
        logging.error("%d lesson(s) failed: %s", len(failed), ", ".join(failed))
        return 1
    if args.export:
        pipeline.export_demo(book, ROOT.parent)
    return 0


def cmd_status(args):
    book = pipeline.load_book(args.book)
    print(f"{'lesson':<20} {'topic':<6} {'audio':>7} {'MB':>5} {'quiz':>4}  review    notes")
    for _, lesson in pipeline.all_lessons(book):
        obj = pipeline.read_json(book["out"] / "lessons" / lesson["id"] / "lesson.json")
        if not obj:
            print(f"{lesson['id']:<20} {lesson['topic']:<6} {'not built':>7}")
            continue
        d = obj["duration_sec"]
        print(f"{obj['id']:<20} {obj['topic']:<6} {int(d // 60):>4}:{int(d % 60):02d} {obj['audio_bytes'] / 1e6:>5.1f} "
              f"{len(obj['quiz']):>4}  {obj['review']['status']:<9} {len(obj['review_notes'])}")
        ur = obj.get("tracks", {}).get("ur")
        if ur:
            d = ur["duration_sec"]
            print(f"{'':<20} {'  ur':<6} {int(d // 60):>4}:{int(d % 60):02d} {ur['audio_bytes'] / 1e6:>5.1f} "
                  f"{'':>4}  {obj['review_ur']['status']:<9} (Urdu narration)")
        for note in obj["review_notes"]:
            print(f"{'':<28}- {note}")
    return 0


def cmd_review(args):
    book = pipeline.load_book(args.book)
    status = "approved" if args.approve else "changes_requested"
    obj = pipeline.set_review(book, args.lesson, status, args.by, args.comment, track=args.track)
    print(f"{obj['id']} ({'Urdu narration' if args.track == 'ur' else 'lesson'}): {status} by {args.by}")
    return 0


def cmd_export(args):
    book = pipeline.load_book(args.book)
    pipeline.export_demo(book, Path(args.to), approved_only=args.approved_only)
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-v", "--verbose", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build", help="render pages, write scripts, narrate and bundle lessons")
    b.add_argument("book")
    b.add_argument("--only", help="comma-separated lesson ids")
    b.add_argument("--source", default="authored", choices=["authored", "claude"])
    b.add_argument("--force", action="store_true", help="regenerate even if inputs are unchanged")
    b.add_argument("--export", action="store_true", help="copy media into ../media afterwards")
    b.set_defaults(fn=cmd_build)

    s = sub.add_parser("status", help="list built lessons and their review status")
    s.add_argument("book")
    s.set_defaults(fn=cmd_status)

    r = sub.add_parser("review", help="record a subject-expert review")
    r.add_argument("book")
    r.add_argument("lesson")
    r.add_argument("--track", choices=["mix", "ur"], default="mix", help="ur reviews the Urdu narration (F12)")
    g = r.add_mutually_exclusive_group(required=True)
    g.add_argument("--approve", action="store_true")
    g.add_argument("--request-changes", action="store_true")
    r.add_argument("--by", required=True, help="reviewer name")
    r.add_argument("--comment")
    r.set_defaults(fn=cmd_review)

    e = sub.add_parser("export", help="copy lessons into the demo app")
    e.add_argument("book")
    e.add_argument("--to", default=str(ROOT.parent), help="project folder; media goes to <to>/media/<book>")
    e.add_argument("--approved-only", action="store_true")
    e.set_defaults(fn=cmd_export)

    args = ap.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format="%(levelname)-7s %(message)s")
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
