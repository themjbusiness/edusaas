"""Principal Analytics Dashboard API (F10).

Executive metrics, comparative class/teacher breakdowns, and CSV reports.
Scoped strictly to the signed-in admin's own college.
"""
import csv
import io
import statistics
from datetime import timedelta

from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone

from .auth import ApiError, api
from .models import Clearance, SchoolClass, TeachingAssignment, User

ADMIN = (User.COLLEGE_ADMIN,)


def _parse_days(request, default=30):
    raw = request.GET.get("days")
    if not raw:
        return default
    try:
        val = int(raw)
        if val <= 0 or val > 365:
            raise ValueError
        return val
    except ValueError:
        raise ApiError(400, "bad_days", "Days must be an integer between 1 and 365.")


@api(roles=ADMIN)
def principal_overview(request):
    """Returns high-level executive KPIs for the college: total absences, clearance rate, median latency, and at-risk count."""
    college = request.user.college
    if not college:
        raise ApiError(403, "forbidden", "Your account is not linked to a college.")

    days = _parse_days(request, default=30)
    today = timezone.localdate()
    start_date = today - timedelta(days=days)

    # Scoped strictly to admin's college
    qs = Clearance.objects.filter(
        attendance__school_class__college=college,
        attendance__date__gte=start_date
    ).select_related("attendance", "student")

    total_absences = qs.count()
    cleared_qs = qs.filter(status__in=[Clearance.CLEARED, Clearance.OVERRIDE])
    cleared_count = cleared_qs.count()
    clearance_rate = round((cleared_count / total_absences) * 100, 1) if total_absences > 0 else 0.0

    # Calculate median hours to clear
    latencies = []
    for c in cleared_qs:
        if c.cleared_at:
            ref_time = c.created_at or c.attendance.marked_at
            hours = (c.cleared_at - ref_time).total_seconds() / 3600.0
            latencies.append(max(0.0, hours))
    median_hours = round(statistics.median(latencies), 1) if latencies else None

    # At-risk count: students in this college who are currently locked, or have >= 3 absences in the period
    locked_students = set(Clearance.objects.filter(
        attendance__school_class__college=college,
        status=Clearance.LOCKED
    ).values_list("student_id", flat=True))

    frequent_absent = set(
        Clearance.objects.filter(
            attendance__school_class__college=college,
            attendance__date__gte=start_date
        ).values("student_id").annotate(total=Count("id")).filter(total__gte=3).values_list("student_id", flat=True)
    )
    at_risk_count = len(locked_students.union(frequent_absent))

    # Daily trend: aggregate absences and clearances by date for the last `days`
    days_to_plot = min(days, 30)
    daily_map = { (today - timedelta(days=d)).isoformat(): {"absences": 0, "clearances": 0} for d in range(days_to_plot - 1, -1, -1) }
    for c in qs:
        d_str = c.attendance.date.isoformat()
        if d_str in daily_map:
            daily_map[d_str]["absences"] += 1
            if c.status in [Clearance.CLEARED, Clearance.OVERRIDE]:
                daily_map[d_str]["clearances"] += 1

    daily_trend = [{"date": k, "absences": v["absences"], "clearances": v["clearances"]} for k, v in sorted(daily_map.items())]

    return {
        "totalAbsences": total_absences,
        "clearedCount": cleared_count,
        "clearanceRate": clearance_rate,
        "medianHoursToClear": median_hours,
        "atRiskCount": at_risk_count,
        "dailyTrend": daily_trend,
        "days": days,
        "college": college.name,
    }


@api(roles=ADMIN)
def principal_breakdown(request):
    """Returns comparative breakdown of absences and clearance rates by class or by teacher."""
    college = request.user.college
    if not college:
        raise ApiError(403, "forbidden", "Your account is not linked to a college.")

    days = _parse_days(request, default=30)
    by = request.GET.get("by", "class").strip().lower()
    if by not in ("class", "teacher"):
        raise ApiError(400, "bad_breakdown", "Breakdown 'by' must be 'class' or 'teacher'.")

    start_date = timezone.localdate() - timedelta(days=days)

    if by == "class":
        classes = SchoolClass.objects.filter(college=college).order_by("grade", "stream", "section")
        rows = []
        for cls in classes:
            c_qs = Clearance.objects.filter(
                attendance__school_class=cls,
                attendance__date__gte=start_date
            )
            absences = c_qs.count()
            cleared_qs = c_qs.filter(status__in=[Clearance.CLEARED, Clearance.OVERRIDE])
            clearances = cleared_qs.count()
            rate = round((clearances / absences) * 100, 1) if absences > 0 else None

            latencies = [max(0.0, (c.cleared_at - (c.created_at or c.attendance.marked_at)).total_seconds() / 3600.0)
                         for c in cleared_qs if c.cleared_at]
            median_hours = round(statistics.median(latencies), 1) if latencies else None

            teachers = [a.teacher.full_name for a in TeachingAssignment.objects.filter(school_class=cls).select_related("teacher")]
            teacher_names = ", ".join(sorted(set(teachers))) if teachers else "Unassigned"

            rows.append({
                "id": str(cls.id),
                "name": str(cls),
                "grade": cls.grade,
                "stream": cls.stream,
                "section": cls.section,
                "teacherName": teacher_names,
                "studentCount": cls.students.filter(user__is_active=True).count(),
                "absences": absences,
                "clearances": clearances,
                "rate": rate,
                "medianHours": median_hours,
            })
        return rows

    else:  # by == "teacher"
        teachers = User.objects.filter(college=college, role=User.TEACHER, is_active=True).order_by("full_name")
        rows = []
        for t in teachers:
            c_qs = Clearance.objects.filter(
                attendance__marked_by=t,
                attendance__date__gte=start_date
            )
            absences = c_qs.count()
            cleared_qs = c_qs.filter(status__in=[Clearance.CLEARED, Clearance.OVERRIDE])
            clearances = cleared_qs.count()
            rate = round((clearances / absences) * 100, 1) if absences > 0 else None

            latencies = [max(0.0, (c.cleared_at - (c.created_at or c.attendance.marked_at)).total_seconds() / 3600.0)
                         for c in cleared_qs if c.cleared_at]
            median_hours = round(statistics.median(latencies), 1) if latencies else None

            subjects = [a.subject.name for a in t.assignments.select_related("subject")]
            subject_str = ", ".join(sorted(set(subjects))) if subjects else "—"

            rows.append({
                "id": str(t.id),
                "name": t.full_name,
                "subject": subject_str,
                "absences": absences,
                "clearances": clearances,
                "rate": rate,
                "medianHours": median_hours,
            })
        return rows


@api(roles=ADMIN)
def principal_export(request):
    """Exports attendance clearance log as CSV for board inspectors and governors."""
    college = request.user.college
    if not college:
        raise ApiError(403, "forbidden", "Your account is not linked to a college.")

    days = _parse_days(request, default=30)
    fmt = request.GET.get("format", "csv").strip().lower()
    if fmt != "csv":
        raise ApiError(400, "bad_format", "Only 'csv' format is supported.")

    start_date = timezone.localdate() - timedelta(days=days)
    qs = Clearance.objects.filter(
        attendance__school_class__college=college,
        attendance__date__gte=start_date
    ).select_related("attendance__school_class", "attendance__subject", "student", "student__student").order_by("-attendance__date", "student__full_name")

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["Date", "Student Name", "Roll Number", "Class", "Subject", "Status", "Cleared At"])

    for c in qs:
        roll = getattr(getattr(c.student, "student", None), "roll_number", "")
        writer.writerow([
            c.attendance.date.isoformat(),
            c.student.full_name,
            roll,
            str(c.attendance.school_class),
            c.attendance.subject.name,
            c.get_status_display(),
            c.cleared_at.isoformat() if c.cleared_at else "—"
        ])

    csv_data = out.getvalue()
    filename = f"clearance-report-{days}d.csv"
    response = HttpResponse(csv_data, content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
