export function StudentHome() {
  return (
    <>
      {/* Original Title: EduSaas - Student Home */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-20 bg-surface px-margin-mobile"><div className="flex flex-col w-full pb-6">
{/* Mode / State Toggle Pill (for previewing Active vs. Empty state) */}
<div className="flex items-center justify-between mb-4 bg-surface-container p-1 rounded-xl">
<button className="flex-1 py-1.5 px-3 rounded-lg font-label-md text-label-md transition-all text-on-primary bg-primary-container shadow-sm flex items-center justify-center gap-1.5" id="toggle-active-btn"  type="button">
<span className="material-symbols-outlined text-[16px]">how_to_reg</span>
      Enrolled (Active)
    </button>
<button className="flex-1 py-1.5 px-3 rounded-lg font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5" id="toggle-empty-btn"  type="button">
<span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
      Empty state
    </button>
</div>
{/* Student Header & Circular Progress Block */}
<div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm mb-4">
<div className="flex items-start justify-between gap-3">
{/* Greeting and Academic Profile */}
<div className="flex-1 min-w-0">
<p className="font-label-md text-label-md text-on-surface-variant mb-0.5 tracking-wide uppercase">Thursday, October 1</p>
<h1 className="font-headline-sm text-headline-sm text-primary tracking-tight truncate">Assalam o alaikum, Ali</h1>
<div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px] text-secondary">school</span>
<span className="truncate font-medium">11th Pre-Medical A · Roll 11A-01</span>
</div>
</div>
{/* Overall Daily Progress Ring Widget */}
<div className="flex flex-col items-center justify-center shrink-0 pl-1">
<div className="relative w-14 h-14 flex items-center justify-center">
<svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 48 48">
<circle className="stroke-surface-container-high" cx="24" cy="24" fill="transparent" r="20" strokeWidth="4" />
<circle className="stroke-secondary transition-all duration-500 ease-out" cx="24" cy="24" fill="transparent" id="progress-circle" r="20" strokeDasharray="125.66" strokeDashoffset="84.19" strokeLinecap="round" strokeWidth="4" />
</svg>
<span className="absolute font-headline-sm text-headline-sm text-primary font-bold" id="progress-percentage-text">33%</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-1 text-center font-medium" id="progress-caption-text">1/3 topics</span>
</div>
</div>
</div>
{/* ACTIVE STATE CONTENT WRAPPER */}
<div className="flex flex-col gap-4" id="active-state-container">
{/* Amber "Pending clearance" Card */}
<div className="bg-[#FFF3DC] rounded-xl p-4 shadow-sm flex flex-col gap-3">
{/* Header row: Warning icon + Full unclipped title + Notice Pill */}
<div className="flex items-center justify-between gap-2">
<div className="flex items-center gap-2 min-w-0">
<div className="w-8 h-8 rounded-lg bg-[#FFE0A3] flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[#A55A06] text-[20px]" style={{}}>warning</span>
</div>
<h2 className="font-headline-sm text-headline-sm text-[#A55A06] font-bold tracking-tight whitespace-nowrap overflow-visible">Pending clearance</h2>
</div>
<span className="px-2 py-0.5 rounded-full bg-[#FFE0A3] text-[#A55A06] font-label-sm text-label-sm font-semibold shrink-0">FBISE Reg</span>
</div>
{/* Detail Explanatory Body */}
<p className="font-body-md text-body-md text-on-surface leading-relaxed">
        You were absent on <strong className="font-semibold text-primary">Thu, Oct 1</strong> and missed <span className="font-semibold text-primary">Physics 1.2 Derived Units in Terms of Base Units</span>. Listen to the lesson and score 4/5 in the quiz to be cleared for class.
      </p>
{/* Attempts metric row */}
<div className="flex items-center gap-2 bg-[#FFF9ED] px-3 py-2 rounded-lg">
<span className="material-symbols-outlined text-[#A55A06] text-[18px]">history</span>
<p className="font-label-md text-label-md text-[#A55A06] font-medium">
          Attempts: <span className="font-semibold">1</span> · best <span className="font-semibold">3/5</span>
</p>
</div>
{/* Action Button */}
<button className="w-full h-12 bg-primary-container hover:bg-primary active:bg-primary text-on-primary rounded-[10px] font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all shadow-sm" type="button">
<span className="material-symbols-outlined text-[20px]" style={{}}>play_circle</span>
<span>Start missed lesson</span>
</button>
</div>
{/* Green "Cleared for class" Card */}
<div className="bg-[#E3F5EC] rounded-xl p-3.5 shadow-sm flex items-center gap-3">
<div className="w-9 h-9 rounded-full bg-[#C7EEDB] flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[#047857] text-[22px]" style={{}}>check_circle</span>
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center gap-2">
<span className="font-label-md text-label-md text-[#047857] font-bold uppercase tracking-wider">Cleared for class</span>
<span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
<span className="font-label-sm text-label-sm text-[#047857] font-semibold">Passed 4/5</span>
</div>
<p className="font-body-sm text-body-sm text-[#047857] truncate mt-0.5 font-medium">1.1 Estimation of Physical Quantities</p>
</div>
</div>
{/* Section: MY SUBJECTS */}
<div className="flex flex-col gap-2.5 mt-2">
<div className="flex items-center justify-between px-1">
<h3 className="font-label-lg text-[15px] font-bold tracking-wider text-on-surface-variant uppercase">MY SUBJECTS</h3>
<span className="font-label-sm text-label-sm text-on-surface-variant">Term 1 · 2024</span>
</div>
{/* Subject Card: Physics (Live / Active) */}
<a className="bg-surface-container-lowest p-3.5 rounded-xl shadow-sm flex flex-col gap-2.5 hover:bg-surface-container-low transition-colors block" href="#">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3 min-w-0">
{/* Atom Icon in Teal Tile */}
<div className="w-11 h-11 rounded-xl bg-[#E3F4F2] flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary text-[24px]">science</span>
</div>
<div className="flex flex-col min-w-0">
<h4 className="font-headline-sm text-headline-sm text-primary tracking-tight leading-tight">Physics</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant truncate">1 of 3 topics done</p>
</div>
</div>
<div className="flex items-center gap-2">
{/* 1 missed badge */}
<span className="px-2.5 py-0.5 rounded-full bg-[#FDECEA] text-[#B42318] font-label-sm text-label-sm font-semibold tracking-wide">
              1 missed
            </span>
<span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
</div>
</div>
{/* Linear Progress Track */}
<div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
<div className="bg-secondary h-1.5 rounded-full" style={{}}></div>
</div>
</a>
{/* Collapsed / Coming Soon Row: Chemistry, Biology */}
<div className="bg-surface-container-low p-3.5 rounded-xl flex items-center justify-between opacity-80">
<div className="flex items-center gap-3 min-w-0">
<div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-on-surface-variant text-[22px]">biotech</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-2">
<span className="font-label-lg text-label-lg text-on-surface-variant font-medium">Coming soon</span>
<span className="material-symbols-outlined text-on-surface-variant text-[14px]">lock</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant truncate">Chemistry, Biology</p>
</div>
</div>
<span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
          FBISE Unit 2
        </span>
</div>
</div>
</div>
{/* EMPTY STATE CONTAINER (Hidden by default, displayed via toggle) */}
<div className="hidden flex-col gap-4" id="empty-state-container">
{/* Dashed Institutional Empty State Card */}
<div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
<div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-3">
<span className="material-symbols-outlined text-primary text-[32px]">schedule</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-1">No Active Subjects Yet</h3>
<p className="font-body-md text-body-md text-on-surface-variant max-w-[280px] leading-relaxed">
        Your college has not added any subjects yet. Ask your teacher or college admin.
      </p>
<div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
<button className="w-full h-11 rounded-lg bg-surface-container hover:bg-surface-container-high font-label-md text-label-md text-primary flex items-center justify-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">refresh</span>
          Check for updates
        </button>
<button className="w-full h-10 rounded-lg text-secondary font-label-sm text-label-sm hover:underline"  type="button">
          Return to enrolled view
        </button>
</div>
</div>
{/* Institutional Notice Banner */}
<div className="bg-surface-container-low p-3.5 rounded-xl flex items-center gap-3">
<span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
<p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
        Enrollment records synchronized with Federal Board Islamabad (FBISE)
      </p>
</div>
</div>
</div>
</main>
    </>
  );
}
