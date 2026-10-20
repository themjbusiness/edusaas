import { useState } from 'react';
import { go } from '../lib/router';

interface RoleHighlight {
  id: string;
  role: string;
  badge: string;
  icon: string;
  title: string;
  desc: string;
  bullets: string[];
  demoPhone: string;
  demoName: string;
}

const ROLES: RoleHighlight[] = [
  {
    id: 'principal',
    role: 'College Principals & Admins',
    badge: 'Executive Oversight',
    icon: 'monitoring',
    title: 'Institutional Compliance & Board Readiness',
    desc: 'Real-time visibility into college-wide attendance rates, student clearance velocity, and dropout risk before Federal Board registration cutoff.',
    bullets: [
      'Real-time clearance rate tracking & median recovery latency (hours)',
      'Class-by-class and teacher-by-teacher comparative analytics',
      'One-click official board compliance CSV export',
      'Simple spreadsheet class roster & teacher subject assignment'
    ],
    demoPhone: '+92 399 4440001',
    demoName: 'Ms. Sana Javed (College Admin)'
  },
  {
    id: 'teacher',
    role: 'Faculty & Subject Teachers',
    badge: 'Under 60s Daily Register',
    icon: 'school',
    title: 'Zero Paperwork Attendance & At-Risk Hub',
    desc: 'Take morning roll-call with single taps on mobile. Automatically receive green-tick clearance notifications as students catch up.',
    bullets: [
      'Rapid attendance register with auto-cleared green ticks',
      'At-Risk Hub highlighting chronic absentees (≥2 uncleared)',
      'One-tap parent WhatsApp & in-app nudge reminders',
      'Oral viva / medical certificate manual clearance override modal'
    ],
    demoPhone: '+92 399 1110001',
    demoName: 'Mr. Tariq Mehmood (Physics XI)'
  },
  {
    id: 'student',
    role: 'Intermediate Students',
    badge: 'Distraction-Free PWA',
    icon: 'menu_book',
    title: 'Master Missed Lectures On Your Own Schedule',
    desc: 'Never fall behind on FBISE intermediate syllabus. Listen to your textbook pages with synchronized audio narration and verify mastery with 5-question quizzes.',
    bullets: [
      'Scanned National Book Foundation textbook pages on screen',
      'Sentence-by-sentence highlighted audio narration',
      '80% pass threshold (4/5 MCQs) for official green-tick clearance',
      'Full offline mode for studying without continuous mobile data'
    ],
    demoPhone: '+92 399 2220001',
    demoName: 'Ali Raza (11th Pre-Medical A)'
  },
  {
    id: 'parent',
    role: 'Parents & Guardians',
    badge: 'Free Daily & Weekly Alerts',
    icon: 'family_restroom',
    title: 'Transparent Attendance & Academic Progress',
    desc: 'Instant notifications when your child is absent, with clear weekly catch-up summaries and full bilingual Urdu support.',
    bullets: [
      'Immediate alert upon class absence via in-app notification & WhatsApp',
      'Sunday evening weekly progress & lecture catch-up digest',
      'Urdu interface with native Noto Nastaliq script typography',
      '100% free messaging without carrier SMS surcharges'
    ],
    demoPhone: '+92 399 3330001',
    demoName: 'Mrs. Fatima Raza (Parent)'
  }
];

interface SubjectMeta {
  code: string;
  name: string;
  icon: string;
  units: number;
  grade: string;
  color: string;
  sampleTopics: string[];
}

const SUBJECTS: SubjectMeta[] = [
  {
    code: 'phy11',
    name: 'Physics',
    icon: 'science',
    units: 14,
    grade: 'Grade 11 & 12',
    color: 'from-blue-600/10 to-indigo-600/10 text-blue-700 dark:text-blue-400',
    sampleTopics: ['Estimation of Physical Quantities', 'Vectors & Equilibrium', 'Fluid Dynamics', 'Rotational Mechanics']
  },
  {
    code: 'chem11',
    name: 'Chemistry',
    icon: 'biotech',
    units: 12,
    grade: 'Grade 11 & 12',
    color: 'from-emerald-600/10 to-teal-600/10 text-emerald-700 dark:text-emerald-400',
    sampleTopics: ['Stoichiometry', 'Atomic Structure', 'Gases, Liquids & Solids', 'Chemical Kinetics']
  },
  {
    code: 'bio11',
    name: 'Biology',
    icon: 'nature_people',
    units: 12,
    grade: 'Grade 11 & 12',
    color: 'from-amber-600/10 to-orange-600/10 text-amber-700 dark:text-amber-400',
    sampleTopics: ['Cell Structure & Function', 'Biological Molecules', 'Enzymes & Bioenergetics', 'Physiology']
  },
  {
    code: 'math11',
    name: 'Mathematics',
    icon: 'calculate',
    units: 13,
    grade: 'Grade 11 & 12',
    color: 'from-purple-600/10 to-fuchsia-600/10 text-purple-700 dark:text-purple-400',
    sampleTopics: ['Number Systems', 'Matrices & Determinants', 'Trigonometric Identities', 'Analytical Geometry']
  },
  {
    code: 'cs11',
    name: 'Computer Science',
    icon: 'terminal',
    units: 10,
    grade: 'Grade 11 & 12',
    color: 'from-cyan-600/10 to-sky-600/10 text-cyan-700 dark:text-cyan-400',
    sampleTopics: ['Computer Systems Architecture', 'Networking & Protocols', 'Database Design (SQL)', 'Computational Logic']
  },
  {
    code: 'eng11',
    name: 'English Compulsory',
    icon: 'menu_book',
    units: 6,
    grade: 'Grade 11 & 12',
    color: 'from-rose-600/10 to-pink-600/10 text-rose-700 dark:text-rose-400',
    sampleTopics: ['Reading Comprehension', 'Applied Functional Grammar', 'Summary & Synthesis', 'Formal Composition']
  }
];

export function HomePage() {
  const [activeRole, setActiveRole] = useState(0);
  const [activeSubject, setActiveSubject] = useState(0);

  const selectedRole = ROLES[activeRole];

  return (
    <div className="w-full flex flex-col min-h-screen bg-surface">

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-outline-variant/30 bg-gradient-to-b from-surface-container-low via-surface to-surface">
        <div className="max-w-6xl mx-auto px-margin-mobile flex flex-col items-center text-center">
          
          {/* Institutional FBISE Compliance Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high text-primary border border-primary/10 shadow-sm mb-6 animate-[fadeIn_0.5s_ease-out]">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">
              FBISE Board-Compliant Interactive LMS · Intermediate Colleges
            </span>
          </div>

          {/* Main Value Proposition Title */}
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-[32px] md:text-[54px] md:leading-[62px] text-primary font-extrabold tracking-tight max-w-4xl">
            Never Let a Missed Lecture Become an Academic Failure
          </h1>

          {/* Lead Description */}
          <p className="font-body-lg text-[16px] md:text-[19px] text-on-surface-variant max-w-2xl mt-5 leading-relaxed">
            EduSaas transforms student absenteeism. When a student misses class, they receive the exact textbook lesson with synchronized AI audio narration and a 5-question mastery quiz — automatically restoring their attendance with verified green-tick clearances.
          </p>

          {/* Primary & Secondary Call To Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 w-full sm:w-auto">
            <button
              onClick={() => go('#/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>Access Institutional Portal</span>
            </button>

            <button
              onClick={() => go('#/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface-container-high text-primary font-label-lg text-label-lg font-semibold border border-outline-variant/40 hover:bg-surface-container transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Key Architectural Guarantees Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-12 w-full max-w-4xl pt-8 border-t border-outline-variant/20">
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 shadow-xs">
              <span className="font-headline-sm text-headline-sm font-bold text-primary">67+ Units</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">FBISE XI & XII STEM</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 shadow-xs">
              <span className="font-headline-sm text-headline-sm font-bold text-secondary">80% Quiz</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">Mastery Clearance Gate</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 shadow-xs">
              <span className="font-headline-sm text-headline-sm font-bold text-primary">Zero Live AI</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">100% Hallucination-Proof</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 shadow-xs">
              <span className="font-headline-sm text-headline-sm font-bold text-secondary">Offline PWA</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">Runs on 2G / WiFi</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. THE 4-STEP CLEARANCE WORKFLOW */}
      <section className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-margin-mobile">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Automated Accountability Loop
            </span>
            <h2 className="font-headline-md md:font-headline-lg text-[28px] md:text-[36px] text-primary font-bold tracking-tight mt-1">
              How EduSaas Restores Attendance
            </h2>
            <p className="font-body-md text-[15px] text-on-surface-variant mt-2 leading-relaxed">
              A closed-loop pedagogical workflow that keeps teachers in control, parents informed, and students accountable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-[16px] shadow-sm mb-4">
                1
              </div>
              <h3 className="font-headline-sm text-[18px] font-bold text-primary mb-2">Teacher Marks Absent</h3>
              <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                Faculty completes morning roll-call in under 60 seconds. An immediate alert is dispatched to the student's parent via in-app inbox and WhatsApp.
              </p>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-1.5 text-[12px] font-medium text-primary">
                <span className="material-symbols-outlined text-[16px] text-secondary">notifications_active</span>
                <span>Instant Parent Alert</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-[16px] shadow-sm mb-4">
                2
              </div>
              <h3 className="font-headline-sm text-[18px] font-bold text-primary mb-2">Student Studies Lesson</h3>
              <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                The student opens the missed lesson on their phone. The exact textbook page is displayed with clear audio narration synchronized word-by-word.
              </p>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-1.5 text-[12px] font-medium text-primary">
                <span className="material-symbols-outlined text-[16px] text-secondary">headphones</span>
                <span>≥ 90% Audio Gate</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 relative">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-[16px] shadow-sm mb-4">
                3
              </div>
              <h3 className="font-headline-sm text-[18px] font-bold text-primary mb-2">80% Mastery Quiz</h3>
              <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                To prove comprehension, the student must score 4/5 on unseen FBISE MCQs. Failed attempts enforce a 10-minute cooldown and targeted section review.
              </p>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-1.5 text-[12px] font-medium text-primary">
                <span className="material-symbols-outlined text-[16px] text-secondary">quiz</span>
                <span>Mastery Remediation</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col p-6 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 relative">
              <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold text-[16px] shadow-sm mb-4">
                ✓
              </div>
              <h3 className="font-headline-sm text-[18px] font-bold text-primary mb-2">Green-Tick Clearance</h3>
              <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                Upon passing, a green tick appears on the teacher's register. Attendance is officially restored without administrative paperwork or lost class time.
              </p>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-1.5 text-[12px] font-medium text-secondary font-bold">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Restored Attendance</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TAILORED PERSONA HUBS */}
      <section className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface">
        <div className="max-w-6xl mx-auto px-margin-mobile">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Built For Every Stakeholder
            </span>
            <h2 className="font-headline-md md:font-headline-lg text-[28px] md:text-[36px] text-primary font-bold tracking-tight mt-1">
              Dedicated Tools for College Operations
            </h2>
          </div>

          {/* Interactive Role Tabs */}
          <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-2 mb-8 hide-scrollbar">
            {ROLES.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => setActiveRole(idx)}
                className={`px-4 py-2.5 rounded-xl font-label-md text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  activeRole === idx
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
                <span>{r.role}</span>
              </button>
            ))}
          </div>

          {/* Role Feature Showcase Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col md:flex-row gap-8 items-center">
            
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-[11px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">star</span>
                {selectedRole.badge}
              </div>

              <h3 className="font-headline-md text-[24px] md:text-[28px] text-primary font-bold leading-snug">
                {selectedRole.title}
              </h3>

              <p className="font-body-md text-[15px] text-on-surface-variant leading-relaxed">
                {selectedRole.desc}
              </p>

              <div className="space-y-2.5 pt-2">
                {selectedRole.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-on-surface font-body-sm text-[13px]">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">check_circle</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={() => go('#/login')}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Sign In as {selectedRole.role.split(' ')[0]}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Persona Preview Badge */}
            <div className="w-full md:w-80 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-headline-md text-[22px] shadow-sm">
                <span className="material-symbols-outlined text-[32px]">{selectedRole.icon}</span>
              </div>
              <div>
                <p className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold">Demo Persona Included</p>
                <h4 className="font-headline-sm text-[16px] font-bold text-primary mt-1">{selectedRole.demoName}</h4>
                <p className="font-mono text-[12px] text-on-surface-variant mt-0.5">{selectedRole.demoPhone}</p>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
                Available in our one-click demo sandbox on the sign-in page.
              </p>
              <button
                onClick={() => go('#/login')}
                className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-[12px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Launch Persona Sandbox
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 4. FBISE INTERMEDIATE SYLLABUS DIRECTORY */}
      <section className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-margin-mobile">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                100% FBISE SLO Aligned
              </span>
              <h2 className="font-headline-md md:font-headline-lg text-[28px] md:text-[36px] text-primary font-bold tracking-tight mt-1">
                FBISE 11th & 12th Grade Curriculum
              </h2>
              <p className="font-body-md text-[15px] text-on-surface-variant mt-1.5 max-w-xl">
                All 67 units seeded from official National Book Foundation textbooks, verified by FBISE subject matter specialists.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high font-label-sm text-[12px] text-primary font-bold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Session 2026-2027 Syllabus Live
              </span>
            </div>
          </div>

          {/* Subject Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SUBJECTS.map((s, idx) => (
              <div
                key={s.code}
                onClick={() => setActiveSubject(idx)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  activeSubject === idx
                    ? 'border-primary ring-2 ring-primary/10 bg-surface-container-low shadow-sm'
                    : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                    </span>
                    <span className="font-label-sm text-[11px] font-bold text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container-high">
                      {s.units} Units
                    </span>
                  </div>

                  <h3 className="font-headline-sm text-[18px] font-bold text-primary">{s.name}</h3>
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">{s.grade}</p>

                  <div className="mt-3.5 space-y-1.5">
                    {s.sampleTopics.map((topic, tIdx) => (
                      <div key={tIdx} className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                        <span className="w-1 h-1 rounded-full bg-secondary shrink-0"></span>
                        <span className="truncate">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[12px] font-semibold text-primary">
                  <span>5-Option Quality Gated</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. ARCHITECTURAL & OPERATIONAL ADVANTAGES */}
      <section className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface">
        <div className="max-w-6xl mx-auto px-margin-mobile">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Engineering Rigor
            </span>
            <h2 className="font-headline-md md:font-headline-lg text-[28px] md:text-[36px] text-primary font-bold tracking-tight mt-1">
              Purpose-Built for Pakistani Colleges
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col space-y-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <h3 className="font-headline-sm text-[17px] font-bold text-primary">Zero Live AI In App</h3>
              <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                All scripts, audio synthesis, and quizzes are generated purely offline in the Content Factory. Zero unpredictable latency, zero runtime token costs, and 0% risk of LLM hallucinations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">wifi_off</span>
              </div>
              <h3 className="font-headline-sm text-[17px] font-bold text-primary">Offline PWA Architecture</h3>
              <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                Engineered for patchy 2G/3G connectivity. Scanned pages and lightweight audio files cache seamlessly on budget Android smartphones, allowing continuous study without data usage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col space-y-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">translate</span>
              </div>
              <h3 className="font-headline-sm text-[17px] font-bold text-primary">Bilingual English & Urdu</h3>
              <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                First-class Urdu typography with Google Noto Nastaliq Urdu. Parents receive alerts and progress digests in their native language, bridging the home-to-college communication gap.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-16 md:py-20 bg-primary text-on-primary">
        <div className="max-w-4xl mx-auto px-margin-mobile text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-[11px] font-bold uppercase tracking-wider mb-4">
            <span className="material-symbols-outlined text-[14px]">school</span>
            FBISE Pilot Term Active
          </span>

          <h2 className="font-headline-lg-mobile md:font-headline-lg text-[28px] md:text-[42px] font-extrabold tracking-tight leading-tight">
            Ready to Restore Student Attendance at Your College?
          </h2>

          <p className="font-body-lg text-[16px] md:text-[18px] text-on-primary/80 mt-4 max-w-2xl leading-relaxed">
            Join forward-thinking FBISE intermediate colleges modernizing attendance tracking, remediation, and board compliance with EduSaas.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full sm:w-auto">
            <button
              onClick={() => go('#/login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-on-primary text-primary font-label-lg text-label-lg font-bold shadow-lg hover:bg-surface-container-high transition-all cursor-pointer"
            >
              Sign In to Your Institutional Portal
            </button>
          </div>

          <p className="font-body-sm text-[12px] text-on-primary/60 mt-6">
            Authorized FBISE Institutional Platform · Federal Board of Intermediate & Secondary Education Islamabad
          </p>
        </div>
      </section>

    </div>
  );
}
