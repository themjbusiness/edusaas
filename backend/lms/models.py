"""Data model for the Delivery Platform (blueprint 3.3, with change-register fixes CR-19 to CR-23).

Who can log in is decided entirely by this roster: a phone number must belong to an active User.
Relationships decide what each user can see:
  teacher -> TeachingAssignment -> SchoolClass -> StudentProfile -> student
  parent  -> StudentProfile.parent -> their own child only
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q

from .fields import EncryptedCharField, hash_phone

PHONE_REGEX = r"^\+923[0-9]{9}$"
phone_validator = RegexValidator(PHONE_REGEX, "Use the format +923XXXXXXXXX (E.164).")


class College(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    board_affiliation = models.CharField(max_length=50, default="FBISE")
    subscription_status = models.CharField(
        max_length=20, default="trial", choices=[("active", "Active"), ("trial", "Trial"), ("expired", "Expired")])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, phone_number, full_name, role, password=None, **extra):
        user = self.model(phone_number=phone_number, phone_number_hash=hash_phone(phone_number), full_name=full_name, role=role, **extra)
        user.full_clean(exclude=["password", "college"])
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, full_name, password=None, **extra):
        extra.setdefault("gender", "male")
        return self.create_user(phone_number, full_name, User.CONTENT_ADMIN, password,
                                is_staff=True, is_superuser=True, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    STUDENT, TEACHER, PARENT, COLLEGE_ADMIN, CONTENT_ADMIN = "student", "teacher", "parent", "college_admin", "content_admin"
    ROLES = [(STUDENT, "Student"), (TEACHER, "Teacher"), (PARENT, "Parent"),
             (COLLEGE_ADMIN, "College admin"), (CONTENT_ADMIN, "Content admin")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    college = models.ForeignKey(College, null=True, blank=True, on_delete=models.PROTECT, related_name="users")
    full_name = models.CharField(max_length=100)
    phone_number = EncryptedCharField(max_length=255, validators=[phone_validator])
    phone_number_hash = models.CharField(max_length=64, unique=True, db_index=True)
    activation_code = models.CharField(max_length=10, blank=True)
    role = models.CharField(max_length=20, choices=ROLES)
    gender = models.CharField(max_length=10, choices=[("male", "Male"), ("female", "Female")])
    is_active = models.BooleanField(default=True, help_text="Untick to suspend. Records are never deleted.")
    weekly_summary = models.BooleanField(default=True, help_text="Parents: receive the Sunday progress summary (F21).")
    language = models.CharField(max_length=2, default="en", choices=[("en", "English"), ("ur", "Urdu")],
                                help_text="App language; for parents also the language of alerts (F23).")
    is_staff = models.BooleanField(default=False)
    token_version = models.PositiveIntegerField(default=0, help_text="Increase to log the user out everywhere.")
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "phone_number_hash"
    REQUIRED_FIELDS = ["full_name"]
    objects = UserManager()

    def save(self, *args, **kwargs):
        if self.phone_number:
            self.phone_number_hash = hash_phone(self.phone_number)
        super().save(*args, **kwargs)

    class Meta:
        pass

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"

    def clean(self):
        if self.role != self.CONTENT_ADMIN and not self.college_id:
            raise ValidationError({"college": "Every student, teacher, parent and college admin belongs to a college."})


class Subject(models.Model):
    """A catalogue subject for one grade. It is "live" for students only while it has lessons they may see."""
    code = models.CharField(max_length=20, unique=True, null=True, blank=True, help_text="Book id, e.g. phy11")
    name = models.CharField(max_length=100)
    grade = models.CharField(max_length=20)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [("name", "grade")]
        ordering = ["grade", "sort_order", "name"]

    def __str__(self):
        return f"{self.name} ({self.grade})"


class Unit(models.Model):
    """A textbook unit. Units exist before their lessons, so the library can show "Coming soon"."""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="units")
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=150)

    class Meta:
        unique_together = [("subject", "number")]
        ordering = ["subject", "number"]

    def __str__(self):
        return f"{self.subject.name} Unit {self.number}: {self.title}"


class SchoolClass(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    college = models.ForeignKey(College, on_delete=models.PROTECT, related_name="classes")
    grade = models.CharField(max_length=20)
    stream = models.CharField(max_length=50)
    section = models.CharField(max_length=10)
    academic_year = models.CharField(max_length=9)
    gender = models.CharField(max_length=10, default="mixed",
                              choices=[("male", "Boys"), ("female", "Girls"), ("mixed", "Mixed")])

    class Meta:
        verbose_name_plural = "classes"
        unique_together = [("college", "grade", "stream", "section", "academic_year")]

    def __str__(self):
        return f"{self.grade} {self.stream} {self.section}"


class Lesson(models.Model):
    """A Lesson Object imported from the Content Factory. The quiz (with answers) never leaves the server."""
    id = models.CharField(primary_key=True, max_length=64)
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="lessons")
    unit = models.ForeignKey(Unit, null=True, blank=True, on_delete=models.PROTECT, related_name="lessons")
    book = models.CharField(max_length=30)
    unit_number = models.PositiveIntegerField()
    unit_title = models.CharField(max_length=150)
    topic = models.CharField(max_length=10)
    title = models.CharField(max_length=150)
    pages = models.JSONField()
    images = models.JSONField()
    images_sm = models.JSONField(default=list, blank=True, help_text="600 px phone versions of the pages")
    audio = models.CharField(max_length=255)
    audio_bytes = models.PositiveIntegerField()
    duration_sec = models.FloatField()
    sections = models.JSONField(help_text="[{page, text, start}]")
    quiz = models.JSONField(help_text="Question pool with answers. Server-side only.")
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVIEW_CHOICES = [
        (DRAFT, "Draft"),
        (IN_REVIEW, "In Review"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]
    review_status = models.CharField(max_length=20, choices=REVIEW_CHOICES, default=DRAFT)
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_lessons")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    # F12: optional Urdu narration track, reviewed separately.
    ur_audio = models.CharField(max_length=255, blank=True)
    ur_audio_bytes = models.PositiveIntegerField(default=0)
    ur_duration_sec = models.FloatField(default=0)
    ur_sections = models.JSONField(default=list, blank=True, help_text="[{page, text, start}] in Urdu script")
    ur_review_status = models.CharField(max_length=20, blank=True)
    is_published = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.topic} {self.title}"


class TeachingAssignment(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assignments",
                                limit_choices_to={"role": User.TEACHER})
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="assignments")
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT)

    class Meta:
        unique_together = [("teacher", "school_class", "subject")]

    def clean(self):
        if self.teacher_id and self.teacher.role != User.TEACHER:
            raise ValidationError({"teacher": "Only a teacher can be assigned to a class."})
        if self.teacher_id and self.school_class_id and self.teacher.college_id != self.school_class.college_id:
            raise ValidationError("The teacher and the class must belong to the same college.")

    def __str__(self):
        return f"{self.teacher.full_name} teaches {self.subject.name} to {self.school_class}"


class SubjectRequest(models.Model):
    """A teacher asks for a subject on a class they already teach; a college admin decides (decision D4)."""
    PENDING, APPROVED, DECLINED = "pending", "approved", "declined"
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name="subject_requests",
                                limit_choices_to={"role": User.TEACHER})
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name="subject_requests")
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT)
    status = models.CharField(max_length=10, default=PENDING,
                              choices=[(PENDING, "Pending"), (APPROVED, "Approved"), (DECLINED, "Declined")])
    note = models.CharField(max_length=200, blank=True, help_text="Shown to the teacher, e.g. why it was declined")
    decided_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name="+")
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.teacher.full_name} asks for {self.subject.name} in {self.school_class}"

    def decide(self, by, approve, note=""):
        """Approve (creating the teaching assignment) or decline. Only an admin of the same college, or staff."""
        from django.core.exceptions import PermissionDenied
        from django.db import transaction
        from django.utils import timezone
        same_college = by.role == User.COLLEGE_ADMIN and by.college_id == self.school_class.college_id
        if not (by.is_superuser or same_college):
            raise PermissionDenied("Only an admin of this college can decide this request.")
        if self.status != self.PENDING:
            raise ValidationError("This request has already been decided.")
        with transaction.atomic():
            self.status = self.APPROVED if approve else self.DECLINED
            self.note, self.decided_by, self.decided_at = note[:200], by, timezone.now()
            self.save()
            if approve:
                TeachingAssignment.objects.get_or_create(teacher=self.teacher, school_class=self.school_class,
                                                         subject=self.subject)


class StudentProfile(models.Model):
    user = models.OneToOneField(User, primary_key=True, on_delete=models.CASCADE, related_name="student",
                                limit_choices_to={"role": User.STUDENT})
    school_class = models.ForeignKey(SchoolClass, on_delete=models.PROTECT, related_name="students")
    roll_number = models.CharField(max_length=50)
    parent = models.ForeignKey(User, on_delete=models.PROTECT, related_name="children",
                               limit_choices_to={"role": User.PARENT})

    class Meta:
        unique_together = [("school_class", "roll_number")]
        ordering = ["roll_number"]

    def clean(self):
        u, c = self.user, self.school_class
        if u.role != User.STUDENT:
            raise ValidationError({"user": "This user is not a student."})
        if self.parent_id and self.parent.role != User.PARENT:
            raise ValidationError({"parent": "This user is not a parent."})
        if u.college_id != c.college_id or (self.parent_id and self.parent.college_id != c.college_id):
            raise ValidationError("Student, parent and class must belong to the same college.")
        if c.gender != "mixed" and u.gender != c.gender:
            raise ValidationError({"school_class": f"{c} is a {c.get_gender_display().lower()} class."})

    def __str__(self):
        return f"{self.user.full_name} ({self.roll_number})"


class Attendance(models.Model):
    PRESENT, ABSENT, LATE = "present", "absent", "late"
    school_class = models.ForeignKey(SchoolClass, on_delete=models.PROTECT)
    student = models.ForeignKey(User, on_delete=models.PROTECT, related_name="attendance")
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=[(PRESENT, "Present"), (ABSENT, "Absent"), (LATE, "Late")])
    lesson = models.ForeignKey(Lesson, null=True, blank=True, on_delete=models.PROTECT, help_text="Topic taught")
    marked_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="+")
    marked_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "subject", "date")]
        indexes = [models.Index(fields=["school_class", "date"])]


class Clearance(models.Model):
    """The Green Tick: an absent student must complete the missed lesson's quiz (or be excused)."""
    PENDING = "pending"
    CLEARED = "cleared"
    OVERRIDE = "override"
    LOCKED = "locked"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (CLEARED, "Cleared"),
        (OVERRIDE, "Override"),
        (LOCKED, "Locked"),
    ]
    student = models.ForeignKey(User, on_delete=models.PROTECT, related_name="clearances")
    lesson = models.ForeignKey(Lesson, on_delete=models.PROTECT)
    attendance = models.OneToOneField(Attendance, on_delete=models.PROTECT, related_name="clearance")
    status = models.CharField(max_length=20, default=PENDING, choices=STATUS_CHOICES)
    cleared_by = models.CharField(max_length=10, blank=True, choices=[("quiz", "Passed quiz"), ("teacher", "Teacher")])
    attempts = models.PositiveIntegerField(default=0)
    best_score = models.PositiveIntegerField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    cleared_at = models.DateTimeField(null=True, blank=True)
    override_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name="+")
    override_reason = models.CharField(max_length=255, blank=True)
    parent_notified_at = models.DateTimeField(null=True, blank=True,
                                              help_text="When the teacher sent the WhatsApp message by hand (F3)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["student", "lesson"])]


class LessonProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="progress")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    heard_secs = models.JSONField(default=list, help_text="Whole seconds of narration actually played")
    heard_secs_ur = models.JSONField(default=list, blank=True, help_text="The same, for the Urdu narration (F12)")
    unlocked = models.BooleanField(default=False)
    passed = models.BooleanField(default=False)
    best_score = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "lesson")]


class QuizAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="quiz_attempts")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    questions = models.JSONField(help_text="[{q: pool index, order: [option indexes as shown]}]")
    answers = models.JSONField(null=True, blank=True)
    score = models.PositiveIntegerField(null=True, blank=True)
    passed = models.BooleanField(default=False)
    attempt_number = models.PositiveSmallIntegerField(default=1)
    missed_sections = models.JSONField(default=list, blank=True)
    cooldown_until = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)


class Notification(models.Model):
    """Audit log of every WhatsApp/SMS attempt (DoD: prove to parents that alerts were sent)."""
    student = models.ForeignKey(User, on_delete=models.PROTECT, related_name="notifications")
    recipient = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="received")
    recipient_phone = models.CharField(max_length=13)
    recipient_role = models.CharField(max_length=10)
    channel = models.CharField(max_length=10, choices=[("whatsapp", "WhatsApp"), ("sms", "SMS"),
                                                       ("inbox", "In-app inbox"), ("push", "Push")])
    template_type = models.CharField(max_length=50)
    body = models.TextField()
    lesson = models.ForeignKey(Lesson, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=[("sent", "Sent"), ("delivered", "Delivered"),
                                                      ("failed", "Failed"), ("skipped", "Skipped")])
    provider_msg_id = models.CharField(max_length=100, blank=True)
    error = models.CharField(max_length=200, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sent_at"]


class OTPCode(models.Model):
    phone_number = models.CharField(max_length=13, db_index=True)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    used = models.BooleanField(default=False)


class AuditLog(models.Model):
    """Who changed what in a college (F22). Summaries never contain full phone numbers."""
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name="audit")
    actor = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="+")
    action = models.CharField(max_length=40)
    object_type = models.CharField(max_length=40)
    object_id = models.CharField(max_length=64, blank=True)
    summary = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class ImportBatch(models.Model):
    """A roster file checked by a college admin; committed all-or-nothing (F22, includes F5)."""
    CHECKED, COMMITTED = "checked", "committed"
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name="imports")
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="+")
    kind = models.CharField(max_length=10, choices=[("students", "Students"), ("teachers", "Teachers")])
    rows = models.JSONField(default=list, help_text="Validated, normalised rows")
    errors = models.JSONField(default=list, help_text="[{row, message}]")
    status = models.CharField(max_length=10, default=CHECKED, choices=[(CHECKED, "Checked"), (COMMITTED, "Committed")])
    result = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    committed_at = models.DateTimeField(null=True, blank=True)


class PushSubscription(models.Model):
    """A browser that agreed to receive alerts for one user (F3, free web push)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.URLField(max_length=1000, unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=100)
    user_agent = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
