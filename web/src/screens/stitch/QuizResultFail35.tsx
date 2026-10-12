export function QuizResultFail35() {
  return (
    <>
      {/* Original Title: EduSaas - Quiz Result (Fail 3/5) */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface"><div className="flex flex-col w-full px-margin-mobile pb-space-xl">
{/* Subtle FBISE Academic Context Header Info */}
<div className="flex items-center justify-between py-space-sm mb-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">FBISE Intermediate • Class XI</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Session 2024-25</span>
</div>
{/* Main Hero Card: Amber / Notice State (Attempt Failed / Needs 4/5) */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col items-center text-center relative overflow-hidden">
{/* Top Decorative Status Bar */}
<div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>
{/* Motivational Badge / Stamp */}
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-label-sm text-label-sm mb-space-md">
<span className="material-symbols-outlined text-amber-700 text-[16px]">info</span>
<span>Passing Threshold: 80% (4/5)</span>
</div>
{/* Big Amber Circle with Retry Icon */}
<div className="relative w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-space-sm shadow-inner">
<span className="material-symbols-outlined text-amber-700 text-[38px] transition-transform duration-500 hover:rotate-180">replay</span>
{/* Pulsing hint ring */}
<div className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping opacity-25 pointer-events-none"></div>
</div>
{/* Prominent Score */}
<div className="flex items-baseline justify-center gap-1">
<span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold tracking-tight">3</span>
<span className="text-on-surface-variant font-headline-sm text-headline-sm font-semibold">/ 5</span>
</div>
{/* Encouraging Headline */}
<h2 className="font-headline-md text-headline-md text-on-surface font-bold mt-1">Almost there!</h2>
{/* Explanatory Copy */}
<p className="font-body-md text-body-md text-on-surface-variant max-w-xs mt-1.5">
      You need 4/5 to pass. Review the lesson, then try again in <span className="font-semibold text-amber-800" id="cooldown-timer">28s</span>.
    </p>
{/* Progress Bar Indicator */}
<div className="w-full max-w-xs bg-surface-container-high rounded-full h-2 mt-4 mb-2 overflow-hidden flex">
<div className="bg-emerald-600 h-full w-[60%] rounded-full"></div>
<div className="bg-amber-400 h-full w-[20%] opacity-40"></div>
</div>
<div className="w-full max-w-xs flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-space-md">
<span>Current: 60%</span>
<span className="font-medium text-amber-900">Required: 80%</span>
</div>
{/* Dual Action Buttons */}
<div className="w-full flex flex-col gap-2.5 pt-space-xs">
<button className="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.99] text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all" id="retry-btn">
<span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-180">replay</span>
<span>Try Again</span>
<span className="font-label-sm text-label-sm text-primary-fixed-dim bg-white/10 px-2 py-0.5 rounded-full" id="btn-timer">(28s)</span>
</button>
<button className="w-full h-12 bg-surface-container-low hover:bg-surface-container active:scale-[0.99] text-on-surface font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 transition-colors" >
<span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
<span>Review Lesson Notes</span>
</button>
</div>
</div>
{/* FBISE Academic Breakdown Overview Ribbon */}
<div className="grid grid-cols-3 gap-2 mt-space-md">
<div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant">Time Taken</span>
<span className="font-label-lg text-label-lg text-on-surface mt-0.5">3m 42s</span>
</div>
<div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant">Accuracy</span>
<span className="font-label-lg text-label-lg text-amber-700 mt-0.5">60.0%</span>
</div>
<div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant">Curriculum</span>
<span className="font-label-lg text-label-lg text-secondary mt-0.5">SLO 1.2</span>
</div>
</div>
{/* Section: Review Your Answers */}
<div className="mt-space-lg mb-space-sm flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-on-surface-variant text-[18px]">fact_check</span>
<h3 className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant font-bold">Review Your Answers</h3>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">5 Questions Total</span>
</div>
{/* Answer Cards Stack */}
<div className="flex flex-col gap-3">
{/* Card 1: Question 1 (Correct) */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex">
{/* Left Border Stripe for Status */}
<div className="w-1.5 bg-emerald-600 shrink-0"></div>
<div className="flex-1 p-space-md flex flex-col">
<div className="flex items-start justify-between gap-2 mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-semibold">Question 1 • 1 Mark</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
            Correct
          </span>
</div>
<p className="font-body-lg text-body-lg text-on-surface font-medium leading-snug">Which of the following is an SI base unit?</p>
{/* Response Strip */}
<div className="bg-surface-container-low rounded-lg p-3 my-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-md font-body-md">
<span className="text-on-surface-variant font-medium">You chose:</span>
<span className="text-on-surface font-bold">kilogram (kg)</span>
</div>
<div className="flex items-center justify-between text-body-md font-body-md text-emerald-800 pt-1 border-t border-surface-container">
<span className="font-medium">Correct:</span>
<span className="font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">check</span>
              kilogram (kg)
            </span>
</div>
</div>
{/* Explanation Footer */}
<div className="flex items-start gap-1.5 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">lightbulb</span>
<p>Kilogram is one of the seven fundamental SI base units, whereas Newton and Joule are derived.</p>
</div>
</div>
</div>
{/* Card 2: Question 2 (Missed) */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex">
{/* Left Border Stripe for Missed */}
<div className="w-1.5 bg-amber-500 shrink-0"></div>
<div className="flex-1 p-space-md flex flex-col">
<div className="flex items-start justify-between gap-2 mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-semibold">Question 2 • 0 Marks</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">cancel</span>
            Missed
          </span>
</div>
<p className="font-body-lg text-body-lg text-on-surface font-medium leading-snug">The joule (J) in terms of SI base units is:</p>
{/* Response Strip */}
<div className="bg-surface-container-low rounded-lg p-3 my-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-md font-body-md">
<span className="text-on-surface-variant font-medium flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              You chose:
            </span>
<span className="text-amber-900 font-bold">kg m s⁻²</span>
</div>
<div className="flex items-center justify-between text-body-md font-body-md text-emerald-800 pt-1 border-t border-surface-container">
<span className="font-medium">Correct:</span>
<span className="font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">check</span>
              kg m² s⁻²
            </span>
</div>
</div>
{/* Explanation Footer */}
<div className="flex items-start gap-1.5 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">lightbulb</span>
<p>Work = Force × Displacement = (kg·m·s⁻²) × m = kg·m²·s⁻². You  the unit of Force instead of Work/Energy.</p>
</div>
</div>
</div>
{/* Card 3: Question 3 (Correct) */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex">
<div className="w-1.5 bg-emerald-600 shrink-0"></div>
<div className="flex-1 p-space-md flex flex-col">
<div className="flex items-start justify-between gap-2 mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-semibold">Question 3 • 1 Mark</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
            Correct
          </span>
</div>
<p className="font-body-lg text-body-lg text-on-surface font-medium leading-snug">What is the derived unit of Force (Newton) in SI base units?</p>
{/* Response Strip */}
<div className="bg-surface-container-low rounded-lg p-3 my-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-md font-body-md">
<span className="text-on-surface-variant font-medium">You chose:</span>
<span className="text-on-surface font-bold">kg m s⁻²</span>
</div>
<div className="flex items-center justify-between text-body-md font-body-md text-emerald-800 pt-1 border-t border-surface-container">
<span className="font-medium">Correct:</span>
<span className="font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">check</span>
              kg m s⁻²
            </span>
</div>
</div>
{/* Explanation Footer */}
<div className="flex items-start gap-1.5 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">lightbulb</span>
<p>From Newton's second law F = ma, mass is in kg and acceleration in m·s⁻².</p>
</div>
</div>
</div>
{/* Card 4: Question 4 (Missed) */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex">
<div className="w-1.5 bg-amber-500 shrink-0"></div>
<div className="flex-1 p-space-md flex flex-col">
<div className="flex items-start justify-between gap-2 mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-semibold">Question 4 • 0 Marks</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">cancel</span>
            Missed
          </span>
</div>
<p className="font-body-lg text-body-lg text-on-surface font-medium leading-snug">Power is defined as work done per unit time. Its base units are:</p>
{/* Response Strip */}
<div className="bg-surface-container-low rounded-lg p-3 my-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-md font-body-md">
<span className="text-on-surface-variant font-medium flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              You chose:
            </span>
<span className="text-amber-900 font-bold">kg m² s⁻²</span>
</div>
<div className="flex items-center justify-between text-body-md font-body-md text-emerald-800 pt-1 border-t border-surface-container">
<span className="font-medium">Correct:</span>
<span className="font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">check</span>
              kg m² s⁻³
            </span>
</div>
</div>
{/* Explanation Footer */}
<div className="flex items-start gap-1.5 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">lightbulb</span>
<p>Power = Work / Time = (kg·m²·s⁻²) / s = kg·m²·s⁻³. The additional division by seconds changes s⁻² to s⁻³.</p>
</div>
</div>
</div>
{/* Card 5: Question 5 (Correct) */}
<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex">
<div className="w-1.5 bg-emerald-600 shrink-0"></div>
<div className="flex-1 p-space-md flex flex-col">
<div className="flex items-start justify-between gap-2 mb-2">
<span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-semibold">Question 5 • 1 Mark</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
            Correct
          </span>
</div>
<p className="font-body-lg text-body-lg text-on-surface font-medium leading-snug">Which physical quantity has the unit kg m⁻¹ s⁻²?</p>
{/* Response Strip */}
<div className="bg-surface-container-low rounded-lg p-3 my-2.5 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-md font-body-md">
<span className="text-on-surface-variant font-medium">You chose:</span>
<span className="text-on-surface font-bold">Pressure (Pascal)</span>
</div>
<div className="flex items-center justify-between text-body-md font-body-md text-emerald-800 pt-1 border-t border-surface-container">
<span className="font-medium">Correct:</span>
<span className="font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">check</span>
              Pressure (Pascal)
            </span>
</div>
</div>
{/* Explanation Footer */}
<div className="flex items-start gap-1.5 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">lightbulb</span>
<p>Pressure = Force / Area = (kg·m·s⁻²) / m² = kg·m⁻¹·s⁻².</p>
</div>
</div>
</div>
</div>
{/* Recommended Quick Study Aid Card */}
<div className="w-full bg-surface-container-high rounded-xl p-space-md mt-space-lg flex items-center gap-3">
<div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-secondary">
<span className="material-symbols-outlined text-[28px]">download_for_offline</span>
</div>
<div className="flex-1 min-w-0">
<p className="font-label-lg text-label-lg text-on-surface truncate">Base &amp; Derived Units Quick Formula Sheet</p>
<p className="font-body-sm text-body-sm text-on-surface-variant">Official FBISE Syllabus PDF • 1.2 MB</p>
</div>
<button className="px-3 py-2 bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg font-label-md text-label-md shrink-0 transition-colors">
      View
    </button>
</div>
{/* Interactive 30s Countdown Logic */}

</div></main>
    </>
  );
}
