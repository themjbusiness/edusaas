# F2: Pilot-grade sign-in and security

Status: Draft | In review | Signed off | Building | Done · Owner: Antigravity · Last updated: 2026-10-07

## Problem

Currently, the app relies on OTPs or unverified sign-ins which can incur SMS costs and potential security risks. College admins can potentially view data across colleges in the Django admin, and sensitive phone numbers are stored in plain text. A robust, free sign-in mechanism (activation code + device PIN), strict tenant isolation, encrypted PII, and comprehensive audit logs are required before launching at the first pilot college to ensure data privacy and system integrity.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Student | Sign in with activation code/PIN, view their own progress and lessons. | See other students' data or access administrative settings. |
| Teacher | Sign in with activation code/PIN, manage attendance for their assigned classes. | Modify college settings, view classes they do not teach, or access other colleges' data. |
| Parent | Sign in with activation code/PIN, view progress of their own children. | Modify any data, view other students' records. |
| College admin | Register users, import rosters, view college dashboard and audit logs for their specific college. | View, edit, or delete data belonging to any other college in the system. |

## Screens

- **Phone (360 px):** 
  - **Sign In:** Enter mobile number and activation code/PIN instead of OTP. If setting up for the first time, prompt to create a device PIN.
  - **Admin Audit Log:** A feed of administrative actions (who did what and when), with partially masked phone numbers.
- **Desktop (1200 px):**
  - **Admin Audit Log:** Full-width data table showing timestamp, user, action, and target entity.
- **Offline behaviour:** Sign-in requires an active internet connection. If offline, display the offline banner: "You are offline. Reconnect to sign in."

## API and data changes

| Method and path | Who can call it | Request | Response | Errors |
|---|---|---|---|---|
| POST `/api/auth/login/` | Any | `{ "phone": "...", "pin": "..." }` | `{ "token": "..." }` | 401 Unauthorized, 429 Too Many Requests |
| POST `/api/auth/setup-pin/` | Authenticated | `{ "activation_code": "...", "new_pin": "..." }` | 200 OK | 400 Bad Request |
| GET `/api/admin/audit-logs/` | College Admin | `?page=1` | `{ "logs": [...] }` | 403 Forbidden |

Model or migration changes:
- **User Model:** 
  - Apply application-level encryption to the `phone_number` field. 
  - Add a `phone_number_hash` column for fast lookups and uniqueness constraints.
  - Add `device_pin` (hashed) and `activation_code` fields.
- **AuditLog Model:** Create a new table to track `user_id`, `action`, `entity_type`, `entity_id`, `timestamp`, and `ip_address`.
- **Tenant Isolation:** Enforce `college_id` foreign keys and row-level security or strict queryset filtering across all models to ensure college admins only access their own college's data.

## Acceptance criteria

1. Given an unregistered phone number, when the user attempts to sign in, then the server refuses with a "Number not recognized" error.
2. Given a registered user with a valid activation code, when they set up their device PIN, then they can subsequently log in using only their phone number and PIN.
3. Given a user attempting to brute-force a PIN, when they exceed 5 failed attempts, then the account is temporarily locked (rate limited) and a 429 error is returned.
4. Given a college admin of College A, when they request data for College B via API, then the server refuses with a 403 Forbidden or 404 Not Found error.
5. Given a user record in the database, when an unauthorized party accesses the database directly, then they cannot read the plaintext phone number because it is encrypted.
6. Given any administrative action (e.g., adding a student), when it is performed, then a new record is created in the audit log tracking the action and actor.

## Out of scope

- Google sign-in and school-issued credentials (planned for later).
- Paid WhatsApp API and SMS integrations (planned for F3).
- Full role-based access control (RBAC) beyond the 4 fixed roles.

## Risks and open questions

- Key rotation for application-level encryption must be implemented carefully to avoid data loss.
- How are activation codes distributed to users initially if not via SMS? (Assume printed slips distributed by the college admin for now).

## Definition of done

- [ ] Spec signed off, with out-of-scope items listed
- [ ] Every acceptance criterion has a passing automated test
- [ ] Access-rule tests pass: wrong role, wrong college, wrong class, not linked
- [ ] Screens checked at 360, 390, 768, 1024 and 1440 px in light and dark mode
- [ ] Accessibility checks pass, with no serious or critical issues
- [ ] Performance budget met on the low-end phone profile
- [ ] Works offline or fails with a clear message (no blank screens)
- [ ] English and Urdu text reviewed by a native speaker
- [ ] Content approved by a subject teacher (if students see it)
- [ ] Errors are logged; personal data is not written to the logs
- [ ] README or admin guide updated
- [ ] Tried by at least 2 real users; their issues fixed or logged

## Release report

Filled in one week after release: what shipped, errors seen, usage, follow-ups.
