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
        parser.add_argument("book", nargs="?", default="phy11")
        parser.add_argument("--approved-only", action="store_true", help="skip lessons not approved by a reviewer")

    def handle(self, book, approved_only, **opts):
        src = Path(settings.CONTENT_DIR) / book
        files = sorted((src / "lessons").glob("*/lesson.json"))
        if not files:
            raise CommandError(f"No lessons in {src}. Run: python content_factory/factory.py build {book}")
        media = Path(settings.MEDIA_DIR) / book
        count = 0
        for f in files:
            obj = read_json(f)
            if approved_only and obj["review"]["status"] != "approved":
                self.stdout.write(f"skip {obj['id']} ({obj['review']['status']})")
                continue
            ur = (obj.get("tracks") or {}).get("ur")
            for rel in obj["images"] + obj.get("images_sm", []) + [obj["audio"]] + ([ur["audio"]] if ur else []):
                dst = media / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                if not dst.exists() or dst.stat().st_size != (src / rel).stat().st_size:
                    shutil.copyfile(src / rel, dst)
            grade = obj["grade"].replace("Grade ", "") + "th" if obj["grade"].startswith("Grade") else obj["grade"]
            # The catalogue (seed_catalogue) names subjects by book id; fall back to name and grade.
            subject = Subject.objects.filter(code=obj["book"]).first() or \
                Subject.objects.filter(name=obj["subject"], grade=grade).first() or \
                Subject(name=obj["subject"], grade=grade)
            if not subject.code:
                subject.code = obj["book"]
            subject.save()
            unit, _ = Unit.objects.get_or_create(subject=subject, number=obj["unit"]["number"],
                                                 defaults={"title": obj["unit"]["title"]})
            order = obj["unit"]["number"] * 1000 + int(float(obj["topic"].split(".")[-1]) if "." in obj["topic"] else 0)
            Lesson.objects.update_or_create(id=obj["id"], defaults={
                "subject": subject, "unit": unit, "book": obj["book"], "unit_number": obj["unit"]["number"],
                "unit_title": obj["unit"]["title"], "topic": obj["topic"], "title": obj["title"],
                "pages": obj["pages"], "images": obj["images"], "images_sm": obj.get("images_sm", []), "audio": obj["audio"],
                "audio_bytes": obj["audio_bytes"], "duration_sec": obj["duration_sec"], "sections": obj["sections"],
                "quiz": obj["quiz"], "review_status": obj["review"]["status"],
                "reviewed_by": obj["review"].get("reviewed_by") or "", "sort_order": order,
                "ur_audio": ur["audio"] if ur else "", "ur_audio_bytes": ur["audio_bytes"] if ur else 0,
                "ur_duration_sec": ur["duration_sec"] if ur else 0, "ur_sections": ur["sections"] if ur else [],
                "ur_review_status": (obj.get("review_ur") or {}).get("status", "draft") if ur else ""})
            count += 1
            self.stdout.write(f"imported {obj['topic']} {obj['title']} ({len(obj['quiz'])} questions"
                              + (", Urdu narration" if ur else "") + ")")
        self.stdout.write(self.style.SUCCESS(f"{count} lesson(s) imported; media in {media}"))
