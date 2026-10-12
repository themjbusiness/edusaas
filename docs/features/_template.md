# F<N>: <Feature name>

Status: Draft | In review | Signed off | Building | Done · Owner: <name> · Last updated: <YYYY-MM-DD>

Copy this file to `docs/features/F<N>-<short-name>.md` (for example `F1-design-system.md`) and fill in each section. Keep it to about one page; move long detail into an appendix at the end.

## Problem

Who has the problem, what they do today, and what goes wrong. One short paragraph.

## Users and access rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| Student | | |
| Teacher | | |
| Parent | | |
| College admin | | |

## Screens

- **Phone (360 px):** layout, main action, empty, loading and error states.
- **Desktop (1200 px):** layout and what changes from phone.
- Offline behaviour: what works and what message is shown when it doesn't.

## API and data changes

| Method and path | Who can call it | Request | Response | Errors |
|---|---|---|---|---|

Model or migration changes:

## Acceptance criteria

Each criterion becomes an automated test.

1. Given …, when …, then …
2. Given a user who is not linked to …, when they …, then the server refuses with …

## Out of scope

-

## Risks and open questions

-

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
