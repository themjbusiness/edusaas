"""Send each parent a weekly progress summary per child (F21), as a free in-app message (decision D6).

Schedule it for Sunday 18:00 Pakistan time:
  Windows: Task Scheduler -> "python manage.py send_weekly_summaries" in the backend folder.
  Linux:   0 18 * * 0  cd /path/to/backend && python manage.py send_weekly_summaries
Running it again in the same week sends nothing new. Parents who turned the summary off are skipped.
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from lms import notify
from lms.api import child_progress
from lms.models import Attendance, Clearance, Notification, User


def week_bounds(end=None):
    """Monday to Sunday of the week ending on `end` (default: the most recent Sunday, or today if Sunday)."""
    today = timezone.localdate()
    end = end or today - timedelta(days=(today.weekday() + 1) % 7)
    return end - timedelta(days=6), end


def summary_text(student, start, end, lang="en"):
    att = Attendance.objects.filter(student=student, date__range=(start, end))
    total = att.count()
    present = att.filter(status__in=(Attendance.PRESENT, Attendance.LATE)).count()
    absences = Clearance.objects.filter(student=student, attendance__date__range=(start, end))
    cleared = absences.filter(status__in=(Clearance.CLEARED, Clearance.OVERRIDE)).count()
    data = child_progress(student)
    if lang == "ur":
        return summary_text_ur(student, start, end, total, present, absences, cleared, data)
    parts = [f"Weekly summary, {start:%a %d %b} to {end:%a %d %b}. {student.full_name}: "
             + (f"present in {present} of {total} classes." if total else "no classes recorded this week.")]
    if absences.exists():
        n = absences.count()
        parts.append(f"{n} missed lecture{'s' if n > 1 else ''}, {cleared} cleared.")
    live = [s for s in data["subjects"] if s["status"] == "live"]
    if live:
        parts.append("; ".join(f"{s['name']} {s['done']} of {s['total']} topics"
                               + (f", average quiz {s['avgScore']:g}/5" if s["avgScore"] is not None else "")
                               for s in live) + ".")
    soon = [s["name"] for s in data["subjects"] if s["status"] != "live"]
    if soon:
        parts.append(", ".join(soon) + ": coming soon.")
    return " ".join(parts)


def summary_text_ur(student, start, end, total, present, absences, cleared, data):
    """Urdu weekly summary (F23). Draft text for native-speaker review."""
    parts = [f"ہفتہ وار رپورٹ، {notify.ur_date(start)} تا {notify.ur_date(end)}۔ {student.full_name}: "
             + (f"{total} میں سے {present} کلاسوں میں حاضر۔" if total else "اس ہفتے کوئی حاضری درج نہیں ہوئی۔")]
    if absences.exists():
        parts.append(f"{absences.count()} چھوٹے ہوئے لیکچر، {cleared} کلیئر۔")
    live = [s for s in data["subjects"] if s["status"] == "live"]
    if live:
        parts.append("؛ ".join(f"{notify.ur_subject(s['name'])}: {s['total']} میں سے {s['done']} موضوعات مکمل"
                               + (f"، کوئز اوسط {s['avgScore']:g}/5" if s["avgScore"] is not None else "")
                               for s in live) + "۔")
    soon = [notify.ur_subject(s["name"]) for s in data["subjects"] if s["status"] != "live"]
    if soon:
        parts.append("، ".join(soon) + ": جلد آ رہے ہیں۔")
    return " ".join(parts)


class Command(BaseCommand):
    help = "Send the weekly progress summary to every parent who has it switched on."

    def add_arguments(self, parser):
        parser.add_argument("--week-ending", help="YYYY-MM-DD, a Sunday (default: the most recent Sunday)")
        parser.add_argument("--dry-run", action="store_true", help="print the messages without saving them")

    def handle(self, week_ending=None, dry_run=False, **opts):
        try:
            end = date.fromisoformat(week_ending) if week_ending else None
        except ValueError:
            raise CommandError("--week-ending must be YYYY-MM-DD")
        start, end = week_bounds(end)
        key = f"week:{end.isoformat()}"  # makes the command idempotent per parent, child and week
        sent = skipped = 0
        for parent in User.objects.filter(role=User.PARENT, is_active=True).prefetch_related("children__user"):
            for profile in parent.children.all():
                if not profile.user.is_active:
                    continue
                if not parent.weekly_summary:
                    skipped += 1
                    continue
                if Notification.objects.filter(recipient=parent, student=profile.user, template_type="weekly_summary",
                                               provider_msg_id=key).exists():
                    continue
                body = summary_text(profile.user, start, end, notify.lang_of(parent))
                if dry_run:
                    self.stdout.write(body)
                    continue
                n = notify.inbox(profile.user, parent, "parent", "weekly_summary", body)
                n.provider_msg_id = key
                n.save(update_fields=["provider_msg_id"])
                sent += 1
        self.stdout.write(self.style.SUCCESS(f"Week {start} to {end}: {sent} sent, {skipped} skipped (opted out)."))
