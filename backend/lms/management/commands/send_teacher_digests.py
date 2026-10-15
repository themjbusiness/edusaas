"""Send each teacher a weekly at-risk digest for their assigned classes (F11).

Schedule it for Sunday 19:00 Pakistan time:
  Windows: Task Scheduler -> "python manage.py send_teacher_digests" in backend folder.
  Linux:   0 19 * * 0  cd /path/to/backend && python manage.py send_teacher_digests
Running it again in the same week is idempotent.
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from lms import notify
from lms.models import Notification, StudentProfile, User
from lms.teacher_api import _at_risk_students_for_teacher


def week_bounds(end=None):
    today = timezone.localdate()
    end = end or today - timedelta(days=(today.weekday() + 1) % 7)
    return end - timedelta(days=6), end


class Command(BaseCommand):
    help = "Send the weekly at-risk summary to every teacher with assigned classes."

    def add_arguments(self, parser):
        parser.add_argument("--week-ending", help="YYYY-MM-DD, a Sunday (default: the most recent Sunday)")
        parser.add_argument("--dry-run", action="store_true", help="print the messages without saving them")

    def handle(self, week_ending=None, dry_run=False, **opts):
        try:
            end = date.fromisoformat(week_ending) if week_ending else None
        except ValueError:
            raise CommandError("--week-ending must be YYYY-MM-DD")
        start, end = week_bounds(end)
        key = f"teacher_digest:week:{end.isoformat()}"
        sent = skipped = 0

        teachers = User.objects.filter(role=User.TEACHER, is_active=True).prefetch_related("assignments")
        for teacher in teachers:
            if not teacher.assignments.exists():
                skipped += 1
                continue

            if Notification.objects.filter(recipient=teacher, template_type="teacher_digest", provider_msg_id=key).exists():
                skipped += 1
                continue

            at_risk = _at_risk_students_for_teacher(teacher)
            if not at_risk:
                skipped += 1
                continue

            first_student = User.objects.filter(id=at_risk[0]["studentId"]).first()
            if not first_student:
                continue

            names = ", ".join(s["name"] for s in at_risk[:3])
            if len(at_risk) > 3:
                names += f" and {len(at_risk) - 3} more"

            lang = notify.lang_of(teacher)
            if lang == "ur":
                body = (f"ہفتہ وار رپورٹ: آپ کی کلاسوں میں {len(at_risk)} طلباء ({names}) "
                        f"کو فوری توجہ اور ریویو کی ضرورت ہے۔ برائے مہربانی ٹیچر پورٹل پر ان کا جائزہ لیں۔")
            else:
                body = (f"Weekly At-Risk Digest: {len(at_risk)} student(s) currently require catch-up intervention "
                        f"in your classes ({names}). Please review clearances or nudge parents in your portal.")

            if dry_run:
                self.stdout.write(f"Teacher {teacher.full_name}: {body}")
                continue

            n = notify.inbox(first_student, teacher, "teacher", "teacher_digest", body)
            n.provider_msg_id = key
            n.save(update_fields=["provider_msg_id"])
            sent += 1

        self.stdout.write(self.style.SUCCESS(f"Teacher digests for week ending {end}: {sent} sent, {skipped} skipped."))
