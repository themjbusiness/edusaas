"""College admin panel (blueprint US 3.3): manage the roster that decides who can log in."""
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.contrib.admin.forms import AdminAuthenticationForm
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (Attendance, Clearance, College, Lesson, LessonProgress, Notification, QuizAttempt, SchoolClass,
                     StudentProfile, Subject, SubjectRequest, TeachingAssignment, Unit, User)


class PhoneAdminAuthenticationForm(AdminAuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if "username" in self.fields:
            self.fields["username"].label = "Phone number"
            self.fields["username"].widget.attrs["placeholder"] = "+92 399 9990000"


admin.site.login_form = PhoneAdminAuthenticationForm


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    fk_name = "user"
    can_delete = False
    extra = 0


class AssignmentInline(admin.TabularInline):
    model = TeachingAssignment
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["role", "full_name"]
    list_display = ["full_name", "phone_number", "role", "college", "is_active"]
    list_filter = ["role", "college", "is_active", "gender"]
    search_fields = ["full_name", "phone_number"]
    fieldsets = [
        (None, {"fields": ["full_name", "phone_number", "role", "gender", "college", "is_active"]}),
        ("Admin access", {"classes": ["collapse"], "fields": ["is_staff", "is_superuser", "password", "token_version"]}),
    ]
    add_fieldsets = [(None, {"fields": ["full_name", "phone_number", "role", "gender", "college"]})]
    filter_horizontal = []
    inlines = [StudentProfileInline]

    def get_inlines(self, request, obj):
        return [StudentProfileInline] if obj and obj.role == User.STUDENT else []


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ["__str__", "college", "gender", "academic_year"]
    list_filter = ["college", "grade"]
    inlines = [AssignmentInline]


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "roll_number", "school_class", "parent"]
    list_filter = ["school_class"]
    search_fields = ["user__full_name", "roll_number", "parent__phone_number"]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["topic", "title", "subject", "duration_sec", "review_status", "reviewed_by", "reviewed_at", "is_published"]
    list_filter = ["review_status", "subject", "is_published"]
    list_editable = ["is_published"]
    exclude = ["quiz", "sections"]


@admin.register(Clearance)
class ClearanceAdmin(admin.ModelAdmin):
    list_display = ["student", "lesson", "status", "cleared_by", "attempts", "best_score", "created_at"]
    list_filter = ["status", "cleared_by"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["sent_at", "recipient_phone", "recipient_role", "channel", "template_type", "status", "error"]
    list_filter = ["channel", "status", "template_type"]
    readonly_fields = [f.name for f in Notification._meta.fields]


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["name", "grade", "code", "sort_order"]
    list_filter = ["grade"]
    inlines = [UnitInline]


@admin.register(SubjectRequest)
class SubjectRequestAdmin(admin.ModelAdmin):
    """Teachers' "Add subject" requests (F20). Approving creates the teaching assignment."""
    list_display = ["teacher", "subject", "school_class", "status", "created_at", "decided_by"]
    list_filter = ["status", "subject__grade"]
    readonly_fields = ["teacher", "school_class", "subject", "status", "decided_by", "decided_at", "created_at"]
    actions = ["approve", "decline"]

    def get_queryset(self, request):
        qs = super().get_queryset(request).select_related("teacher", "school_class", "subject")
        return qs if request.user.is_superuser else qs.filter(school_class__college_id=request.user.college_id)

    def has_add_permission(self, request):
        return False  # requests come from teachers in the app

    def _decide(self, request, queryset, approve):
        done = 0
        for r in queryset.filter(status=SubjectRequest.PENDING):
            try:
                r.decide(request.user, approve=approve)
                done += 1
            except (PermissionDenied, ValidationError) as e:
                self.message_user(request, f"{r}: {e}", level=messages.ERROR)
        self.message_user(request, f"{done} request(s) {'approved' if approve else 'declined'}.")

    @admin.action(description="Approve selected requests (adds the subject to the class)")
    def approve(self, request, queryset):
        self._decide(request, queryset, True)

    @admin.action(description="Decline selected requests")
    def decline(self, request, queryset):
        self._decide(request, queryset, False)


admin.site.register([College, TeachingAssignment, Attendance, LessonProgress, QuizAttempt])

# F22: the Django admin panel is for the EduSaas team only. College admins use the in-app Admin area,
# which is limited to their own college; this panel is not.
admin.site.has_permission = lambda request: request.user.is_active and request.user.is_superuser
admin.site.site_header = "EduSaas team admin (all colleges)"
