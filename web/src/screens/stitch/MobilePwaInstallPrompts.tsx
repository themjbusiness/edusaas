export function MobilePwaInstallPrompts() {
  return (
    <>
      {/* Original Title: EduSaas - Mobile PWA Install Prompts */}
      <main className="flex-1 flex flex-col w-full bg-surface pt-16 pb-28"><div className="flex flex-col w-full relative">
{/* PWA Mode Inspection Switcher */}
<div className="px-margin-mobile pt-space-xs pb-space-sm">
<div className="bg-surface-container p-1 rounded-xl flex items-center justify-between shadow-sm">
<button className="flex-1 py-2 px-3 rounded-lg text-center font-label-md text-label-md transition-all duration-200 bg-surface-container-lowest text-primary shadow-sm flex items-center justify-center gap-1.5" id="tab-android" >
<span className="material-symbols-outlined text-[16px]">android</span>
<span>Android Docked</span>
</button>
<button className="flex-1 py-2 px-3 rounded-lg text-center font-label-md text-label-md transition-all duration-200 text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5" id="tab-ios" >
<span className="material-symbols-outlined text-[16px]">phone_iphone</span>
<span>iOS Safari Sheet</span>
</button>
</div>
</div>
{/* Authentic Student Dashboard (Background Live Context) */}
<div className="px-margin-mobile flex flex-col gap-space-md pb-16">
{/* Student Header Card */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-headline-sm text-headline-sm">
            AR
          </div>
<div className="flex flex-col">
<div className="flex items-center gap-1.5">
<span className="font-label-lg text-label-lg text-on-surface">Ali Raza</span>
<span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full">Roll # 842109</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">HSSC-I (11th) Pre-Medical • Section A</p>
</div>
</div>
<span className="bg-surface-container-high text-on-primary-fixed-variant font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">verified</span>
          Cleared
        </span>
</div>
{/* Quick College Badges */}
<div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-secondary text-[18px]">account_balance</span>
<span className="truncate">FBISE Affiliated College</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">92.4% Attd.</span>
</div>
</div>
{/* Active Academic Module */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">science</span>
</div>
<div>
<h2 className="font-label-lg text-label-lg text-on-surface">Physics • Unit 1.2: Vectors &amp; Equilibrium</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Next Class: Today, 11:30 AM (Room 204)</p>
</div>
</div>
<span className="bg-surface-container text-primary font-label-sm text-label-sm px-2 py-0.5 rounded">FBISE-PH11</span>
</div>
{/* Progress Track */}
<div className="flex flex-col gap-1.5 mt-1">
<div className="flex justify-between items-center font-label-sm text-label-sm">
<span className="text-on-surface-variant">Board Syllabus Milestones</span>
<span className="text-primary font-semibold">68% Finished</span>
</div>
<div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
<div className="h-full bg-secondary rounded-full" style={{}}></div>
</div>
</div>
<div className="grid grid-cols-2 gap-2 mt-1">
<button className="py-2.5 px-3 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-[16px]">menu_book</span>
          Read SLO Guide
        </button>
<button className="py-2.5 px-3 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center gap-1.5 shadow-sm">
<span className="material-symbols-outlined text-[16px]">play_lesson</span>
          Start Practice (12 Qs)
        </button>
</div>
</div>
{/* FBISE Examination & Roll Slip Card */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[22px]">assignment_turned_in</span>
<span className="font-label-lg text-label-lg text-on-surface">Annual Board Exam Clearance</span>
</div>
<span className="font-label-sm text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded">Part-I 2025</span>
</div>
<div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface">Roll Slip Verification</span>
<span className="font-body-sm text-body-sm text-secondary">Verified by Board Controller Office</span>
</div>
<button className="px-3 py-1.5 bg-surface-container text-on-surface font-label-sm text-label-sm rounded-lg flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">download</span>
          Slip PDF
        </button>
</div>
</div>
</div>
{/* STATE 1: ANDROID / CHROMIUM DOCKED BOTTOM BANNER (Resting just above shell bottom tab bar) */}
<div className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-2 transition-all duration-300 transform translate-y-0" id="android-banner">
<div className="max-w-md mx-auto bg-surface-container-lowest rounded-xl p-2.5 shadow-[0_-4px_16px_-2px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.06)] flex items-center justify-between gap-2.5">
{/* App Icon */}
<div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm">
<span className="material-symbols-outlined text-[20px]">local_library</span>
</div>
{/* Text Content */}
<div className="flex flex-col min-w-0 flex-1">
<div className="flex items-center gap-1.5">
<span className="font-label-md text-label-md text-on-surface truncate">Add EduSaas to Home Screen</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant truncate">Fast offline FBISE notes &amp; roll slips</p>
</div>
{/* CTA and Dismiss Actions */}
<div className="flex items-center gap-1 flex-shrink-0">
<button className="h-8 px-3 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center" >
          Install
        </button>
<button aria-label="Dismiss banner" className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" >
<span className="material-symbols-outlined text-[18px]">close</span>
</button>
</div>
</div>
</div>
{/* STATE 2: IPHONE / IOS SAFARI BOTTOM SHEET MODAL */}
<div className="fixed inset-0 z-50 transition-opacity duration-300 hidden" id="ios-sheet-wrapper">
{/* Semi-transparent Backdrop Scrim */}
<div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" ></div>
{/* Bottom Sheet Container */}
<div className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto bg-surface-container-lowest rounded-t-[28px] p-5 shadow-2xl flex flex-col gap-4 pb-safe animate-in slide-in-from-bottom duration-300">
{/* Drag Handle */}
<div className="w-10 h-1 bg-surface-variant rounded-full mx-auto -mt-1 mb-1"></div>
{/* Header with App Logo */}
<div className="flex items-start gap-3">
<div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md flex-shrink-0">
<span className="material-symbols-outlined text-[26px]">school</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">Install EduSaas on iPhone</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Install directly from Safari without opening the App Store.</p>
</div>
<button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors" >
<span className="material-symbols-outlined text-[18px]">close</span>
</button>
</div>
{/* Step-by-Step Instructions */}
<div className="bg-surface-container-low rounded-2xl p-3.5 flex flex-col gap-3">
{/* Step 1 */}
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-[18px]">ios_share</span>
</div>
<div className="flex-1 font-body-sm text-body-sm text-on-surface">
<span className="font-semibold text-primary">1. Tap Share:</span> Press the <span className="bg-surface-container px-1.5 py-0.5 rounded font-label-sm text-label-sm text-secondary">Share</span> button on Safari toolbar below.
          </div>
</div>
{/* Step 2 */}
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-[18px]">add_box</span>
</div>
<div className="flex-1 font-body-sm text-body-sm text-on-surface">
<span className="font-semibold text-primary">2. Select Action:</span> Scroll down and tap <span className="bg-surface-container px-1.5 py-0.5 rounded font-label-sm text-label-sm text-on-surface">"Add to Home Screen"</span>.
          </div>
</div>
{/* Step 3 */}
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0">
<span className="material-symbols-outlined text-[18px]">check_circle</span>
</div>
<div className="flex-1 font-body-sm text-body-sm text-on-surface">
<span className="font-semibold text-primary">3. Confirm:</span> Tap <span className="bg-primary text-on-primary px-1.5 py-0.5 rounded font-label-sm text-label-sm">Add</span> at top right corner to complete.
          </div>
</div>
</div>
{/* Realistic Safari Share Sheet Mini Preview */}
<div className="bg-surface-container rounded-xl p-3 flex flex-col gap-2">
<span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">touch_app</span>
          Interactive visual guide:
        </span>
{/* Mock Safari Action Row */}
<div className="bg-surface-container-lowest rounded-lg p-2.5 flex items-center justify-between shadow-sm">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-md bg-secondary-container text-on-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">add_box</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-medium">Add to Home Screen</span>
</div>
{/* Pointer cue */}
<div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm animate-pulse">
<span>Tap here</span>
<span className="material-symbols-outlined text-[18px]">ads_click</span>
</div>
</div>
{/* Mini Safari Bottom Bar Representation with Downward Arrow Hint */}
<div className="bg-surface-container-low rounded-lg py-1.5 px-6 flex items-center justify-between text-on-surface-variant opacity-85">
<span className="material-symbols-outlined text-[18px]">arrow_back_ios</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward_ios</span>
<div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-[18px]">ios_share</span>
</div>
<span className="material-symbols-outlined text-[18px]">menu_book</span>
<span className="material-symbols-outlined text-[18px]">filter_none</span>
</div>
</div>
{/* Dismiss Button & Offline Feature Note */}
<div className="flex flex-col gap-2 pt-1">
<button className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2" >
<span>Understood, Show Safari</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
<p className="font-body-sm text-body-sm text-center text-on-surface-variant">
          EduSaas runs in full-screen with offline syllabus caching on iOS.
        </p>
</div>
</div>
</div>
</div>
</main>
    </>
  );
}
