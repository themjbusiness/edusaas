"""Create or update the subject catalogue (F20): six subjects for Grade 11 and Grade 12, plus Physics 11 units.

Safe to run again. Subjects without approved lessons show as "Coming soon" to students and teachers.
Signed-off list (30 September 2026): Physics, Chemistry, Biology, Mathematics, English, Computer Science.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from lms.models import Subject, Unit

SUBJECTS = [("phy", "Physics"), ("chem", "Chemistry"), ("bio", "Biology"), ("math", "Mathematics"),
            ("eng", "English"), ("cs", "Computer Science")]
GRADES = {"11": "11th", "12": "12th"}

# Units of the FBISE Physics Grade 11 textbook (National Book Foundation), from its preface.
UNITS = {
    "phy11": ["Physical Quantities and Measurements", "Vectors", "Translatory Motion", "Rotational and Circular Motion",
              "Work and Kinetic Energy", "Fluid Mechanics", "Physics of Solids", "Heat and Thermodynamics", "Waves",
              "Electrostatics", "Electricity", "Magnetism", "Relativity", "Particle Physics"],
}


class Command(BaseCommand):
    help = "Create or update the subject catalogue and known units."

    @transaction.atomic
    def handle(self, **opts):
        for g, grade in GRADES.items():
            for order, (prefix, name) in enumerate(SUBJECTS):
                code = prefix + g
                subject = Subject.objects.filter(code=code).first() or \
                    Subject.objects.filter(name=name, grade=grade).first() or Subject(name=name, grade=grade)
                subject.code, subject.name, subject.grade, subject.sort_order = code, name, grade, order
                subject.save()
                for number, title in enumerate(UNITS.get(code, []), start=1):
                    Unit.objects.update_or_create(subject=subject, number=number, defaults={"title": title})
        self.stdout.write(self.style.SUCCESS(f"Catalogue: {Subject.objects.count()} subjects, "
                                             f"{Unit.objects.count()} units"))
