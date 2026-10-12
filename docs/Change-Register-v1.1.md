# Change Register: AI-Powered Interactive LMS for FBISE Colleges

**Applies to:** Master Product Blueprint & Team Documentation Pack, v1.0 (September 2026)
**Target version:** v1.1
**Prepared for:** Muhammad Noor Khan (document owner)
**Status:** Draft for review. No change has been applied to the blueprint yet.

---

## 1. How to use this register

1. Read each item. Every item points to the exact blueprint section it affects.
2. Fill in the **Decision** column with one of: `Accept`, `Modify`, `Reject`, `Defer`.
3. For `Modify`, write your exact wording or rule in **Your specific change**. Leave blank for `Accept`.
4. Return the completed register. Only accepted and modified items will be applied to the blueprint, producing v1.1.

**Priority key**

| Code | Meaning |
|---|---|
| P1 | Resolve before building anything further. It affects legality, viability or the data model. |
| P2 | Resolve before the college pilot (Phase 3). |
| P3 | Improvement. Can follow the pilot. |

**Type key:** `Fix` = error or inconsistency in the current text. `Add` = missing content. `Revise` = content exists but should change. `Decide` = needs a founder decision, not a rewrite.

---

## 2. Summary

| Part | Items | P1 | P2 | P3 |
|---|---|---|---|---|
| Part I: Business blueprint | 10 | 3 | 6 | 1 |
| Part II: Team framework | 2 | 0 | 1 | 1 |
| Part III: Technical documentation | 13 | 2 | 10 | 1 |
| Part IV: UI/UX documentation | 7 | 0 | 5 | 2 |
| Cross-cutting (not in the blueprint) | 6 | 3 | 2 | 1 |
| **Total** | **38** | **8** | **24** | **6** |

---

## 3. Part I: Business blueprint

| ID | Section | Type | Pri | Current content | Issue | Proposed change | Decision | Your specific change |
|---|---|---|---|---|---|---|---|---|
| CR-01 | 1.2 Core philosophy | Revise | P2 | "Near-zero ongoing API costs" and "100% accuracy (no AI hallucinations)". | Serving cost is low, but generation, review and messaging costs are real. A pre-generated script can still contain errors. | Reword to "low serving cost" and "expert-reviewed content". Add a line naming the one-time generation and review cost. | | |
| CR-02 | 1.2 / 1.4 Textbook page images | Decide | P1 | The student views the real high-resolution FBISE textbook page inside the paid product. | No licence for commercial reproduction is documented. The books are published by the National Book Foundation (the Federal Textbook Board). | Obtain written permission from NBF/FBISE. Fallbacks: (a) audio-only with the student's own book, (b) re-authored content. Record the chosen path in 1.2. | | |
| CR-03 | 1.3 Use cases | Revise | P2 | Three use cases presented as equal. | Only use case 1 (absentee clearance) is the sellable wedge. | Mark use case 1 as the launch focus. Label use cases 2 and 3 as retention features. | | |
| CR-04 | 1.4 Product architecture | Fix | P1 | Lesson Object = one page (image + audio + quiz). | "Lecture", "chapter" and "clearance" have no defined unit. Clearance per page is impractical. | Define the hierarchy Subject → Chapter → Lecture → Page. Attach audio, quiz and clearance at the Lecture level. Update the diagram in Figure 1.1. | | |
| CR-05 | 1.5 Workflow A | Add | P2 | Single happy path, plus a "Next day" entry step. | No exceptions: illness, wrong parent number, repeated failure, teacher override. | Add an exceptions table: excused absence, wrong number, three failed attempts, teacher override with reason. | | |
| CR-06 | 1.6 Technical stack | Decide | P2 | Backend "Node.js or Python (Django/FastAPI)". | Left open, but the Content Factory is Python and Django provides the admin panel. | Choose Django as the single recommended backend. | | |
| CR-07 | 1.7 Pricing model | Decide | P1 | PKR 1,000–2,000 per student per year. | Unvalidated. Messaging alone (WhatsApp utility rates) could take a material share. | Build the unit-economics model (see CR-36). Consider a minimum annual fee per college plus a per-student rate. Record the validated price. | | |
| CR-08 | 1.7 Target market rollout | Revise | P3 | Phase 2 expands to Punjab and Sindh boards. | The PRD lists multi-board support as out of scope for the MVP. | Keep as a post-launch roadmap item, and remove it from MVP wording. | | |
| CR-09 | 1.8 Risk mitigation | Add | P2 | Four risks: data cost, language, cheating, gate friction. | Omits copyright, privacy, messaging cost and content errors. Cheating mitigation is only randomisation. | Add the four missing risks with owners. Add cheating controls: attempt cooldown, server-side listen time, teacher review of repeat attempts. | | |
| CR-10 | 1.9 Execution roadmap | Fix | P2 | MVP in weeks 1–10 (PRD) versus a 20-week Gantt. | Platform build in 10 weeks is unrealistic, and the two timelines conflict. No demand validation step. | Use one timeline of 16–24 weeks for the platform. Insert a demand-validation step (principal interviews) before Phase 2. | | |

---

## 4. Part II: Team documentation framework

| ID | Section | Type | Pri | Current content | Issue | Proposed change | Decision | Your specific change |
|---|---|---|---|---|---|---|---|---|
| CR-11 | 2.3 Marketing / 2.4 Support | Add | P2 | Lists the documents each team needs. | The Marketing and Support documents are promised but not written. | Draft: value proposition, benefit matrix, launch roadmap, known limitations, troubleshooting guide. | | |
| CR-12 | 2.4 Escalation matrix | Fix | P3 | Billing issues go to Marketing. | Billing is not a marketing function. | Route billing to Finance/Operations. | | |

---

## 5. Part III: Technical documentation

| ID | Section | Type | Pri | Current content | Issue | Proposed change | Decision | Your specific change |
|---|---|---|---|---|---|---|---|---|
| CR-13 | 3.1 US 2.4 Quiz unlock | Revise | P2 | Quiz unlocks at 90% audio completion or "manually marked as listened". | Seeking to the end or self-marking bypasses the gate. | Track cumulative listened seconds on the server. Require a minimum quiz time and a cooldown between attempts. | | |
| CR-14 | 3.1 US 4.1 Absence alert | Revise | P2 | Message within 5 minutes; SMS fallback. | Retries and fallback multiply message cost. | Add a per-parent daily message budget. Send SMS only after a confirmed WhatsApp failure. Batch alerts per class. | | |
| CR-15 | 3.1 Epics | Add | P2 | Four epics. | No epic for exceptions (excused absence, override, appeals). | Add Epic 5, "Clearance Exceptions", with user stories and acceptance criteria. | | |
| CR-16 | 3.1 US 2.5 Offline sync | Revise | P2 | Quiz syncs "via a background fetch" when back online. | Background Sync is not supported on every browser and device. | Add a fallback that syncs on next app open. Show results as "pending sync" and show the teacher the last sync time. | | |
| CR-17 | 3.2 Hosting | Revise | P2 | AWS Mumbai; "under 50 ms latency"; API under 200 ms. | Targets are asserted, not measured. | Benchmark from Islamabad and Karachi mobile networks before choosing a host. Record the results. | | |
| CR-18 | 3.2 / 3.3 Data security | Fix | P1 | Phone numbers "hashed or encrypted". | Numbers must be readable to send messages, so hashing alone cannot work. | Use application-level encryption with key rotation. Keep a separate hashed column only for lookup and uniqueness. | | |
| CR-19 | 3.3 Schema: missing tables | Add | P1 | Nine tables listed. | Missing: `lectures`, `class_subjects`, `teacher_classes`, `quiz_attempts`, `absence_reasons`, `parent_contacts` (with opt-in status). `quiz_attempt` appears in the diagram but not the schema. | Add the six tables with columns and constraints. Update Figure 3.1. | | |
| CR-20 | 3.3 `clearance_records` | Revise | P2 | Links to `lesson_object_id`; stores `quiz_score` and `is_cleared`. | Not tied to the absence; not auditable. | Link to `lecture_id` and `absence_id`. Add `attempt_count`, `passed_at`, `override_by`, `override_reason`. | | |
| CR-21 | 3.3 `lesson_objects.quiz_json` | Revise | P2 | Array of 5 MCQs stored per page. | Does not scale to a lecture quiz, and the answer key could leak to the client. | Store a question pool per lecture; select 5 per attempt on the server. Never send the answer key to the client. | | |
| CR-22 | 3.3 Integrity constraints | Add | P2 | Foreign keys only. | A student's class can belong to a different college than the student. Gender rules exist only in the UI. | Add constraints or checks for same-college integrity. Enforce gender and class rules in the database. | | |
| CR-23 | 3.3 Content review fields | Add | P2 | `is_published` only. | No record of who reviewed content. | Add `reviewed_by`, `reviewed_at`, `review_status` to lecture/lesson tables. | | |
| CR-24 | 3.4 Definition of Done | Add | P2 | Performance, offline and validation criteria. | No privacy, content-review or cost criteria. | Add: PII encryption verified; content sign-off recorded; message cost logged; error monitoring configured. | | |
| CR-25 | 3.4 Content Factory DoD | Add | P3 | Audio size and JSON validation checks. | No output regression tests. | Add golden-file tests for script and quiz output and an audio-duration check. | | |

---

## 6. Part IV: UI/UX documentation

| ID | Section | Type | Pri | Current content | Issue | Proposed change | Decision | Your specific change |
|---|---|---|---|---|---|---|---|---|
| CR-26 | 4.1 Journey 1 / 4.2 Screen 7 | Revise | P2 | Red Cross for pending; the teacher stops the student at the door. | Recreates the gate confrontation the product claims to avoid. | Show "Pending" in amber with the next step. Add a teacher override. Show the last attempt time to settle disputes. | | |
| CR-27 | 4.1 Personas | Add | P2 | The parent has no direct interface. | The parent's WhatsApp message and landing page are the entry point of the main flow. | Design the parent message template and landing page as first-class screens. | | |
| CR-28 | 4.2 Screen list | Add | P2 | Eleven screens. | Missing: parent number correction, excused-absence request, teacher override, data-saver settings. | Add the four screens and include them in the prototype flows. | | |
| CR-29 | 4.2 Screen 4 Quiz | Revise | P2 | Gentle fail state with "Retry Quiz". | No retry limit or cooldown. | Show attempts left and a cooldown timer, and require a lesson review step after repeated failure. | | |
| CR-30 | 4.3 Typography | Decide | P2 | Allows Urdu script (Nastaliq) or Roman Urdu. | Mixed direction text causes layout bugs, as the document itself warns. | Decide for the MVP: Roman Urdu and English only. Defer Urdu script. | | |
| CR-31 | 4.3 Colour | Revise | P3 | Green Tick and Red Cross are the status signals. | Colour-only status excludes colour-blind users. | Pair each status with an icon and a text label. | | |
| CR-32 | 4.3 Dark mode | Decide | P3 | "Dark mode default" in 4.1, and "offer" in other places. | Inconsistent. | Follow the system setting with a manual toggle. | | |

---

## 7. Cross-cutting items (not covered in the blueprint)

| ID | Area | Type | Pri | Gap | Proposed change | Decision | Your specific change |
|---|---|---|---|---|---|---|---|
| CR-33 | Legal and privacy | Add | P1 | No section covers minors' data, WhatsApp opt-in, PTA SMS rules or the draft Personal Data Protection Act. | Add a "Legal and Compliance" section after 1.8. Obtain a lawyer's review before the pilot. | | |
| CR-34 | Demand validation | Add | P1 | No customer evidence for pricing or demand. | Interview 10 principals and 5 teachers. Add a summary to Part I. | | |
| CR-35 | Content QA process | Add | P2 | Manual review is mentioned only for the pilot chapter. | Assign a subject expert reviewer and define a sign-off workflow (links to CR-23). | | |
| CR-36 | Unit economics | Add | P1 | No cost model. | Add a model covering messages, TTS, LLM, hosting and sales cost per student at 500, 2,000 and 10,000 students. | | |
| CR-37 | Success metrics | Add | P2 | The pilot has no defined targets. | Define targets: clearance within 24 hours, weekly active students, message delivery rate, quiz pass rate, teacher time saved. | | |
| CR-38 | Operations | Add | P3 | No onboarding, invoicing or renewal process. | Add a short operations section for colleges. | | |

*(CR-33 to CR-38 count toward the summary as P1: 3, P2: 2, P3: 1, matching section 2.)*

---

## 8. Open questions for the document owner

These need your answer before some items can be finalised.

| # | Question | Affects |
|---|---|---|
| Q1 | Do you already have any permission or contact at NBF/FBISE for using the textbooks? | CR-02 |
| Q2 | What is the minimum acceptable price per student and per college? | CR-07, CR-36 |
| Q3 | Will the college or the parents pay? (The blueprint allows either.) | CR-07 |
| Q4 | Is the launch target one college, or several, for the pilot? | CR-10, CR-37 |
| Q5 | Who will review the generated content (subject teachers, in-house)? | CR-23, CR-35 |
| Q6 | Is Roman Urdu the confirmed language for the MVP? | CR-30 |
| Q7 | Should the teacher be able to override a clearance? Who else? | CR-05, CR-15, CR-20 |

---

## 9. Sign-off

| Role | Name | Date | Decision on the register |
|---|---|---|---|
| Document owner | Muhammad Noor Khan | | |
| Engineering lead | | | |
| Design lead | | | |
