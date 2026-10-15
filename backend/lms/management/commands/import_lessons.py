"""Load Lesson Objects built by the Content Factory and copy their media into the web app."""
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from lms.models import Lesson, Subject, Unit
from lms.util import read_json


class Command(BaseCommand):
    help = "Import lessons from content_factory/output/<book>/lessons/*/lesson.json"

    def add_arguments(self, parser):
        parser.add_argument("book", nargs="?", default="phy11", help="book id or 'all'")
        parser.add_argument("--approved-only", action="store_true", help="skip lessons not approved by a reviewer")

    def handle(self, book, approved_only, **opts):
        content_root = Path(settings.CONTENT_DIR)
        if book == "all":
            books = sorted([d.name for d in content_root.iterdir() if d.is_dir() and (d / "lessons").exists()])
        else:
            books = [book]

        total_imported = 0
        for b in books:
            src = content_root / b
            files = sorted((src / "lessons").glob("*/lesson.json"))
            if not files:
                if book != "all":
                    raise CommandError(f"No lessons in {src}. Run: python content_factory/factory.py build {b}")
                continue
            media = Path(settings.MEDIA_DIR) / b
            count = 0
            for f in files:
                obj = read_json(f)
                if approved_only and obj.get("review", {}).get("status") != "approved":
                    self.stdout.write(f"skip {obj['id']} ({obj.get('review', {}).get('status')})")
                    continue
                ur = (obj.get("tracks") or {}).get("ur")
                for rel in obj.get("images", []) + obj.get("images_sm", []) + [obj.get("audio")] + ([ur["audio"]] if ur else []):
                    if not rel:
                        continue
                    dst = media / rel
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    src_file = src / rel
                    if src_file.exists() and (not dst.exists() or dst.stat().st_size != src_file.stat().st_size):
                        shutil.copyfile(src_file, dst)
                grade = obj["grade"].replace("Grade ", "") + "th" if obj["grade"].startswith("Grade") else obj["grade"]
                subject = Subject.objects.filter(code=obj["book"]).first() or \
                    Subject.objects.filter(name=obj["subject"], grade=grade).first() or \
                    Subject(name=obj["subject"], grade=grade)
                if not subject.code:
                    subject.code = obj["book"]
                if obj.get("review", {}).get("status") == "approved":
                    subject.status = "live"
                subject.save()
                unit, _ = Unit.objects.get_or_create(subject=subject, number=obj["unit"]["number"],
                                                     defaults={"title": obj["unit"]["title"]})
                order = obj["unit"]["number"] * 1000 + int(float(obj["topic"].split(".")[-1]) if "." in obj["topic"] else 0)
                Lesson.objects.update_or_create(id=obj["id"], defaults={
                    "subject": subject, "unit": unit, "book": obj["book"], "unit_number": obj["unit"]["number"],
                    "unit_title": obj["unit"]["title"], "topic": obj["topic"], "title": obj["title"],
                    "pages": obj["pages"], "images": obj["images"], "images_sm": obj.get("images_sm", []), "audio": obj["audio"],
                    "audio_bytes": obj["audio_bytes"], "duration_sec": obj["duration_sec"], "sections": obj["sections"],
                    "quiz": obj["quiz"], "review_status": obj.get("review", {}).get("status", "draft"),
                    "reviewed_by": None, "sort_order": order,
                    "ur_audio": ur["audio"] if ur else "", "ur_audio_bytes": ur["audio_bytes"] if ur else 0,
                    "ur_duration_sec": ur["duration_sec"] if ur else 0, "ur_sections": ur["sections"] if ur else [],
                    "ur_review_status": (obj.get("review_ur") or {}).get("status", "draft") if ur else ""})
                count += 1
                self.stdout.write(f"imported {obj['topic']} {obj['title']} ({len(obj['quiz'])} questions"
                                  + (", Urdu narration" if ur else "") + ")")
            self.stdout.write(self.style.SUCCESS(f"[{b}] {count} lesson(s) imported; media in {media}"))
            total_imported += count

        self.stdout.write(self.style.SUCCESS(f"Total: {total_imported} lesson(s) imported across {len(books)} book(s)"))
