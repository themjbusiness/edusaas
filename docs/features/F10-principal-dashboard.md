# F10: Principal Analytics Dashboard

**Status:** Ready to Build  
**Owner:** Muhammad Noor Khan  
**Date:** 2026-10-13  
**Part of:** v1.2 Pilot Term Release  

---

## 1. Problem

College principals need clear evidence of product return-on-investment before renewing their annual SaaS licenses. Today, the system stores attendance and clearances, but lacks an executive dashboard that summarizes key indicators:
- What percentage of absent students are successfully cleared?
- How quickly do students catch up after an absence (median hours to clearance)?
- Which sections or teachers have the highest catch-up compliance?
- What are the historical absence trends ahead of FBISE board registrations?

Without this, principals cannot measure adoption or hold teachers and students accountable.

---

## 2. Users and Access Rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| **College Admin / Principal** | View high-level metrics for **their college only**; filter by date range, grade, and stream; compare classes and teachers; export CSV reports for board inspectors and governors. | Must never see data from other colleges; cannot modify student test answers. |
| **Teacher** | Can view class-level performance for classes they teach. | Cannot see college-wide financial or cross-class aggregate data outside their assignments. |
| **Student & Parent** | Cannot access the principal dashboard (returns 403 Forbidden). | — |

---

## 3. Screens

### Phone (360 px)
- **Executive KPI Cards (Top Carousel):**
  - **Catch-up Clearance Rate:** e.g. `84.2%` (&uarr; 3.1% vs last month).
  - **Total Absences:** e.g. `142` over last 30 days.
  - **Median Time to Clear:** e.g. `18.4 hours` (target &le; 24h).
  - **At-Risk Students:** e.g. `9` requiring intervention.
- **Class Compliance List:**
  - Ranked list of classes with mini progress bars (e.g. *11th Pre-Medical A: 92% cleared*, *11th Pre-Engineering B: 71% cleared*).
- **Date Range Selector:** Quick chips (`Last 7 Days`, `Last 30 Days`, `This Term`).
- **Export Button:** Single tap to download CSV report.

### Desktop (1200 px)
- Comprehensive multi-column analytics view:
  - Metric summary cards across top header.
  - Interactive trend chart: Daily Absences vs Daily Clearances.
  - Sortable comparative data table: Class Name, Assigned Teacher, Total Absences, Cleared Count, Clearance %, Overrides Count, Avg Score.
  - Direct CSV/PDF download toolbar with date filter picker.

---

## 4. API and Data Changes

### Endpoints
All endpoints require `college_admin` role and are scoped strictly to `request.user.college`.

| Method & Path | Who Can Call | Query Params | Response | Error Codes |
|---|---|---|---|---|
| `GET /api/principal/overview` | College Admin | `days` (default 30) | `{ totalAbsences, clearedCount, clearanceRate, medianHoursToClear, atRiskCount }` | 401, 403 |
| `GET /api/principal/breakdown` | College Admin | `days`, `by` (`class` \| `teacher`) | `[{ id, name, teacherName, absences, clearances, rate, medianHours }]` | 400, 403 |
| `GET /api/principal/export` | College Admin | `days`, `format` (`csv`) | CSV file stream (`text/csv`) with disposition attachment header | 400, 403 |

---

## 5. Acceptance Criteria (Automated Tests)

1. **Accurate KPI calculations:** Given 10 absences where 8 have clearances, the endpoint `/api/principal/overview` returns a clearance rate of `80.0%`.
2. **Median latency computation:** Given clearances completed at 2h, 4h, and 12h after absence, median latency is reported as `4.0 hours`.
3. **Strict college isolation:** Given an admin of College A, calling `/api/principal/overview` includes zero data points from College B.
4. **Class breakdown sorting:** Given multiple classes, `/api/principal/breakdown?by=class` returns each class with its individual student count, absences, and clearance percentage.
5. **CSV export generation:** Given a valid request to `/api/principal/export?format=csv`, the response returns `Content-Type: text/csv` with headers matching `Date, Student Name, Roll Number, Class, Subject, Status, Cleared At`.
6. **Role protection:** Given a student or teacher token calling `/api/principal/overview`, the server responds with `403 Forbidden`.

---

## 6. Out of Scope

- Live real-time WebSocket attendance tracking (data refreshes on daily attendance submission).
- Complex custom formula report builders.

---

## 7. Definition of Done

- [ ] Spec signed off.
- [ ] Automated tests in `backend/lms/tests.py` covering KPIs, median calculation, class breakdown, and CSV generation.
- [ ] Multi-tenant isolation verified with cross-college test.
- [ ] Responsive design verified on 360px phone and 1200px desktop.
