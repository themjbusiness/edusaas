export function PhysicsSubjectDetails() {
  return (
    <>
      {/* Original Title: EduSaas - Physics Subject Details */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface"><div className="flex flex-col w-full pb-10">
{/* Simulation Mode Selector (Interactive Presentation Toggle) */}
<section className="px-margin-mobile pt-space-sm pb-space-xs">
<div className="bg-surface-container p-1 rounded-xl flex items-center justify-between shadow-sm">
<button aria-pressed="true" className="flex-1 py-2 px-space-xs rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 bg-surface-container-lowest text-primary shadow-sm" id="btn-physics-view" >
<span className="material-symbols-outlined text-[16px] text-secondary">science</span>
<span>Active (Physics)</span>
</button>
<button aria-pressed="false" className="flex-1 py-2 px-space-xs rounded-lg text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 text-on-surface-variant hover:text-on-surface" id="btn-chemistry-view" >
<span className="material-symbols-outlined text-[16px]">biotech</span>
<span>Empty Subject (Chemistry)</span>
</button>
</div>
</section>
{/* ================= ACTIVE SUBJECT: PHYSICS ================= */}
<div className="flex flex-col w-full transition-opacity duration-200" id="physics-content">
{/* Header Hero Section */}
<section className="px-margin-mobile pt-space-sm pb-space-md">
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center gap-space-md">
{/* 56px Atom Icon Tile */}
<div className="w-14 h-14 rounded-xl bg-secondary-container/40 flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-secondary text-[32px]">grain</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<div className="flex items-center justify-between gap-1">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight truncate">Physics</h2>
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
                HSSC-I
              </span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant truncate">
              Grade 11 · 1 of 14 units available
            </p>
</div>
</div>
{/* Progress Metrics */}
<div className="pt-space-xs flex flex-col gap-1.5">
<div className="flex items-center justify-between text-label-sm font-label-sm">
<span className="text-on-surface-variant">Unit 1 Progression</span>
<span className="text-secondary font-semibold">1 of 3 topics cleared (33%)</span>
</div>
{/* Bar Track */}
<div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
<div className="h-full bg-secondary rounded-full w-1/3 transition-all duration-500"></div>
</div>
</div>
</div>
</section>
{/* SECTION 1: UNIT 1 CARDS */}
<section className="px-margin-mobile flex flex-col gap-space-sm pb-space-lg">
{/* Section Header */}
<div className="flex flex-col gap-0.5">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
            UNIT 1 · PHYSICAL QUANTITIES AND MEASUREMENTS
          </span>
<span className="material-symbols-outlined text-[18px] text-on-surface-variant">verified</span>
</div>
<div className="flex items-center gap-1.5">
<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-container-high text-primary">
            National Book Foundation
          </span>
<span className="text-label-sm font-label-sm text-on-surface-variant">· FBISE Core Syllabus</span>
</div>
</div>
{/* Topic Card 1.1 (Cleared) */}
<article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm active:bg-surface-container-low transition-colors cursor-pointer">
<div className="flex items-start gap-space-sm">
{/* Numerical Chip */}
<div className="w-11 h-11 rounded-lg bg-secondary-container/40 flex items-center justify-center flex-shrink-0 text-on-secondary-container font-label-lg text-label-lg font-bold">
            1.1
          </div>
{/* Content Details */}
<div className="flex-1 min-w-0">
<div className="flex items-start justify-between gap-space-xs">
<h3 className="font-headline-sm text-[16px] text-on-surface leading-snug">
                Estimation of Physical Quantities
              </h3>
{/* Status Pill (Cleared) */}
<span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-container/50 text-secondary">
<span className="material-symbols-outlined text-[14px]">check</span>
                4/5 Cleared
              </span>
</div>
{/* Meta Row */}
<div className="flex items-center gap-space-md mt-1.5 text-on-surface-variant text-label-sm font-label-sm">
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">schedule</span>
                3:30
              </span>
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">menu_book</span>
                Pages 8–10
              </span>
</div>
</div>
</div>
{/* Action / Review Footnote */}
<div className="pt-space-xs mt-0.5 flex items-center justify-between text-secondary font-label-sm text-label-sm">
<span className="font-medium">Review narration &amp; quiz results</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</div>
</article>
{/* Topic Card 1.2 (Missed & Quiz Ready - Action Required) */}
<article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm active:bg-surface-container-low transition-colors">
<div className="flex items-start gap-space-sm">
{/* Numerical Chip */}
<div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant font-label-lg text-label-lg font-bold">
            1.2
          </div>
{/* Content Details */}
<div className="flex-1 min-w-0">
<div className="flex items-start justify-between gap-space-xs">
<h3 className="font-headline-sm text-[16px] text-on-surface leading-snug">
                Derived Units in Terms of Base Units
              </h3>
{/* Status Pill Stack */}
<div className="flex flex-col items-end gap-1 flex-shrink-0">
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-error-container text-error">
<span className="material-symbols-outlined text-[13px]">warning</span>
                  Missed
                </span>
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container-highest text-primary">
                  Quiz ready
                </span>
</div>
</div>
{/* Meta Row */}
<div className="flex items-center gap-space-md mt-1.5 text-on-surface-variant text-label-sm font-label-sm">
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">schedule</span>
                2:13
              </span>
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">menu_book</span>
                Pages 10–11
              </span>
</div>
</div>
</div>
{/* Integrated Action Banner/Button */}
<button className="w-full min-h-[48px] px-space-md py-2.5 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-between active:bg-primary-container shadow-sm transition-all" >
<span className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px]">play_circle</span>
<span>Listen &amp; Take Quiz (1/5 passed)</span>
</span>
<span className="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</article>
{/* Topic Card 1.3 (In Progress) */}
<article className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm active:bg-surface-container-low transition-colors cursor-pointer">
<div className="flex items-start gap-space-sm">
{/* Numerical Chip */}
<div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant font-label-lg text-label-lg font-bold">
            1.3
          </div>
{/* Content Details */}
<div className="flex-1 min-w-0">
<div className="flex items-start justify-between gap-space-xs">
<h3 className="font-headline-sm text-[16px] text-on-surface leading-snug">
                Dimensions of Physical Quantities
              </h3>
{/* Subtle Sunken Indicator */}
<span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
                45% heard
              </span>
</div>
{/* Meta Row */}
<div className="flex items-center gap-space-md mt-1.5 text-on-surface-variant text-label-sm font-label-sm">
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">schedule</span>
                3:40
              </span>
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">menu_book</span>
                Pages 11–14
              </span>
</div>
</div>
</div>
{/* Inline Audio Micro Progress */}
<div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
<div className="bg-primary/60 h-full w-[45%] rounded-full"></div>
</div>
</article>
</section>
{/* SECTION 2: MORE UNITS · COMING SOON */}
<section className="px-margin-mobile flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          MORE UNITS · COMING SOON
        </span>
<span className="text-label-sm font-label-sm text-on-surface-variant">Production Pipeline</span>
</div>
<div className="flex flex-col gap-2">
{/* Coming Soon Row 1 */}
<div className="bg-surface-container-low/70 rounded-xl p-space-sm px-space-md flex items-center justify-between">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-label-md font-label-md text-on-surface-variant flex-shrink-0">
              2
            </span>
<span className="font-body-md text-body-md text-on-surface truncate">
              Vectors and Equilibrium
            </span>
</div>
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant flex-shrink-0">
            Coming soon
          </span>
</div>
{/* Coming Soon Row 2 */}
<div className="bg-surface-container-low/70 rounded-xl p-space-sm px-space-md flex items-center justify-between">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-label-md font-label-md text-on-surface-variant flex-shrink-0">
              3
            </span>
<span className="font-body-md text-body-md text-on-surface truncate">
              Translatory Motion and Force
            </span>
</div>
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant flex-shrink-0">
            Coming soon
          </span>
</div>
{/* Coming Soon Row 3 */}
<div className="bg-surface-container-low/70 rounded-xl p-space-sm px-space-md flex items-center justify-between">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-label-md font-label-md text-on-surface-variant flex-shrink-0">
              4
            </span>
<span className="font-body-md text-body-md text-on-surface truncate">
              Work, Energy and Power
            </span>
</div>
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant flex-shrink-0">
            Coming soon
          </span>
</div>
{/* Coming Soon Row 4 */}
<div className="bg-surface-container-low/70 rounded-xl p-space-sm px-space-md flex items-center justify-between">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-label-md font-label-md text-on-surface-variant flex-shrink-0">
              5
            </span>
<span className="font-body-md text-body-md text-on-surface truncate">
              Rotational and Circular Motion
            </span>
</div>
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant flex-shrink-0">
            Coming soon
          </span>
</div>
{/* Compact Collapsed Production Indicator */}
<div className="py-2.5 px-space-md rounded-xl bg-surface-container/60 text-center font-label-md text-label-md text-on-surface-variant flex items-center justify-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-secondary">pending</span>
<span>+ 9 more FBISE Units in production</span>
</div>
</div>
</section>
</div>
{/* ================= EMPTY SUBJECT PREVIEW: CHEMISTRY ================= */}
<div className="hidden flex-col w-full transition-opacity duration-200" id="chemistry-content">
<section className="px-margin-mobile pt-space-sm flex flex-col gap-space-md">
{/* Chemistry Subject Header Summary */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
{/* 56px Flask Icon Tile */}
<div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-primary text-[32px]">science</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-2">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">Chemistry</h2>
<span className="px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant">Grade 11</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">0 of 12 units currently published</p>
</div>
</div>
{/* Verbatim Empty State Card (Civic / Institutional Tone) */}
<div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col items-center text-center shadow-sm">
<div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-sm">
<span className="material-symbols-outlined text-[28px]">hourglass_top</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
          Curriculum Under Review
        </h3>
{/* Exact verbatim requirement specified in prompt */}
<p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed mb-space-md">
          Chemistry is coming soon — Lessons appear here after the EduSaas team produces them and your teacher approves them.
        </p>
{/* Notification Trigger Button */}
<button className="w-full min-h-[48px] px-space-md bg-secondary text-on-secondary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 active:bg-on-secondary-container shadow-sm transition-all" id="notify-btn" >
<span className="material-symbols-outlined text-[18px]">notifications</span>
<span id="notify-btn-text">Notify me when available</span>
</button>
<p className="font-label-sm text-label-sm text-on-surface-variant mt-space-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">shield</span>
          FBISE Syllabus Aligned Content
        </p>
</div>
{/* Syllabus Outline Placeholder */}
<div className="flex flex-col gap-2 opacity-60">
<span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
          Planned Syllabus Overview
        </span>
<div className="bg-surface-container-lowest rounded-xl p-space-sm px-space-md flex items-center justify-between text-on-surface-variant">
<span className="font-body-md text-body-md">Unit 1: Stoichiometry</span>
<span className="text-label-sm font-label-sm">In Authoring</span>
</div>
<div className="bg-surface-container-lowest rounded-xl p-space-sm px-space-md flex items-center justify-between text-on-surface-variant">
<span className="font-body-md text-body-md">Unit 2: Atomic Structure</span>
<span className="text-label-sm font-label-sm">Pending</span>
</div>
</div>
</section>
</div>
{/* Micro Interaction Toast Feedback Container */}
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-[90%] bg-inverse-surface text-inverse-on-surface py-2.5 px-4 rounded-full text-label-md font-label-md shadow-lg pointer-events-none opacity-0 transition-opacity duration-300 flex items-center gap-2 z-50" id="interaction-toast">
<span className="material-symbols-outlined text-[18px] text-secondary-fixed">info</span>
<span id="toast-message">Action recorded</span>
</div>
</div>
</main>
    </>
  );
}
