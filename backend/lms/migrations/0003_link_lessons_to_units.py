"""F20: give existing subjects a code (their book id) and link existing lessons to Unit rows."""
from django.db import migrations


def forwards(apps, schema_editor):
    Lesson, Unit = apps.get_model("lms", "Lesson"), apps.get_model("lms", "Unit")
    for lesson in Lesson.objects.select_related("subject"):
        subject = lesson.subject
        if not subject.code:
            subject.code = lesson.book
            subject.save(update_fields=["code"])
        unit, _ = Unit.objects.get_or_create(subject=subject, number=lesson.unit_number,
                                             defaults={"title": lesson.unit_title})
        lesson.unit = unit
        lesson.save(update_fields=["unit"])


class Migration(migrations.Migration):
    dependencies = [("lms", "0002_subjects_units_requests")]
    operations = [migrations.RunPython(forwards, migrations.RunPython.noop)]
