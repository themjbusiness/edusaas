"""Create the demo roster: one fictional college, two classes, two teachers, their students and parents.

Only these people can log in. Phone numbers use the +92399 range, which no Pakistani operator
issues, so no real person can receive anything. Run again to reset the demo to a clean state.
"""
import secrets

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction

from lms.models import (AuditLog, Attendance, Clearance, ImportBatch, College, LessonProgress, Notification, OTPCode, QuizAttempt, SchoolClass,
                        StudentProfile, Subject, SubjectRequest, TeachingAssignment, User)

YEAR = "2026-2027"
CLASSES = {
    "A": {"stream": "Pre-Medical", "section": "A",
          "teacher": ("Mr. Tariq Mehmood", "+923991110001"),
          # F20: a second teacher gives class A three subjects; Chemistry and Biology have no content yet.
          "more": [("Mr. Adeel Anwar", "+923991110003", ["chem11", "bio11"])],
          "students": [
              ("Ali Raza", "11A-01", "+923992220001", "Mrs. Fatima Raza", "+923993330001"),
              ("Hamza Khan", "11A-02", "+923992220002", "Mr. Imran Khan", "+923993330002"),
              ("Bilal Ahmed", "11A-03", "+923992220003", "Mr. Naveed Ahmed", "+923993330003"),  # not on WhatsApp
              ("Usman Tariq", "11A-04", "+923992220004", "Mrs. Saima Tariq", "+923993330004"),
              ("Zain Malik", "11A-05", "+923992220005", "Mr. Asif Malik", "+923993330005"),
              ("Ahsan Iqbal", "11A-06", "+923992220006", "Mrs. Nadia Iqbal", "+923993330006"),
          ]},
    "B": {"stream": "Pre-Engineering", "section": "B",
          "teacher": ("Mr. Kamran Shah", "+923991110002"),
          "more": [("Mr. Kamran Shah", "+923991110002", ["math11"])],
          "students": [
              ("Saad Hussain", "11B-01", "+923992220011", "Mr. Jawad Hussain", "+923993330011"),
              ("Omer Farooq", "11B-02", "+923992220012", "Mrs. Hina Farooq", "+923993330012"),
          ]},
}
ADMIN_PHONE = "+923999990000"
COLLEGE_ADMIN = ("Ms. Sana Javed", "+923994440001")  # F22: signs in to the app, sees only this college


class Command(BaseCommand):
    help = "Reset the database to the demo roster, the subject catalogue and the Physics lessons."

    def add_arguments(self, parser):
        parser.add_argument("--admin-password", help="password for the /admin account (random if omitted)")

    @transaction.atomic
    def handle(self, admin_password=None, **opts):
        call_command("seed_catalogue", stdout=self.stdout)
        call_command("import_lessons", "phy11", stdout=self.stdout)
        for model in (Notification, QuizAttempt, LessonProgress, Clearance, Attendance, OTPCode, StudentProfile,
                      SubjectRequest, TeachingAssignment, SchoolClass, ImportBatch, AuditLog):
            model.objects.all().delete()
        User.objects.all().delete()
        College.objects.all().delete()

        college = College.objects.create(name="Margalla Heights College (Demo)", subscription_status="trial")
        physics = Subject.objects.get(code="phy11")
        rows = []
        for key, spec in CLASSES.items():
            cls = SchoolClass.objects.create(college=college, grade="11th", stream=spec["stream"],
                                             section=spec["section"], academic_year=YEAR, gender="male")
            tname, tphone = spec["teacher"]
            teacher = User.objects.create_user(tphone, tname, User.TEACHER, college=college, gender="male")
            TeachingAssignment.objects.create(teacher=teacher, school_class=cls, subject=physics)
            rows.append(("Teacher", tname, tphone, f"{cls}, Physics"))
            for oname, ophone, codes in spec.get("more", []):
                from lms.fields import hash_phone
                other = User.objects.filter(phone_number_hash=hash_phone(ophone)).first() or \
                    User.objects.create_user(ophone, oname, User.TEACHER, college=college, gender="male")
                for code in codes:
                    subject = Subject.objects.get(code=code)
                    TeachingAssignment.objects.create(teacher=other, school_class=cls, subject=subject)
                    rows.append(("Teacher", oname, ophone, f"{cls}, {subject.name}"))
            for sname, roll, sphone, pname, pphone in spec["students"]:
                pgender = "female" if pname.startswith("Mrs.") else "male"
                parent = User.objects.create_user(pphone, pname, User.PARENT, college=college, gender=pgender)
                student = User.objects.create_user(sphone, sname, User.STUDENT, college=college, gender="male")
                profile = StudentProfile(user=student, school_class=cls, roll_number=roll, parent=parent)
                profile.full_clean()
                profile.save()
                rows.append(("Student", sname, sphone, f"{cls}, roll {roll}"))
                rows.append(("Parent", pname, pphone, f"parent of {sname}"))

        User.objects.create_user(COLLEGE_ADMIN[1], COLLEGE_ADMIN[0], User.COLLEGE_ADMIN, college=college, gender="female")
        rows.append(("Admin", COLLEGE_ADMIN[0], COLLEGE_ADMIN[1], "college admin (in-app Admin area)"))
        password = admin_password or secrets.token_urlsafe(9)
        User.objects.create_superuser(ADMIN_PHONE, "Demo Admin", password, college=college)

        self.stdout.write(self.style.SUCCESS(f"\nDemo roster for {college.name}:"))
        for role, name, phone, note in rows:
            self.stdout.write(f"  {role:<8} {name:<20} {phone}  {note}")
        self.stdout.write(f"\n  Admin panel: /admin   phone {ADMIN_PHONE}   password {password}")
        self.stdout.write("  Parent of Bilal Ahmed is simulated as 'not on WhatsApp' (SMS fallback).")
