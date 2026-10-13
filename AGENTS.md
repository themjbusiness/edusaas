# EduSaas Agent Instructions

You are working on EduSaas, an AI-Powered Interactive LMS for FBISE Colleges. 

## Project Overview
EduSaas is a B2B SaaS for private FBISE intermediate colleges. The core loop is:
1. A teacher marks a student absent.
2. The parent gets an automated alert.
3. The student listens to the missed lecture (a textbook page with pre-generated AI narration) and must score at least 80% on a quiz.
4. The student receives a "Green Tick" clearance, and the teacher is notified.

## Technology Stack
- **Backend (`backend/`)**: Django and PostgreSQL.
- **Frontend (`web/`)**: React + TypeScript + Vite. It is a Progressive Web App (PWA) with a robust design system.
- **Content Factory (`content_factory/`)**: A Python-based offline pipeline. It turns textbook PDFs into LLM-generated scripts and quizzes, then converts scripts to text-to-speech (TTS), producing final images, audio, and JSON for the quizzes.
- **Storage**: Cloudflare R2.
- **Rule on Live AI**: **No live AI in the app**. To avoid hallucinations, high latency, and unpredictable costs, all AI generation happens purely offline in the Content Factory. 

## Developer Workflow & Documentation
- **Feature Specs**: Before writing any code for a new feature, a specification **must** be created in `docs/features/F<N>-<short-name>.md` (based on `docs/features/_template.md`).
- **Definition of Done**:
  - Automated tests must cover all acceptance criteria.
  - Strict access-rule checks (role, class, college isolation).
  - Responsive checks (360px up to 1440px) and dark mode.
  - Offline support (or a clear failure message).
  - Accessibility compliance.
- **UI Prompts**: Detailed UI prompts and aesthetic directions for Google Stitch are available in `docs/stitch-ui-prompts.md`.

## Agent Constraints
- **Security**: Never expose user PII or allow cross-college data access. Write tests for access rules.
- **Architecture**: Stick to the Django backend and React frontend structure. Do not introduce new massive dependencies unless strictly required.
- **Context**: Always check the `docs/` folder for existing specs and the `Change-Register-v1.1.md` before making architectural decisions.

## Session Continuity & Memory Handover
- **Always read `docs/ACTIVE_SESSION.md`**: At the start of any conversation or after an IDE restart/reload, immediately inspect `docs/ACTIVE_SESSION.md` and `git status` to seamlessly recover full context of where the user left off.
- **Maintain `docs/ACTIVE_SESSION.md`**: Whenever a milestone, feature, or work session is completed, update `docs/ACTIVE_SESSION.md` with:
  1. What was completed and tested.
  2. Any in-progress work or known blockers.
  3. Immediate next roadmap steps.
- This ensures session memory is preserved locally in the workspace and online via Git across all IDE reboots and new conversation windows.

