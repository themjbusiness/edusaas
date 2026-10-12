"""College admin console API (F22). Every query is limited to the signed-in admin's own college.

Ids from another college get 404, never 403, so their existence is not confirmed.
"""
import csv
import io

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from .api import _uuid, iso, live_subject_ids, subject_request_dict
from .auth import ApiError, api, mask_phone, normalize_phone
from .fields import hash_phone
from .models import (AuditLog, ImportBatch, SchoolClass, StudentProfile, Subject, SubjectRequest, TeachingAssignment,
                     User)

ADMIN = (User.COLLEGE_ADMIN,)
PEOPLE_ROLES = (User.STUDENT, User.TEACHER, User.PARENT)
GRADES = ("11th", "12th")
GENDERS = ("male", "female")


def audit(actor, action, obj_type, obj_id, summary):
    AuditLog.objects.create(college=actor.college, actor=actor, action=action, object_type=obj_type,
                            object_id=str(obj_id or ""), summary=summary[:300])


def audit_dict(a):
    return {"id": a.id, "action": a.action, "type": a.object_type, "summary": a.summary,
            "actor": a.actor.full_name if a.actor else None, "at": iso(a.created_at)}


def class_dict(c):
    return {"id": str(c.id), "name": str(c), "grade": c.grade, "stream": c.stream, "section": c.section,
            "gender": c.gender, "academicYear": c.academic_year,
            "students": c.students.filter(user__is_active=True).count(),
            "assignments": [{"id": a.id, "teacher": a.teacher.full_name, "teacherId": str(a.teacher_id),
                             "subject": a.subject.name, "subjectCode": a.subject.code}
                            for a in c.assignments.select_related("teacher", "subject").order_by("subject__sort_order")]}


def person_dict(u):
    d = {"id": str(u.id), "name": u.full_name, "role": u.role, "phone": u.phone_number, "gender": u.gender,
         "active": u.is_active}
    if u.role == User.STUDENT and hasattr(u, "student"):
        p = u.student
        d.update({"class": str(p.school_class), "classId": str(p.school_class_id), "roll": p.roll_number,
                  "parent": {"id": str(p.parent_id), "name": p.parent.full_name, "phone": p.parent.phone_number}})
    elif u.role == User.TEACHER:
        d["assignments"] = [f"{a.subject.name} · {a.school_class}"
                            for a in u.assignments.select_related("subject", "school_class")]
    elif u.role == User.PARENT:
        d["children"] = [c.user.full_name for c in u.children.select_related("user")]
    return d


def my_class(admin, class_id):
    c = SchoolClass.objects.filter(id=_uuid(class_id), college=admin.college).first()
    if c is None:
        raise ApiError(404, "not_found", "Class not found in your college.")
    return c


def my_person(admin, user_id, role=None):
    qs = User.objects.filter(id=_uuid(user_id), college=admin.college, role__in=PEOPLE_ROLES)
    u = (qs.filter(role=role) if role else qs).select_related("student__school_class", "student__parent").first()
    if u is None:
        raise ApiError(404, "not_found", "Person not found in your college.")
    return u


def phone_free(phone, exclude=None):
    qs = User.objects.filter(phone_number_hash=hash_phone(phone))
    if exclude is not None:
        qs = qs.exclude(id=exclude.id)
    if qs.exists():
        raise ApiError(409, "phone_taken", "This number already belongs to another account.")


def clean_text(value, label, minimum=1, maximum=100):
    v = str(value or "").strip()
    if len(v) < minimum or len(v) > maximum:
        raise ApiError(400, "bad_request", f"Enter the {label}.")
    return v


def find_subject(code_or_name, grade):
    v = str(code_or_name or "").strip()
    return Subject.objects.filter(grade=grade).filter(Q(code__iexact=v) | Q(name__iexact=v)).first()


# ---------- overview ----------

@api(roles=ADMIN)
def overview(request):
    c = request.user.college
    people = User.objects.filter(college=c, is_active=True)
    live = live_subject_ids()
    pending = SubjectRequest.objects.filter(school_class__college=c, status=SubjectRequest.PENDING) \
        .select_related("teacher", "school_class", "subject")
    return {"college": c.name,
            "counts": {"teachers": people.filter(role=User.TEACHER).count(),
                       "students": people.filter(role=User.STUDENT).count(),
                       "parents": people.filter(role=User.PARENT).count(),
                       "classes": SchoolClass.objects.filter(college=c).count()},
            "requests": [dict(subject_request_dict(r, live), teacher=r.teacher.full_name) for r in pending],
            "activity": [audit_dict(a) for a in AuditLog.objects.filter(college=c).select_related("actor")[:10]]}


@api(roles=ADMIN)
def audit_log(request):
    return [audit_dict(a) for a in AuditLog.objects.filter(college=request.user.college).select_related("actor")[:200]]


# ---------- classes and assignments ----------

@api(methods=("GET", "POST"), roles=ADMIN)
def classes(request):
    admin = request.user
    if request.method == "GET":
        return [class_dict(c) for c in SchoolClass.objects.filter(college=admin.college)
                .order_by("grade", "stream", "section")]
    b = request.json
    grade = b.get("grade")
    if grade not in GRADES:
        raise ApiError(400, "bad_request", "Grade must be 11th or 12th.")
    gender = b.get("gender") or "mixed"
    if gender not in ("male", "female", "mixed"):
        raise ApiError(400, "bad_request", "Choose boys, girls or mixed.")
    fields = dict(college=admin.college, grade=grade, stream=clean_text(b.get("stream"), "stream", 2, 50),
                  section=clean_text(b.get("section"), "section", 1, 10),
                  academic_year=str(b.get("academicYear") or "2026-2027")[:9])
    if SchoolClass.objects.filter(**fields).exists():
        raise ApiError(409, "class_exists", "This class already exists.")
    c = SchoolClass.objects.create(gender=gender, **fields)
    audit(admin, "class.add", "class", c.id, f"Created class {c}")
    return class_dict(c)


@api(methods=("GET", "POST"), roles=ADMIN)
def assignments(request):
    admin = request.user
    if request.method == "GET":
        return [{"id": a.id, "teacher": a.teacher.full_name, "teacherId": str(a.teacher_id), "class": str(a.school_class),
                 "classId": str(a.school_class_id), "subject": a.subject.name, "subjectCode": a.subject.code}
                for a in TeachingAssignment.objects.filter(school_class__college=admin.college)
                .select_related("teacher", "school_class", "subject")]
    b = request.json
    teacher = my_person(admin, b.get("teacherId"), role=User.TEACHER)
    cls = my_class(admin, b.get("classId"))
    subject = find_subject(b.get("subject"), cls.grade)
    if subject is None:
        raise ApiError(400, "bad_subject", f"Choose a subject taught in {cls.grade} classes.")
    if TeachingAssignment.objects.filter(teacher=teacher, school_class=cls, subject=subject).exists():
        raise ApiError(409, "already_assigned", f"{teacher.full_name} already teaches {subject.name} to {cls}.")
    a = TeachingAssignment.objects.create(teacher=teacher, school_class=cls, subject=subject)
    audit(admin, "assignment.add", "assignment", a.id, f"{teacher.full_name} now teaches {subject.name} to {cls}")
    return {"id": a.id}


@api(methods=("DELETE",), roles=ADMIN)
def assignment_delete(request, assignment_id):
    a = TeachingAssignment.objects.filter(id=assignment_id, school_class__college=request.user.college) \
        .select_related("teacher", "subject", "school_class").first()
    if a is None:
        raise ApiError(404, "not_found", "Assignment not found in your college.")
    text = f"{a.teacher.full_name} no longer teaches {a.subject.name} to {a.school_class}"
    a.delete()
    audit(request.user, "assignment.remove", "assignment", assignment_id, text)
    return {"ok": True}


# ---------- people ----------

@api(methods=("GET", "POST"), roles=ADMIN)
def people(request):
    admin = request.user
    if request.method == "GET":
        role = request.GET.get("role")
        if role not in PEOPLE_ROLES:
            raise ApiError(400, "bad_request", "Choose teachers, students or parents.")
        qs = User.objects.filter(college=admin.college, role=role) \
            .select_related("student__school_class", "student__parent").order_by("-is_active", "full_name")
        q = (request.GET.get("q") or "").strip()
        if q:
            digits = "".join(ch for ch in q if ch.isdigit())
            match = Q(full_name__icontains=q) | Q(student__roll_number__icontains=q)
            if len(digits) >= 4:
                match |= Q(phone_number__contains=digits.lstrip("0"))
            qs = qs.filter(match)
        return [person_dict(u) for u in qs[:300]]
    return add_person(admin, request.json)


def add_person(admin, b):
    role = b.get("role")
    if role not in PEOPLE_ROLES:
        raise ApiError(400, "bad_request", "Choose teacher, student or parent.")
    name = clean_text(b.get("name"), "full name", 3)
    phone = normalize_phone(b.get("phone"))
    gender = b.get("gender")
    if gender not in GENDERS:
        raise ApiError(400, "bad_request", "Choose male or female.")
    phone_free(phone)
    with transaction.atomic():
        if role != User.STUDENT:
            u = User.objects.create_user(phone, name, role, college=admin.college, gender=gender)
        else:
            cls = my_class(admin, b.get("classId"))
            roll = clean_text(b.get("roll"), "roll number", 1, 50)
            if StudentProfile.objects.filter(school_class=cls, roll_number=roll).exists():
                raise ApiError(409, "roll_taken", f"Roll number {roll} already exists in {cls}.")
            pphone = normalize_phone(b.get("parentPhone"))
            if pphone == phone:
                raise ApiError(400, "bad_request", "The student and parent need different numbers.")
            parent = User.objects.filter(phone_number_hash=hash_phone(pphone)).first()
            if parent is None:
                parent = User.objects.create_user(pphone, clean_text(b.get("parentName"), "parent's name", 3),
                                                  User.PARENT, college=admin.college,
                                                  gender=b.get("parentGender") if b.get("parentGender") in GENDERS else "male")
            elif parent.role != User.PARENT or parent.college_id != admin.college_id:
                raise ApiError(409, "phone_taken", "The parent's number belongs to another account.")
            u = User.objects.create_user(phone, name, role, college=admin.college, gender=gender)
            profile = StudentProfile(user=u, school_class=cls, roll_number=roll, parent=parent)
            try:
                profile.full_clean()
            except ValidationError as e:
                raise ApiError(400, "bad_request", " ".join(e.messages))
            profile.save()
    audit(admin, "person.add", role, u.id, f"Added {role} {name} ({mask_phone(phone)})")
    return person_dict(User.objects.select_related("student__school_class", "student__parent").get(id=u.id))


@api(methods=("POST",), roles=ADMIN)
def person_edit(request, user_id):
    admin, b = request.user, request.json
    u = my_person(admin, user_id)
    changes = []
    with transaction.atomic():
        if "name" in b:
            u.full_name = clean_text(b["name"], "full name", 3)
            changes.append("name")
        if "phone" in b:
            phone = normalize_phone(b["phone"])
            if phone != u.phone_number:
                phone_free(phone, exclude=u)
                u.phone_number, u.token_version = phone, u.token_version + 1  # the old number is signed out
                changes.append(f"phone to {mask_phone(phone)}")
        if u.role == User.STUDENT and ("classId" in b or "roll" in b):
            p = u.student
            if "classId" in b:
                p.school_class = my_class(admin, b["classId"])
            if "roll" in b:
                p.roll_number = clean_text(b["roll"], "roll number", 1, 50)
            if StudentProfile.objects.filter(school_class=p.school_class, roll_number=p.roll_number).exclude(user=u).exists():
                raise ApiError(409, "roll_taken", f"Roll number {p.roll_number} already exists in {p.school_class}.")
            try:
                p.full_clean()
            except ValidationError as e:
                raise ApiError(400, "bad_request", " ".join(e.messages))
            p.save()
            changes.append(f"class/roll to {p.school_class}, {p.roll_number}")
        action = "person.edit"
        if "active" in b and bool(b["active"]) != u.is_active:
            if not b["active"]:
                reason = str(b.get("reason") or "").strip()
                if len(reason) < 3:
                    raise ApiError(400, "reason_required", "Give a reason for suspending this account.")
                u.is_active, u.token_version, action = False, u.token_version + 1, "person.suspend"
                changes.append(f"suspended: {reason[:120]}")
            else:
                u.is_active, action = True, "person.reactivate"
                changes.append("reactivated")
        u.save()
    if changes:
        audit(admin, action, u.role, u.id, f"{u.full_name}: " + "; ".join(changes))
    return person_dict(u)


# ---------- subject requests ----------

@api(roles=ADMIN)
def subject_requests(request):
    live = live_subject_ids()
    qs = SubjectRequest.objects.filter(school_class__college=request.user.college) \
        .select_related("teacher", "school_class", "subject")
    return [dict(subject_request_dict(r, live), teacher=r.teacher.full_name) for r in qs[:100]]


@api(methods=("POST",), roles=ADMIN)
def subject_request_decide(request, request_id):
    r = SubjectRequest.objects.filter(id=request_id, school_class__college=request.user.college) \
        .select_related("teacher", "school_class", "subject").first()
    if r is None:
        raise ApiError(404, "not_found", "Request not found in your college.")
    approve = request.json.get("approve")
    if not isinstance(approve, bool):
        raise ApiError(400, "bad_request", "approve must be true or false.")
    try:
        r.decide(request.user, approve=approve, note=str(request.json.get("note") or ""))
    except PermissionDenied:
        raise ApiError(404, "not_found", "Request not found in your college.")
    except ValidationError:
        raise ApiError(409, "already_decided", "This request has already been decided.")
    audit(request.user, "request." + ("approve" if approve else "decline"), "subject_request", r.id,
          f"{'Approved' if approve else 'Declined'} {r.subject.name} for {r.school_class} ({r.teacher.full_name})")
    return subject_request_dict(r)


# ---------- roster import ----------

STUDENT_COLUMNS = ["class_grade", "class_stream", "class_section", "roll_number", "student_name", "student_gender",
                   "student_phone", "parent_name", "parent_phone"]
TEACHER_COLUMNS = ["teacher_name", "teacher_phone", "teacher_gender", "subject", "class_grade", "class_stream",
                   "class_section"]


def _phone(raw, label):
    try:
        return normalize_phone(raw)
    except ApiError:
        raise ValueError(f"{label} '{str(raw or '').strip()}' is not a valid mobile number.")


def _find_class(college, row):
    c = SchoolClass.objects.filter(college=college, grade__iexact=row["class_grade"].strip(),
                                   stream__iexact=row["class_stream"].strip(),
                                   section__iexact=row["class_section"].strip()).first()
    if c is None:
        raise ValueError(f"Class {row['class_grade']} {row['class_stream']} {row['class_section']} "
                         "does not exist in your college. Create it first.")
    return c


def check_students(college, rows):
    out, errors, seen_rolls, seen_phones, parents = [], [], set(), set(), {}
    for n, row in rows:
        try:
            cls = _find_class(college, row)
            roll = row["roll_number"].strip()
            if not roll:
                raise ValueError("Roll number is missing.")
            if (cls.id, roll.lower()) in seen_rolls:
                raise ValueError(f"Roll number {roll} appears twice in this file for {cls}.")
            if StudentProfile.objects.filter(school_class=cls, roll_number__iexact=roll).exists():
                raise ValueError(f"Roll number {roll} already exists in {cls}.")
            name = row["student_name"].strip()
            if len(name) < 3:
                raise ValueError("Student name is missing.")
            gender = row["student_gender"].strip().lower()
            if gender not in GENDERS:
                raise ValueError("Student gender must be male or female.")
            if cls.gender != "mixed" and gender != cls.gender:
                raise ValueError(f"{cls} is a {cls.get_gender_display().lower()} class.")
            sphone = _phone(row["student_phone"], "Student phone")
            if sphone in seen_phones or User.objects.filter(phone_number_hash=hash_phone(sphone)).exists():
                raise ValueError("Student phone is already registered.")
            pphone = _phone(row["parent_phone"], "Parent phone")
            if pphone == sphone or pphone in seen_phones:
                raise ValueError("Parent phone must be different from the student's.")
            existing = User.objects.filter(phone_number_hash=hash_phone(pphone)).first()
            if existing and (existing.role != User.PARENT or existing.college_id != college.id):
                raise ValueError("Parent phone belongs to another account.")
            pname = row["parent_name"].strip() or (existing.full_name if existing else "")
            if len(pname) < 3:
                raise ValueError("Parent name is missing.")
        except ValueError as e:
            errors.append({"row": n, "message": str(e)})
            continue
        seen_rolls.add((cls.id, roll.lower()))
        seen_phones.add(sphone)
        parents.setdefault(pphone, pname)
        out.append({"row": n, "classId": str(cls.id), "class": str(cls), "roll": roll, "name": name, "gender": gender,
                    "phone": sphone, "parentName": parents[pphone], "parentPhone": pphone,
                    "parentExists": bool(existing)})
    return out, errors


def check_teachers(college, rows):
    out, errors, seen = [], [], set()
    for n, row in rows:
        try:
            name = row["teacher_name"].strip()
            if len(name) < 3:
                raise ValueError("Teacher name is missing.")
            gender = row["teacher_gender"].strip().lower()
            if gender not in GENDERS:
                raise ValueError("Teacher gender must be male or female.")
            phone = _phone(row["teacher_phone"], "Teacher phone")
            existing = User.objects.filter(phone_number_hash=hash_phone(phone)).first()
            if existing and (existing.role != User.TEACHER or existing.college_id != college.id):
                raise ValueError("Teacher phone belongs to another account.")
            cls = _find_class(college, row)
            subject = find_subject(row["subject"], cls.grade)
            if subject is None:
                raise ValueError(f"Subject '{row['subject'].strip()}' is not offered for {cls.grade}.")
            key = (phone, cls.id, subject.id)
            if key in seen or (existing and TeachingAssignment.objects.filter(teacher=existing, school_class=cls,
                                                                              subject=subject).exists()):
                raise ValueError(f"{name} already teaches {subject.name} to {cls}.")
        except ValueError as e:
            errors.append({"row": n, "message": str(e)})
            continue
        seen.add(key)
        out.append({"row": n, "name": name, "gender": gender, "phone": phone, "classId": str(cls.id), "class": str(cls),
                    "subjectId": subject.id, "subject": subject.name})
    return out, errors


@api(methods=("POST",), roles=ADMIN)
def import_check(request):
    admin, b = request.user, request.json
    kind = b.get("kind")
    if kind not in ("students", "teachers"):
        raise ApiError(400, "bad_request", "Choose students or teachers.")
    text = str(b.get("csv") or "").lstrip("﻿")
    if not text.strip():
        raise ApiError(400, "bad_request", "The file is empty.")
    if len(text) > 500_000:
        raise ApiError(400, "too_large", "The file is too large. Import at most about 2,000 rows at a time.")
    reader = csv.DictReader(io.StringIO(text))
    columns = STUDENT_COLUMNS if kind == "students" else TEACHER_COLUMNS
    header = [h.strip().lower() for h in (reader.fieldnames or [])]
    missing = [c for c in columns if c not in header]
    if missing:
        raise ApiError(400, "bad_columns", "Missing columns: " + ", ".join(missing) + ". Use the template.")
    rows = []
    for i, raw in enumerate(reader, start=2):  # row 1 is the header
        row = {(k or "").strip().lower(): (v or "") for k, v in raw.items()}
        if any(str(v).strip() for v in row.values()):
            rows.append((i, row))
    if not rows:
        raise ApiError(400, "bad_request", "The file has no rows under the header.")
    ok, errors = (check_students if kind == "students" else check_teachers)(admin.college, rows)
    batch = ImportBatch.objects.create(college=admin.college, uploaded_by=admin, kind=kind, rows=ok, errors=errors)
    audit(admin, "import.check", "import", batch.id, f"Checked a {kind} file: {len(ok)} rows OK, {len(errors)} with errors")
    return {"id": batch.id, "kind": kind, "counts": {"rows": len(rows), "ok": len(ok), "errors": len(errors)},
            "errors": errors, "preview": [{k: v for k, v in r.items() if k not in ("classId", "subjectId")} for r in ok[:50]]}


@api(methods=("POST",), roles=ADMIN)
def import_commit(request, batch_id):
    admin = request.user
    batch = ImportBatch.objects.filter(id=batch_id, college=admin.college).first()
    if batch is None:
        raise ApiError(404, "not_found", "Import not found in your college.")
    if batch.status != ImportBatch.CHECKED:
        raise ApiError(409, "already_committed", "This file has already been imported.")
    if batch.errors:
        raise ApiError(409, "has_errors", "Fix the rows with errors, then check the file again.")
    created = {"students": 0, "parents": 0} if batch.kind == "students" else {"teachers": 0, "assignments": 0}
    try:
        with transaction.atomic():
            for r in batch.rows:
                if batch.kind == "students":
                    parent = User.objects.filter(phone_number_hash=hash_phone(r["parentPhone"])).first()
                    if parent is None:
                        parent = User.objects.create_user(r["parentPhone"], r["parentName"], User.PARENT,
                                                          college=admin.college, gender="male")
                        created["parents"] += 1
                    elif parent.role != User.PARENT or parent.college_id != admin.college_id:
                        raise IntegrityError("parent phone taken")
                    student = User.objects.create_user(r["phone"], r["name"], User.STUDENT, college=admin.college,
                                                       gender=r["gender"])
                    StudentProfile.objects.create(user=student, school_class_id=r["classId"], roll_number=r["roll"],
                                                  parent=parent)
                    created["students"] += 1
                else:
                    teacher = User.objects.filter(phone_number_hash=hash_phone(r["phone"])).first()
                    if teacher is None:
                        teacher = User.objects.create_user(r["phone"], r["name"], User.TEACHER, college=admin.college,
                                                           gender=r["gender"])
                        created["teachers"] += 1
                    elif teacher.role != User.TEACHER or teacher.college_id != admin.college_id:
                        raise IntegrityError("teacher phone taken")
                    TeachingAssignment.objects.create(teacher=teacher, school_class_id=r["classId"],
                                                      subject_id=r["subjectId"])
                    created["assignments"] += 1
            batch.status, batch.result, batch.committed_at = ImportBatch.COMMITTED, created, timezone.now()
            batch.save()
    except (IntegrityError, ValidationError):
        raise ApiError(409, "changed", "Something changed since the file was checked. Check the file again.")
    audit(admin, "import.commit", "import", batch.id,
          f"Imported {batch.kind}: " + ", ".join(f"{v} {k}" for k, v in created.items()))
    return {"id": batch.id, "created": created}
