# F21: Parent progress view and weekly summary

Status: Built 2026-10-01 (signed off the same day under the instruction "continue with the whole development"; recommendations accepted) · Owner: Muhammad Noor Khan · Last updated: 2026-10-01

Plan: [implementation plan, F21](../implementation-plan-subjects-languages-admin-parent.md#f21-parent-progress-view) · Decisions: D6 (free channels only), plan decision 4 (summary on Sunday 18:00 PKT)

## Problem

A parent today sees only whether their child has a pending clearance, the last 7 days of attendance, and the college's messages. They can't tell whether the child is keeping up: how many topics are done in each subject, how the quizzes went, or how often the child is absent. To find out, they have to call the college. Parents also get nothing when things are going well, so the app only ever brings bad news.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Parent | See progress for each of **their own** children: subjects, topics, quiz scores, attendance rate, time taken to clear; read the weekly summary; turn the weekly summary on or off | Any other child's data, even with a valid id; quiz questions or answers; teacher notes |
| Student | No change | — |
| Teacher | No change in F21 | — |
| College admin | No change in F21 | — |

The parent view is read-only apart from the summary on/off switch.

## Screens

**Phone (360 px):**
- **Parent home, one card per child:**
  - Name, class and roll number, with a status line: *Up to date* (green) or *1 missed lecture to clear* (amber).
  - Three numbers in a row:
    - **attendance** over the last 30 days (for example 92%)
    - **topics done** across subjects (for example 3 of 3)
    - **average quiz score** (for example 4.3/5)
  - One progress bar per subject, with "Coming soon" subjects greyed; tapping a subject opens the child's subject detail.
  - The existing pending-clearance lines and the recent attendance strip.
  - *Last active*, for example "Last studied today at 4:10 pm", or "No lessons started yet".
- **Child subject detail (new):**
  - Topics grouped by unit, each with a plain status: *Not started*, *Listening (45% heard)*, *Quiz ready*, *Passed 4/5* or *Missed, now cleared*.
  - A short note at the top explains the 4/5 pass mark.
  - Read-only: no buttons that change anything.
- **Messages:** weekly summaries appear in the same list as the college's alerts, marked **In app**, not with WhatsApp ticks.
- **Weekly summary switch:** at the bottom of the parent home: "Weekly summary every Sunday · On/Off".
- **Empty and error states:**
  - a child with no subjects: "The college hasn't added subjects yet"
  - no attendance yet: "No attendance recorded yet" instead of 0%
  - loading and offline use the existing cards

**Desktop (1200 px):** children's cards side by side (two columns). The child detail shows units on the left and topics on the right.

**Offline:** no offline mode yet (F4). The existing "You are offline" card with Try again; no blank screens.

## API and data changes

| Method and path | Who can call it | Request | Response | Errors |
|---|---|---|---|---|
| `GET /api/parent/home` (changed) | Parent | — | Adds per child: `summary {attendanceRate30d, attendanceDays30d, topicsDone, topicsTotal, avgScore, medianDaysToClear, lastActive}` and `subjects [{code, name, status, done, total, avgScore}]`; adds `weeklySummary: true/false` for the parent | — |
| `GET /api/parent/children/<student_id>/subjects/<code>` (new) | Parent, **only their own child**, only subjects taught to that child's class | — | `{child, subject, units: [{number, title, status, topics: [{topic, title, status, heardShare, best, missed, cleared}]}]}` | 404 for another parent's child, an unknown child, or a subject not taught to the class (never 403, so ids are not confirmed) |
| `POST /api/parent/settings` (new) | Parent | `{weeklySummary: bool}` | `{weeklySummary}` | 400 if not a boolean |

**Numbers, defined:**
- **Attendance rate:** (present + late) ÷ all attendance records in the last 30 days, across subjects. `null` when there are none.
- **Topics done:** topics with a passed quiz ÷ topics students can see.
- **Average score:** the mean best score over topics the child has attempted. `null` if none.
- **Median days to clear:** over clearances cleared in the last 90 days, from the absence date to the clearance date.
- **Last active:** the latest progress update or quiz submission.

Model and migration changes:

- **`User.weekly_summary`:** a boolean, default on. Only parents use it.
- **`Notification.channel`:** adds `inbox` (in-app only, free). Inbox messages do not count towards the 5-per-day message limit.
- **New command `send_weekly_summaries`,** with optional `--week-ending YYYY-MM-DD` and `--dry-run`:
  - Writes one inbox message per parent per child, type `weekly_summary`, covering Monday to Sunday.
  - Skips parents who turned the summary off, and logs "skipped: opted out".
  - Idempotent: running twice in one week sends nothing new.
- **Example summary:** "Ali this week: present 5 of 6 days. 1 missed lecture, cleared in 1 day. Physics 3 of 3 topics, average quiz 4.3/5. Chemistry and Biology: coming soon."

**Scheduling runbook:** Windows Task Scheduler (or cron on Linux) runs `python manage.py send_weekly_summaries` every Sunday at 18:00 Pakistan time. The command also works when run by hand.

## Acceptance criteria

1. Given a parent linked to Ali, when they open Ali's Physics detail, then they see every topic with its status and best score.
2. Given a parent **not** linked to Bilal, when they request Bilal's subject detail by id, then the server returns 404 and no data.
3. Given a student or teacher token, when they call the parent endpoints, then the server returns 403.
4. Given Ali was present 5 times and absent once in the last 30 days, then the attendance rate is 83% (5 of 6). Given no attendance, it is `null`, not 0.
5. Given Ali passed 1.1 with 4/5 and 1.2 with 5/5, then topics done is 2 of 3 and the average score is 4.5.
6. Given an absence on Monday cleared on Tuesday, then the median days to clear is 1.
7. Given a subject not taught to Ali's class, when his parent requests it, then 404.
8. Given the weekly command runs, then each parent with the summary on gets one inbox message per child with the week's numbers. Given it runs again the same week, then nothing new is sent.
9. Given a parent who turned the summary off, when the command runs, then no message is sent for them.
10. Given 5 alerts have already been sent to a parent today, when the weekly summary runs, then it is still delivered (the inbox is exempt from the daily limit).
11. Given the parent's Messages screen, then weekly summaries show as "In app", with no WhatsApp ticks.

## Out of scope

- **Phone push notifications** for the summary and alerts (F3, free web push). Until then, the summary is in the in-app Messages list.
- The teacher's one-tap "Send on WhatsApp" list (F3).
- Urdu text for the summary and screens (F23).
- Comparisons with classmates or class averages (not planned: parents see only their own child).
- Parent replies or messages to teachers.

## Risks and open questions

- **Few parents open the app,** so an in-app summary alone reaches few of them until push (F3) is built. Mitigation: build F3's web push next. The summary text is written so it can be sent on any channel later.
- **Attendance per subject vs per day:** attendance is recorded per subject period, so "present 5 of 6" counts periods, not days. The screens say "classes", not "days", to stay accurate.
- **Scheduler on the demo PC:** the Sunday job only runs if the computer is on. That's acceptable for the demo; it moves to the host's scheduler in F6.

## Definition of done

- [x] Spec signed off, with out-of-scope items listed
- [x] Every acceptance criterion has a passing automated test
- [x] Access-rule tests pass: wrong role, wrong college, wrong class, not linked
- [ ] Screens checked at 360, 390, 768, 1024 and 1440 px in light and dark mode
- [ ] Accessibility checks pass, with no serious or critical issues
- [ ] Performance budget met on the low-end phone profile
- [ ] Works offline or fails with a clear message (no blank screens)
- [ ] English and Urdu text reviewed by a native speaker (English only in F21; Urdu comes with F23)
- [ ] Content approved by a subject teacher (if students see it)
- [x] Errors are logged; personal data is not written to the logs
- [x] README or admin guide updated (demo script, and how to schedule the weekly summary)
- [ ] Tried by at least 2 real users; their issues fixed or logged

## Implementation notes

Built on 1 October 2026. Where the build differs from the spec above:

- **Attendance numbers:** the API returns `attendanceRate30d` (a whole percentage, or `null`) and `attendanceClasses30d` (`{present, total}`) instead of `attendanceDays30d`, because attendance is recorded per class period.
- **Idempotency:** each weekly message stores its week (`week:YYYY-MM-DD`) so the command never sends the same week twice, even if run with `--week-ending`.
- **Which week:** the command covers Monday to Sunday of the most recent Sunday (today, if run on a Sunday), so the Sunday 18:00 run reports that same week.
- **Message panel:** the parent's message list is no longer labelled "Verified business account", because it now also holds in-app messages.

Checks run: 48 backend tests (9 new for F21), and a browser journey at 390 px and 1280 px, light and dark: the parent card numbers, the subject detail, the weekly summary in Messages, and the on/off switch surviving a reload. No page errors.

Definition of done still open: accessibility and performance tooling, screenshots at 768 and 1024 px, a low-end phone test, real-user trials.

## Release report

Filled in one week after release.
