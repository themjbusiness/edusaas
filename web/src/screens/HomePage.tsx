import { useState, useEffect, useRef } from 'react';
import { go } from '../lib/router';
import { post, setToken, type Me } from '../lib/api';

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
  portalDescription: string;
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
    demoPhone: '+923994440001',
    demoName: 'Ms. Sana Javed',
    portalDescription: 'Margalla / XYZ College Administration Console'
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
    demoPhone: '+923991110001',
    demoName: 'Mr. Tariq Mehmood',
    portalDescription: 'Physics XI Faculty & Clearance Desk'
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
    demoPhone: '+923992220001',
    demoName: 'Ali Raza',
    portalDescription: '11th Grade Pre-Medical Section A'
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
    demoPhone: '+923993330001',
    demoName: 'Mrs. Fatima Raza',
    portalDescription: 'Parent of Ali Raza (Bilingual Urdu/English)'
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

export function HomePage({ onSignedIn }: { onSignedIn?: (me: Me) => void; args?: string[] }) {
  const [activeRole, setActiveRole] = useState(0);
  const [activeSubject, setActiveSubject] = useState(0);
  const [launchingRole, setLaunchingRole] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Simulator State
  const [isPlaying, setIsPlaying] = useState(false);
  const [simProgress, setSimProgress] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // ROI Calculator State
  const [studentCount, setStudentCount] = useState(800);
  const [absenceRate, setAbsenceRate] = useState(7);

  // Auto-advance simulated playback
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 5;
        });
      }, 500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  async function handleLaunchPersona(phone: string) {
    setLaunchingRole(phone);
    try {
      const r = await post<{ phone: string; demoCode?: string }>('auth/otp', { phone });
      const code = r.demoCode || '123456';
      const v = await post<{ token: string; me: Me }>('auth/verify', { phone: r.phone, code });
      setToken(v.token);
      if (onSignedIn) {
        onSignedIn(v.me);
      } else {
        const homeMap: Record<string, string> = {
          student: '#/home',
          teacher: '#/teacher',
          parent: '#/parent',
          college_admin: '#/admin'
        };
        go(homeMap[v.me.role] || '#/home');
      }
    } catch {
      go('#/login');
    } finally {
      setLaunchingRole(null);
    }
  }

  // Calculated ROI Metrics
  const dailyAbsents = Math.round((studentCount * absenceRate) / 100);
  const hoursRecovered = Math.round(dailyAbsents * 45 * 0.85); // 45-day term estimate
  const eligibilityRate = Math.min(98.5, Math.max(88, 100 - (absenceRate * 0.8))).toFixed(1);
  const teacherMakeupHoursSaved = Math.round(dailyAbsents * 2.5);

  const selectedRole = ROLES[activeRole];

  return (
    <div className="w-full flex flex-col min-h-screen bg-surface">

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-outline-variant/30 bg-gradient-to-b from-surface-container-low via-surface to-surface">
        <div className="max-w-6xl mx-auto px-margin-mobile flex flex-col items-center text-center">
          
          {/* Institutional Compliance Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high text-primary border border-primary/10 shadow-xs mb-6 animate-[fadeIn_0.5s_ease-out]">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">
              FBISE Board-Compliant Interactive LMS · Intermediate Colleges
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-[32px] md:text-[54px] md:leading-[62px] text-primary font-extrabold tracking-tight max-w-4xl">
            Never Let a Missed Lecture Become an Academic Failure
          </h1>

          {/* Value Subtitle */}
          <p className="font-body-lg text-[16px] md:text-[19px] text-on-surface-variant max-w-2xl mt-5 leading-relaxed">
            EduSaas transforms student absenteeism. When a student misses class, they receive the exact textbook lesson with synchronized AI audio narration and a 5-question mastery quiz — automatically restoring their attendance with verified green-tick clearances.
          </p>

          {/* 3 DISTINCT ACTION BUTTONS WITH CLEAR, INDEPENDENT FUNCTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 w-full sm:w-auto">
            
            {/* Button 1: Official Portal Sign In */}
            <button
              onClick={() => go('#/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer active:scale-[0.98]"
              title="Sign in with your registered college mobile number"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>Access Institutional Portal</span>
            </button>

            {/* Button 2: Instant 1-Click Demo Sandbox Modal */}
            <button
              onClick={() => setShowDemoModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-secondary text-on-secondary font-label-lg text-label-lg font-bold shadow-md hover:opacity-90 transition-all cursor-pointer active:scale-[0.98]"
              title="Test the live app as Student, Teacher, Principal, or Parent"
            >
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              <span>1-Click Demo Personas</span>
            </button>

            {/* Button 3: Interactive Lesson Simulator on this page */}
            <button
              onClick={() => document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container-high text-primary font-label-lg text-label-lg font-semibold border border-outline-variant/40 hover:bg-surface-container transition-all cursor-pointer"
              title="Scroll down to test the live textbook audio & quiz simulator"
            >
              <span className="material-symbols-outlined text-[20px]">headphones</span>
              <span>Try Simulator Below ↓</span>
            </button>

          </div>

          {/* Quick Metrics Bar */}
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

      {/* 2. LIVE INTERACTIVE CATCH-UP SIMULATOR (TRY IT YOURSELF DIRECTLY ON PAGE) */}
      <section id="simulator" className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface-container-low/50">
        <div className="max-w-4xl mx-auto px-margin-mobile">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-[11px] font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[14px]">touch_app</span>
              Interactive Experience
            </div>
            <h2 className="font-headline-md md:font-headline-lg text-[26px] md:text-[34px] text-primary font-bold tracking-tight">
              Experience the Catch-Up Loop in 30 Seconds
            </h2>
            <p className="font-body-md text-[14px] text-on-surface-variant mt-1.5">
              Interact with the synchronized textbook narrator below and complete the mini-quiz to trigger an official green-tick clearance.
            </p>
          </div>

          {/* Interactive Player Card */}
          <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-md p-5 sm:p-7 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[22px]">science</span>
                </span>
                <div>
                  <h3 className="font-headline-sm text-[16px] font-bold text-primary">Physics XI · Unit 1.1</h3>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">Estimation of Physical Quantities (NBF Page 8)</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold">
                Clearance Gate: 80%
              </span>
            </div>

            {/* Audio Control Bar */}
            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <div>
                    <span className="font-label-sm text-[12px] font-bold text-primary">
                      {isPlaying ? 'AI Voice Narrating...' : 'Click to Play Audio'}
                    </span>
                    <p className="font-mono text-[11px] text-on-surface-variant">
                      {Math.floor((simProgress * 45) / 100)}s / 45s · Pre-synthesized
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-secondary font-label-sm text-[12px] font-bold">
                  <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                  <span className="hidden sm:inline">Synced Highlighting</span>
                </div>
              </div>

              {/* Scrubber progress */}
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${simProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Synchronized Textbook Page Snippet */}
            <div className="p-4 sm:p-5 rounded-xl border border-outline-variant/30 bg-surface/50 font-body-md text-[14px] leading-relaxed space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-outline">
                National Book Foundation Textbook · Live Synchronized Text
              </div>
              <p className={simProgress >= 10 && simProgress < 40 ? 'bg-secondary-container/40 px-1.5 py-0.5 rounded transition-colors text-primary font-medium' : 'text-on-surface'}>
                1. Physics is an empirical discipline fundamentally based on accurate quantitative measurements and SI base dimensions.
              </p>
              <p className={simProgress >= 40 && simProgress < 75 ? 'bg-secondary-container/40 px-1.5 py-0.5 rounded transition-colors text-primary font-medium' : 'text-on-surface'}>
                2. In the International System of Units (SI), seven fundamental base quantities are defined: length, mass, time, electric current, temperature, amount of substance, and luminous intensity.
              </p>
              <p className={simProgress >= 75 ? 'bg-secondary-container/40 px-1.5 py-0.5 rounded transition-colors text-primary font-medium' : 'text-on-surface'}>
                3. Derived quantities such as force (Newton) and pressure (Pascal) are expressed algebraically in terms of these base dimensional units.
              </p>
            </div>

            {/* Interactive Mastery Quiz Box */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-[13px] font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">quiz</span>
                  Mastery Verification Question (SLO 1.1)
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">1 Question Sample</span>
              </div>

              <p className="font-body-md text-[14px] text-on-surface font-medium">
                Which of the following is an official SI base unit according to FBISE Physics syllabus?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 0, text: 'Newton (N)' },
                  { id: 1, text: 'Kelvin (K)' },
                  { id: 2, text: 'Joule (J)' },
                  { id: 3, text: 'Pascal (Pa)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    disabled={quizSubmitted}
                    onClick={() => {
                      setSelectedAnswer(opt.id);
                      setQuizSubmitted(true);
                    }}
                    className={`p-3 rounded-xl border text-left text-[13px] font-medium transition-all cursor-pointer flex items-center justify-between ${
                      quizSubmitted && opt.id === 1
                        ? 'bg-secondary-container/40 border-secondary text-secondary font-bold'
                        : quizSubmitted && selectedAnswer === opt.id && opt.id !== 1
                        ? 'bg-error-container/30 border-error text-error'
                        : selectedAnswer === opt.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/40 bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {quizSubmitted && opt.id === 1 && (
                      <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Clearance feedback banner */}
              {quizSubmitted && (
                <div className={`p-3.5 rounded-xl flex items-start gap-2.5 ${selectedAnswer === 1 ? 'bg-secondary-container/30 border border-secondary/30 text-secondary' : 'bg-surface-container-high text-on-surface'}`}>
                  <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                    {selectedAnswer === 1 ? 'verified' : 'help'}
                  </span>
                  <div className="text-[13px] leading-relaxed">
                    {selectedAnswer === 1 ? (
                      <div>
                        <strong className="block font-bold">✓ Clearance Granted (100% Score)</strong>
                        <span>Kelvin is the SI base unit of thermodynamic temperature. The teacher's register has been automatically updated with an official green-tick clearance!</span>
                      </div>
                    ) : (
                      <div>
                        <strong>Incorrect answer.</strong> Kelvin (K) is the SI base unit; Newton, Joule, and Pascal are derived units. In live mode, students get 3 attempts before cooldown.
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedAnswer(null);
                        setQuizSubmitted(false);
                      }}
                      className="mt-2 text-[12px] font-bold text-primary underline cursor-pointer"
                    >
                      Reset and Try Again
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* 3. INTERACTIVE ROI & CATCH-UP CALCULATOR */}
      <section id="calculator" className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface">
        <div className="max-w-4xl mx-auto px-margin-mobile">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Attendance Recovery Impact
            </span>
            <h2 className="font-headline-md md:font-headline-lg text-[26px] md:text-[34px] text-primary font-bold tracking-tight mt-1">
              Calculate Impact for Your College
            </h2>
            <p className="font-body-md text-[14px] text-on-surface-variant mt-1.5">
              See how automated catch-up protects your college's board eligibility threshold and eliminates faculty makeup overtime.
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Interactive Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-md text-[13px] font-bold text-primary">
                    Total Intermediate Students
                  </label>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary font-mono text-[12px] font-bold">
                    {studentCount} Students
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                  <span>200</span>
                  <span>1,500</span>
                  <span>3,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-md text-[13px] font-bold text-primary">
                    Average Daily Absence Rate
                  </label>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary font-mono text-[12px] font-bold">
                    {absenceRate}% Absences
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={absenceRate}
                  onChange={(e) => setAbsenceRate(Number(e.target.value))}
                  className="w-full accent-secondary cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                  <span>3% (Low)</span>
                  <span>8% (Average)</span>
                  <span>15% (High Risk)</span>
                </div>
              </div>
            </div>

            {/* Real-time Impact KPI Output Tiles */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                <span className="text-[12px] font-semibold text-on-surface-variant">Daily At-Risk Catch-Up</span>
                <span className="font-headline-sm text-[22px] font-extrabold text-primary mt-1">
                  ~{dailyAbsents} <span className="text-[12px] font-normal text-on-surface-variant">students/day</span>
                </span>
                <span className="text-[11px] text-secondary mt-1">Protected from falling behind</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                <span className="text-[12px] font-semibold text-on-surface-variant">Lecture Hours Saved</span>
                <span className="font-headline-sm text-[22px] font-extrabold text-secondary mt-1">
                  ~{hoursRecovered.toLocaleString()} <span className="text-[12px] font-normal text-on-surface-variant">hrs</span>
                </span>
                <span className="text-[11px] text-on-surface-variant mt-1">Per 45-day academic term</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                <span className="text-[12px] font-semibold text-on-surface-variant">Board Exam Eligibility</span>
                <span className="font-headline-sm text-[22px] font-extrabold text-primary mt-1">
                  {eligibilityRate}%
                </span>
                <span className="text-[11px] text-secondary mt-1">Well above 75% FBISE rule</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                <span className="text-[12px] font-semibold text-on-surface-variant">Faculty Makeup Overtime</span>
                <span className="font-headline-sm text-[22px] font-extrabold text-secondary mt-1">
                  ~{teacherMakeupHoursSaved} hrs
                </span>
                <span className="text-[11px] text-on-surface-variant mt-1">Saved monthly in repeat lectures</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. THE 4-STEP CLEARANCE WORKFLOW */}
      <section id="workflow" className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-margin-mobile">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Pedagogical Architecture
            </span>
            <h2 className="font-headline-md md:font-headline-lg text-[28px] md:text-[36px] text-primary font-bold tracking-tight mt-1">
              How EduSaas Restores Attendance
            </h2>
            <p className="font-body-md text-[15px] text-on-surface-variant mt-2 leading-relaxed">
              A closed-loop workflow that keeps teachers in control, parents informed, and students accountable.
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

      {/* 5. TAILORED PERSONA HUBS WITH DIRECT 1-CLICK LAUNCHERS */}
      <section id="roles" className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface">
        <div className="max-w-6xl mx-auto px-margin-mobile">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Built For Every Stakeholder
            </span>
            <h2 className="font-headline-md md:font-headline-lg text-[28px] md:text-[36px] text-primary font-bold tracking-tight mt-1">
              Dedicated Portals with 1-Click Launchers
            </h2>
          </div>

          {/* Role Tabs */}
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

          {/* Role Showcase Card */}
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
            </div>

            {/* Direct Persona Sandbox Box */}
            <div className="w-full md:w-80 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-headline-md text-[22px] shadow-sm">
                <span className="material-symbols-outlined text-[32px]">{selectedRole.icon}</span>
              </div>
              <div>
                <p className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold">1-Click Live Portal Sandbox</p>
                <h4 className="font-headline-sm text-[16px] font-bold text-primary mt-1">{selectedRole.demoName}</h4>
                <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">{selectedRole.portalDescription}</p>
              </div>

              <button
                disabled={launchingRole === selectedRole.demoPhone}
                onClick={() => handleLaunchPersona(selectedRole.demoPhone)}
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-label-sm text-[13px] font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {launchingRole === selectedRole.demoPhone ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    <span>Launching Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Launch {selectedRole.role.split(' ')[0]} Portal</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FBISE INTERMEDIATE SYLLABUS DIRECTORY */}
      <section id="curriculum" className="py-16 md:py-20 border-b border-outline-variant/20 bg-surface-container-lowest">
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

      {/* 7. INSTITUTIONAL CALL TO ACTION */}
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
            <button
              onClick={() => setShowDemoModal(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-bold border border-on-primary/20 hover:bg-primary-container/80 transition-all cursor-pointer"
            >
              Launch 1-Click Demo Sandbox
            </button>
          </div>

          <p className="font-body-sm text-[12px] text-on-primary/60 mt-6">
            Authorized FBISE Institutional Platform · Federal Board of Intermediate & Secondary Education Islamabad
          </p>
        </div>
      </section>

      {/* 8. 1-CLICK DEMO PERSONA MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                </span>
                <div>
                  <h3 className="font-headline-sm text-[16px] font-bold text-primary">Interactive Demo Sandbox</h3>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">Select any role to instantly open their live portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Persona Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  className="p-4 rounded-xl border border-outline-variant/30 bg-surface flex flex-col justify-between hover:border-primary/50 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary px-2 py-0.5 rounded-full bg-secondary-container/40">
                        {role.role.split(' ')[0]}
                      </span>
                    </div>
                    <h4 className="font-headline-sm text-[15px] font-bold text-primary">{role.demoName}</h4>
                    <p className="font-body-sm text-[12px] text-on-surface-variant leading-snug">
                      {role.portalDescription}
                    </p>
                  </div>

                  <button
                    disabled={launchingRole === role.demoPhone}
                    onClick={() => handleLaunchPersona(role.demoPhone)}
                    className="mt-4 w-full py-2 bg-primary hover:bg-primary-container text-on-primary font-label-sm text-[12px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {launchingRole === role.demoPhone ? (
                      <>
                        <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Live Portal</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Footer note */}
            <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant/20 text-center">
              <p className="font-body-sm text-[11px] text-on-surface-variant">
                Live sandbox connects to real database with pre-seeded FBISE Grade 11 lessons & test students.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
