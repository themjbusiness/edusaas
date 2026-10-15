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

# Units of the FBISE textbooks (National Book Foundation / Federal Textbook Board).
UNITS = {
    "phy11": [
        "Physical Quantities and Measurements", "Vectors", "Translatory Motion",
        "Rotational and Circular Motion", "Work and Kinetic Energy", "Fluid Mechanics",
        "Physics of Solids", "Heat and Thermodynamics", "Waves", "Electrostatics",
        "Electricity", "Magnetism", "Relativity", "Particle Physics"
    ],
    "chem11": [
        "Stoichiometry", "Atomic Structure", "Theories of Covalent Bonding and Shapes of Molecules",
        "States of Matter I: Gases", "States of Matter II: Liquids", "States of Matter III: Solids",
        "Chemical Equilibrium", "Acids, Bases and Salts", "Chemical Kinetics",
        "Solutions and Colloids", "Thermochemistry", "Electrochemistry"
    ],
    "bio11": [
        "Cell Structure and Function", "Biological Molecules", "Enzymes",
        "Bioenergetics", "Acellular Life", "Prokaryotes", "Diversity Among Plants",
        "Diversity Among Animals", "Form and Functions in Plants", "Digestion and Nutrition",
        "Circulation and Immunity", "Respiration"
    ],
    "math11": [
        "Complex Numbers", "Matrices and Determinants", "Vectors",
        "Sequences and Series", "Miscellaneous Series", "Permutation, Combination and Probability",
        "Mathematical Induction and Binomial Theorem", "Fundamentals of Trigonometry",
        "Trigonometric Identities", "Trigonometric Functions and Graphs",
        "Solutions of Triangles", "Inverse Trigonometric Functions"
    ],
    "cs11": [
        "Overview of Computer System", "Computer Architecture", "Central Processing Unit",
        "Inside the System Unit", "Network Communication", "Wireless Communication",
        "Database Fundamentals", "Database Management Systems", "Data Security and Privacy",
        "Operating System Fundamentals"
    ],
    "eng11": [
        "Short Stories", "Plays and Drama", "Poetry and Literary Appreciation",
        "Reading Comprehension and Synthesis", "Grammar in Context and Sentence Structure",
        "Composition and Academic Essay Writing", "Technical and Formal Communication"
    ],
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
