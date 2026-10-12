"""Create a college and its first college admin (F22). Run by the EduSaas team.

  python manage.py create_college "Margalla Heights College" --admin-phone 03001234567 --admin-name "Ms. Sana Javed"

The admin then signs in to the app with that phone number and registers everyone else in the Admin area.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from lms.auth import ApiError, mask_phone, normalize_phone
from lms.models import AuditLog, College, User


class Command(BaseCommand):
    help = "Create a college and its first college admin."

    def add_arguments(self, parser):
        parser.add_argument("name")
        parser.add_argument("--admin-phone", required=True)
        parser.add_argument("--admin-name", required=True)
        parser.add_argument("--admin-gender", choices=["male", "female"], default="female")
        parser.add_argument("--board", default="FBISE")

    @transaction.atomic
    def handle(self, name, admin_phone, admin_name, admin_gender, board, **opts):
        try:
            phone = normalize_phone(admin_phone)
        except ApiError as e:
            raise CommandError(e.message)
        from lms.fields import hash_phone
        if User.objects.filter(phone_number_hash=hash_phone(phone)).exists():
            raise CommandError("That phone number already belongs to an account.")
        if College.objects.filter(name__iexact=name.strip()).exists():
            raise CommandError("A college with this name already exists.")
        college = College.objects.create(name=name.strip(), board_affiliation=board)
        admin = User.objects.create_user(phone, admin_name.strip(), User.COLLEGE_ADMIN, college=college,
                                         gender=admin_gender)
        AuditLog.objects.create(college=college, actor=None, action="college.create", object_type="college",
                                object_id=str(college.id),
                                summary=f"College created with admin {admin.full_name} ({mask_phone(phone)})")
        self.stdout.write(self.style.SUCCESS(f"Created {college.name}. The admin signs in to the app with "
                                             f"{mask_phone(phone)}."))
