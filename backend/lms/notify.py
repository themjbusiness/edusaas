"""Notification engine. Every alert is logged as a Notification row.

Free mode (default, decision D6): each alert goes to the recipient's in-app inbox and is pushed to their
subscribed browsers (web push). Teachers can also send the parent a WhatsApp message by hand (one tap).
Paid mode (PAID_MESSAGING=1): WhatsApp first, SMS fallback. Providers are simulated in demo mode; a real
provider (Meta Cloud API, local SMS gateway) implements `send(phone, body) -> message id` and raises on failure.
"""
import logging
import uuid

from django.conf import settings
from django.utils import timezone

from .auth import mask_phone
from . import push
from .models import Notification

log = logging.getLogger("lms")


class ProviderError(Exception):
    pass


class SimulatedWhatsApp:
    channel = "whatsapp"

    def send(self, phone, body):
        # For the demo, numbers listed here behave like a parent without WhatsApp.
        if phone in getattr(settings, "SIMULATE_WHATSAPP_FAILURE", ()):
            raise ProviderError("recipient is not on WhatsApp")
        return "wa-" + uuid.uuid4().hex[:12]


class SimulatedSMS:
    channel = "sms"

    def send(self, phone, body):
        return "sms-" + uuid.uuid4().hex[:12]


PROVIDERS = [SimulatedWhatsApp(), SimulatedSMS()]


TITLES = {"absence_alert": "Absence alert", "clearance_granted": "Cleared for class",
          "clearance_override": "Cleared by the teacher", "weekly_summary": "Weekly summary"}
TITLES_UR = {"absence_alert": "غیر حاضری کی اطلاع", "clearance_granted": "کلاس کے لیے کلیئر",
             "clearance_override": "ٹیچر نے کلیئر کر دیا", "weekly_summary": "ہفتہ وار رپورٹ"}


def free_send(student, recipient, role, template, body, lesson=None):
    """In-app inbox plus web push to the recipient's own devices. Costs nothing; not rate-limited."""
    n = Notification.objects.create(student=student, recipient=recipient, recipient_phone=recipient.phone_number,
                                    recipient_role=role, channel="inbox", template_type=template, body=body,
                                    lesson=lesson, status="delivered")
    titles = TITLES_UR if role == "parent" and lang_of(recipient) == "ur" else TITLES
    ok, total = push.send(recipient, titles.get(template, "EduSaas"), body, "/#/parent" if role == "parent" else "/#/teacher")
    n.provider_msg_id = f"push:{ok}/{total}"
    n.save(update_fields=["provider_msg_id"])
    return n


def send(student, recipient, role, template, body, lesson=None):
    """Deliver one message to a parent or teacher. Returns the Notification that succeeded (or the last one)."""
    if not settings.PAID_MESSAGING:
        return free_send(student, recipient, role, template, body, lesson)
    phone = recipient.phone_number
    today = timezone.localdate()
    sent_today = Notification.objects.filter(recipient_phone=phone, sent_at__date=today, channel__in=("whatsapp", "sms"),
                                             status__in=("sent", "delivered")).count()
    common = dict(student=student, recipient=recipient, recipient_phone=phone, recipient_role=role,
                  template_type=template, body=body, lesson=lesson)
    if role == "parent" and sent_today >= settings.MAX_MESSAGES_PER_PARENT_PER_DAY:
        log.warning("daily message limit reached for %s", mask_phone(phone))
        return Notification.objects.create(channel="whatsapp", status="skipped", error="daily limit reached", **common)
    last = None
    for provider in PROVIDERS:
        try:
            msg_id = provider.send(phone, body)
            return Notification.objects.create(channel=provider.channel, status="delivered",
                                               provider_msg_id=msg_id, **common)
        except ProviderError as e:
            log.warning("%s to %s failed: %s", provider.channel, mask_phone(phone), e)
            last = Notification.objects.create(channel=provider.channel, status="failed", error=str(e)[:200], **common)
    return last


def pronoun(student):
    return "she" if student.gender == "female" else "he"


# Urdu versions of the parent alerts (F23). Draft text: a native speaker must review it before parents see it.
UR_SUBJECTS = {"Physics": "فزکس", "Chemistry": "کیمسٹری", "Biology": "بیالوجی", "Mathematics": "ریاضی",
               "English": "انگریزی", "Computer Science": "کمپیوٹر سائنس"}
UR_MONTHS = ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"]


def ur_subject(name):
    return UR_SUBJECTS.get(name, name)


def ur_date(d):
    return f"{d.day} {UR_MONTHS[d.month - 1]}"


def lang_of(user):
    return "ur" if getattr(user, "language", "en") == "ur" else "en"


def absence_text(student, subject, school_class, lesson, lang="en"):
    if lang == "ur":
        was = "تھی" if student.gender == "female" else "تھا"
        return (f"محترم والدین، {student.full_name} آج {ur_subject(subject.name)} ({school_class}) کی کلاس میں غیر حاضر {was}۔ "
                f"چھوٹا ہوا لیکچر: \"{lesson.topic} {lesson.title}\"۔ براہ کرم یقینی بنائیں کہ اگلی کلاس سے پہلے "
                f"یہ ڈیجیٹل لیکچر سن کر کوئز مکمل کر لیا جائے۔")
    return (f"Dear Parent, {student.full_name} was marked absent today in {subject.name} ({school_class}). "
            f"Missed lecture: \"{lesson.topic} {lesson.title}\". Please ensure {pronoun(student)} completes the "
            f"digital backup lecture and quiz before the next class.")


def absence_alert(student, parent, subject, school_class, lesson):
    return send(student, parent, "parent", "absence_alert",
                absence_text(student, subject, school_class, lesson, lang_of(parent)), lesson)


def cleared_text(student, lesson, score, lang="en"):
    if lang == "ur":
        return (f"محترم والدین، {student.full_name} نے چھوٹا ہوا لیکچر \"{lesson.topic} {lesson.title}\" مکمل کر لیا ہے "
                f"اور کوئز میں {settings.QUIZ_SIZE} میں سے {score} درست جواب دیے ہیں۔ اب کلاس میں داخلے کی اجازت ہے۔")
    return (f"Dear Parent, {student.full_name} has completed the missed lecture \"{lesson.topic} {lesson.title}\" and "
            f"passed the assessment ({score}/{settings.QUIZ_SIZE}). {pronoun(student).capitalize()} is cleared for class entry.")


def clearance_granted(student, parent, teachers, lesson, score):
    send(student, parent, "parent", "clearance_granted", cleared_text(student, lesson, score, lang_of(parent)), lesson)
    for t in teachers:
        send(student, t, "teacher", "clearance_granted",
             f"{student.full_name} ({student.student.roll_number}) completed \"{lesson.topic} {lesson.title}\" and scored "
             f"{score}/{settings.QUIZ_SIZE}. Cleared for class entry.", lesson)


def override_text(student, lesson, lang="en"):
    if lang == "ur":
        return (f"محترم والدین، کلاس ٹیچر نے چھوٹے ہوئے لیکچر \"{lesson.topic} {lesson.title}\" کے بارے میں "
                f"{student.full_name} کو کلاس میں داخلے کی اجازت دے دی ہے۔")
    return (f"Dear Parent, {student.full_name} has been cleared for class entry by the class teacher "
            f"for the missed lecture \"{lesson.topic} {lesson.title}\".")


def clearance_override(student, parent, lesson):
    send(student, parent, "parent", "clearance_override", override_text(student, lesson, lang_of(parent)), lesson)


def inbox(student, recipient, role, template, body):
    """Free in-app message plus web push (decision D6). Not counted towards the daily WhatsApp/SMS limit."""
    return free_send(student, recipient, role, template, body)
