# F6: Hosting and Operations

Status: Draft | In review | Signed off | Building | Done · Owner: Antigravity · Last updated: 2026-10-08

## Problem

Currently, EduSaas runs entirely on a local development server using SQLite and local file storage. Before launching the pilot at the first college, the system must be deployed to a reliable, secure production environment. If we lose the SQLite file, we lose all student progress. If the app isn't served over HTTPS, Service Workers (and offline mode) will not function. We need PostgreSQL for concurrent transactions, Cloudflare R2 for affordable and scalable media storage, automated backups, and error monitoring to catch issues before principals notice them.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Student / Teacher / Parent | Experience a fast, secure (HTTPS) app with reliable media playback and high uptime. | Access debugging info or tracebacks. |
| College admin | N/A | N/A |
| EduSaas Operations (Superuser) | Deploy updates, monitor Sentry for errors, restore DB backups, manage Cloudflare R2 buckets. | N/A |

## Screens

- **Phone (360 px) / Desktop (1200 px):** 
  - There are no specific new UI screens for F6. The focus is infrastructure.
  - **Error States:** If the backend throws a 500, a clean, generic "Something went wrong" message should be displayed, while the actual traceback is securely logged to Sentry.
- **Offline behaviour:** Offline mode (F4) now fully works because the PWA is served securely over HTTPS.

## API and data changes

| Method and path | Who can call it | Request | Response | Errors |
|---|---|---|---|---|
| N/A | N/A | N/A | N/A | N/A |

Model or migration changes:
- Migrate from SQLite to **PostgreSQL**. The Django ORM abstractions mean no major code changes, but the database adapter (`psycopg2-binary` or `psycopg`) must be configured in `settings.py`.
- **Storage Backend:** Switch from local Django media storage to `django-storages` with the **S3/Cloudflare R2** backend for handling all uploaded textbook images and audio files.

## Acceptance criteria

1. Given the production environment, when the Django app starts, then it connects successfully to a PostgreSQL database instead of SQLite.
2. Given a lesson with media assets, when requested by the app, then the media is served securely via Cloudflare R2 (S3 API).
3. Given an unhandled exception in the backend, when it occurs, then a scrubbed error report (without PII or phone numbers) is sent to Sentry.
4. Given the React frontend, when deployed, then it is served over HTTPS and the Service Worker installs successfully.
5. Given a scheduled backup time, when reached, then an automated backup of the PostgreSQL database is safely stored in a separate R2 bucket.

## Out of scope

- Multi-region failover or Kubernetes clusters (a single VPS with Docker/Docker Compose is sufficient for the pilot phase).
- Advanced CI/CD pipelines (simple git hooks or manual deploy scripts are fine initially).
- APM (Application Performance Monitoring) beyond basic Sentry error tracking.

## Risks and open questions

- **Cost:** Ensure Cloudflare R2 egress stays within the free tier or is heavily cached by the Cloudflare CDN to avoid bandwidth bills from students downloading audio.
- **Backups:** Who manages the encryption keys for the database backups, and how is the restore process tested?

## Definition of done

- [ ] Spec signed off, with out-of-scope items listed
- [ ] Every acceptance criterion has a passing automated test (or infrastructure check)
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
