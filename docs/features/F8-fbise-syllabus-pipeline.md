# F8: Full FBISE 11th Syllabus Production Pipeline & Tracker

**Status:** Signed off · **Owner:** Muhammad Noor Khan · **Date:** 2026-10-14 · **Part of:** v1.2 Pilot Term Release

---

## 1. Problem

EduSaas pilots cannot scale to full college adoption if the content library is restricted to only 3 physics lessons. Subject teachers across all core intermediate streams (Pre-Medical, Pre-Engineering, Computer Science) require curriculum coverage across Physics, Chemistry, Biology, Mathematics, and Computer Science. Furthermore, curriculum teams need an automated **Production Pipeline Tracker & Quality Gate** to audit lesson schemas, verify quiz pools, enforce audio size budgets (< 5 MB), and monitor teacher sign-offs across the entire FBISE Class 11 syllabus.

---

## 2. Users and Access Rules

| Role | What they can do | What they must never see or do |
|---|---|---|
| **Content Pipeline (CLI/DevOps)** | Run `factory.py build/status/tracker` across all FBISE books; validate schemas; enforce 5 MB audio gates; export bundled Lesson Objects to LMS. | Run live AI calls in the web app runtime; bypass content schema validation. |
| **Teacher** | Review and curate lessons for their assigned FBISE subjects in the Teacher Portal; view complete curriculum units in catalog. | Review or edit lessons for subjects they do not teach; publish lessons without meeting quality gates. |
| **Student** | Browse syllabus units in Library; access approved lessons and take mastery quizzes. | Access draft, in-review, or rejected lessons (404 Not Found); download server-side quiz answer keys. |
| **College Admin / Principal** | View subject catalogue, teaching assignments, and syllabus coverage in administrative consoles. | Modify content factory files directly; access cross-college data. |

---

## 3. FBISE 11th Syllabus Architecture

The pipeline standardizes on the National Book Foundation (Federal Textbook Board) curriculum for Grade 11:

1. **Physics 11 (`phy11`)**: 14 Units (Physical Quantities, Vectors, Motion, Rotational Motion, Work & Energy, Fluids, Solids, Thermodynamics, Waves, Electrostatics, Electricity, Magnetism, Relativity, Particle Physics).
2. **Chemistry 11 (`chem11`)**: 12 Units (Stoichiometry, Atomic Structure, Covalent Bonding, Gases, Liquids, Solids, Chemical Equilibrium, Acids & Bases, Chemical Kinetics, Solutions, Thermochemistry, Electrochemistry).
3. **Biology 11 (`bio11`)**: 12 Units (Cell Structure, Biological Molecules, Enzymes, Bioenergetics, Viruses, Prokaryotes, Plants Diversity, Animals Diversity, Plant Form & Function, Digestion, Circulation, Respiration).
4. **Mathematics 11 (`math11`)**: 12 Units (Complex Numbers, Matrices, Vectors, Sequences & Series, Miscellaneous Series, Permutations & Probability, Binomial Theorem, Trigonometry Fundamentals, Identities, Graphs, Triangle Solutions, Inverse Trigonometry).
5. **Computer Science 11 (`cs11`)**: 10 Units (Computer Systems, Architecture, CPU, System Unit, Networks, Wireless Communication, Database Fundamentals, DBMS, Security, Operating Systems).
6. **English 11 (`eng11`)**: 7 Units (Short Stories, Plays, Poetry, Reading Comprehension, Grammar & Syntax, Academic Writing, Formal Communication).

---

## 4. Pipeline Quality Gates & Content Schema

Every lesson in the pipeline must strictly satisfy automated quality gates:
1. **Audio Budget Gate**: Total audio file size must be strictly $< 5\text{ MB}$ at 48 kbps mono MP3 (enforced in `cf/tts.py`).
2. **Quiz Assessment Gate**:
   - Each lesson must supply a question pool of $\ge 5$ MCQs (typically 8–10 questions for retry diversity).
   - Exactly 4 unique options per question.
   - Correct answer index must be within range $[0, 3]$.
   - Explanations must be non-empty and cite textbook reasoning.
3. **Curriculum Continuity Gate**:
   - Sections must follow strict page order monotonicity corresponding to textbook page allocations.
   - Dual-track narration (English/Roman Urdu and optional Urdu script) must maintain synchronized cue timestamps.
4. **Production Tracker (`factory.py tracker`)**:
   - Aggregates syllabus coverage across all FBISE books, counting total units, lessons, audio status, quiz questions, and review status (`draft`, `in_review`, `approved`).

---

## 5. API & Data Changes

1. **`backend/lms/management/commands/seed_catalogue.py`**:
   - Extended to seed complete 11th grade curriculum units for all 6 FBISE subjects into `Subject` and `Unit` models.
2. **`backend/lms/management/commands/import_lessons.py`**:
   - Multi-book import support for `phy11`, `chem11`, `bio11`, `math11`, `cs11`.
   - Automatic unit creation and linking with sort order preservation.
3. **`content_factory/books/`**:
   - Config files defining syllabus hierarchy, page offsets, neural voice profiles, and lesson metadata.

---

## 6. Acceptance Criteria (Automated Tests)

1. **Multi-subject catalogue seeding**: Given `seed_catalogue` is run, all 6 FBISE 11th subjects (`phy11`, `chem11`, `bio11`, `math11`, `cs11`, `eng11`) and their respective official curriculum units are seeded into the database ($\ge 65$ total units).
2. **Production tracker auditing**: Given `factory.py tracker` is run across book configs, it accurately validates all lessons, detects missing assets, verifies quiz pools, and outputs a complete status breakdown.
3. **Quality gate enforcement**:
   - Any lesson with $< 5$ quiz questions or invalid options is rejected with schema error.
   - Any lesson with audio $> 5\text{ MB}$ is blocked at join time.
   - Non-monotonic section page order is rejected.
4. **Multi-book lesson import**: Given built lesson objects for multiple subjects, `import_lessons` successfully imports lessons, links units, and sets subjects to `live` once approved lessons exist.
5. **Multi-tenant and role security**: Students in the LMS cannot see unapproved or draft lessons across any subject (404), and teachers only see reviewable lessons for their assigned subjects.

---

## 7. Definition of Done

- [x] Feature spec created and validated against project rules.
- [x] Complete FBISE 11th syllabus units defined in `seed_catalogue.py`.
- [x] Book configs and authored curriculum templates configured in `content_factory/books/`.
- [x] Automated production tracker implemented in `content_factory/factory.py`.
- [x] Automated tests covering catalogue seeding, quality gates, and multi-book imports pass.
- [x] Zero live AI runtime dependencies in the web/backend application.
