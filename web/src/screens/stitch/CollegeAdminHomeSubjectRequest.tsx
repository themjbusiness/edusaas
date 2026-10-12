export function CollegeAdminHomeSubjectRequest() {
  return (
    <>
      {/* Original Title: EduSaas - College Admin Home & Subject Request */}
      <main className="flex flex-col relative w-full pt-16 pb-20 px-margin-mobile bg-surface min-h-screen"><div className="flex flex-col w-full pb-6 space-y-space-md">
{/* Institutional Welcome Banner */}
<section className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
<div className="flex items-center justify-between">
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary">
<span className="material-symbols-outlined text-[14px]">verified</span>
<span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">FBISE Affiliated Institution</span>
</div>
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container">
<span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
<span className="font-label-sm text-label-sm font-medium">Session 2024-25</span>
</div>
</div>
<div className="flex items-center gap-3 pt-1">
<div className="relative shrink-0">
<div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm font-headline-sm text-headline-sm">
          SJ
        </div>
<span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-surface-container-low"></span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-1.5">
<span className="font-headline-sm text-headline-sm text-primary truncate">Ms. Sana Javed</span>
<span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-[10px]">ADMIN</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant truncate">
          Margalla Heights College (Demo) · Islamabad
        </p>
</div>
</div>
</section>
{/* Quick Stats Grid (2x2) */}
<section className="grid grid-cols-2 gap-space-sm">
{/* Stat 1: Students */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
<div className="flex items-center justify-between">
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">school</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">HSSC-I</span>
</div>
<div className="flex flex-col">
<span className="font-headline-lg text-headline-lg text-primary leading-none">8</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Students enrolled</span>
</div>
</div>
{/* Stat 2: Teachers */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
<div className="flex items-center justify-between">
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">co_present</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Verified</span>
</div>
<div className="flex flex-col">
<span className="font-headline-lg text-headline-lg text-primary leading-none">3</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Active faculty</span>
</div>
</div>
{/* Stat 3: Parents */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
<div className="flex items-center justify-between">
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">family_restroom</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">SMS Ready</span>
</div>
<div className="flex flex-col">
<span className="font-headline-lg text-headline-lg text-primary leading-none">8</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Linked contacts</span>
</div>
</div>
{/* Stat 4: Classes */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
<div className="flex items-center justify-between">
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">domain</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">FBISE</span>
</div>
<div className="flex flex-col">
<span className="font-headline-lg text-headline-lg text-primary leading-none">2</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-1">11th Pre-Med &amp; 9th Sci</span>
</div>
</div>
</section>
{/* Section 1: Subject Requests */}
<section className="flex flex-col space-y-space-xs">
<div className="flex items-center justify-between px-0.5">
<div className="flex items-center gap-2">
<h2 className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant font-bold">Subject Requests</h2>
<span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold" id="requestsCountBadge">1 waiting</span>
</div>
<button className="font-label-sm text-label-sm text-secondary font-semibold hover:underline" id="toggleDemoStateBtn">
        Toggle state demo
      </button>
</div>
{/* Request Card Container */}
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col space-y-space-md" id="requestCard">
{/* Card Head: Icon + Details */}
<div className="flex items-start gap-space-sm">
<div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
<span className="font-headline-sm text-headline-sm font-bold">Σ</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<div className="flex items-center justify-between gap-1">
<h3 className="font-label-lg text-label-lg text-primary font-semibold truncate">Mathematics</h3>
<span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold whitespace-nowrap" id="subjectStatusPill">
              Pending
            </span>
</div>
<span className="font-body-md text-body-md font-medium text-on-surface">11th Pre-Medical A</span>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Asked by <strong className="font-semibold text-on-surface">Mr. Tariq Mehmood</strong> · today 11:42
          </p>
</div>
</div>
{/* Informational Hint Strip */}
<div className="p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2 text-on-surface-variant" id="pendingHintStrip">
<span className="material-symbols-outlined text-[18px] text-outline">info</span>
<span className="font-body-sm text-body-sm">No lessons created yet (Curriculum verification pending).</span>
</div>
{/* Rejection Result Strip (Visible only when declined) */}
<div className="hidden p-3 rounded-lg bg-error-container/60 flex flex-col gap-1" id="declinedReasonStrip">
<div className="flex items-center gap-1.5 text-on-error-container">
<span className="material-symbols-outlined text-[18px] text-error">cancel</span>
<span className="font-label-md text-label-md font-bold uppercase tracking-wider">Request Declined</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface" id="declinedReasonText">
          Mathematics is not in the Pre-Medical core curriculum for this term. Please assign to Pre-Engineering section.
        </p>
</div>
{/* Action Buttons Row */}
<div className="flex items-center gap-space-sm pt-1" id="requestActionsRow">
<button className="flex-1 min-h-[44px] px-3 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high active:bg-surface-variant transition-colors flex items-center justify-center gap-1.5" id="openDeclineModalBtn">
<span className="material-symbols-outlined text-[18px]">close</span>
          Decline…
        </button>
<button className="flex-1 min-h-[44px] px-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm" id="approveSubjectBtn">
<span className="material-symbols-outlined text-[18px]">check</span>
          Approve
        </button>
</div>
{/* Reopen Action (when declined) */}
<div className="hidden flex items-center justify-between pt-1" id="revertActionRow">
<span className="font-body-sm text-body-sm text-on-surface-variant">Decision registered with faculty</span>
<button className="font-label-sm text-label-sm text-secondary font-semibold hover:underline flex items-center gap-1" id="undoDeclineBtn">
<span className="material-symbols-outlined text-[16px]">undo</span>
          Re-open request
        </button>
</div>
</div>
</section>
{/* Section 2: Recent Activity */}
<section className="flex flex-col space-y-space-xs">
<div className="flex items-center justify-between px-0.5">
<h2 className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant font-bold">Recent Activity</h2>
<a className="font-label-sm text-label-sm text-secondary font-semibold hover:underline flex items-center gap-0.5" href="#">
        See all
        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</a>
</div>
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-sm flex flex-col space-y-space-xs">
{/* Activity 1 */}
<div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
<div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[20px]">upload_file</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<p className="font-body-md text-body-md text-on-surface leading-snug">
<strong className="font-semibold text-primary">Imported students:</strong> 2 students, 1 parent
          </p>
<div className="flex items-center gap-2 mt-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Ms. Sana Javed</span>
<span className="w-1 h-1 rounded-full bg-outline"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Today 11:51</span>
</div>
</div>
</div>
{/* Activity 2 */}
<div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
<div className="w-9 h-9 rounded-lg bg-error-container/50 flex items-center justify-center text-error shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[20px]">person_off</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<p className="font-body-md text-body-md text-on-surface leading-snug">
<strong className="font-semibold text-primary">Imran Ali:</strong> suspended
          </p>
<span className="font-body-sm text-body-sm text-on-surface-variant">Moved to another college (Transfer clearance)</span>
<div className="flex items-center gap-2 mt-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Registrar Office</span>
<span className="w-1 h-1 rounded-full bg-outline"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Yesterday 4:15 PM</span>
</div>
</div>
</div>
{/* Activity 3 */}
<div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
<div className="w-9 h-9 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[20px]">rule</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<p className="font-body-md text-body-md text-on-surface leading-snug">
<strong className="font-semibold text-primary">Attendance threshold alert:</strong> 11th Pre-Medical A
          </p>
<span className="font-body-sm text-body-sm text-on-surface-variant">Recorded 80% daily attendance (Compliant)</span>
<div className="flex items-center gap-2 mt-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Biometric Sync</span>
<span className="w-1 h-1 rounded-full bg-outline"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Yesterday 2:30 PM</span>
</div>
</div>
</div>
</div>
</section>
{/* Interactive Decline Subject Bottom Sheet Modal */}
<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs hidden transition-opacity flex items-end justify-center" id="declineModalBackdrop">
<div className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl shadow-xl flex flex-col p-space-md space-y-space-md transform translate-y-full transition-transform duration-300" id="declineBottomSheet">
{/* Sheet Handle */}
<div className="w-12 h-1 rounded-full bg-outline-variant self-center -mt-1 mb-1"></div>
{/* Sheet Header */}
<div className="flex items-start justify-between">
<div className="flex flex-col pr-2">
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">
            Decline Mathematics for 11th Pre-Medical A
          </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Mr. Tariq Mehmood will see this reason in the faculty portal.
          </p>
</div>
<button className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shrink-0" id="closeDeclineModalBtn">
<span className="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
{/* Decline Form Field */}
<div className="flex flex-col space-y-1.5">
<label className="font-label-md text-label-md text-primary font-semibold flex items-center justify-between" htmlFor="declineReasonInput">
<span>Reason for refusal <span className="text-error">*</span></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">FBISE Regulation Code</span>
</label>
<textarea className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all resize-none" id="declineReasonInput" placeholder="e.g. Pre-Medical section does not take elective Mathematics, please consult Dean of Sciences..." rows={3}></textarea>
<p className="font-label-sm text-label-sm text-on-surface-variant">Clear rationale prevents curriculum audit conflicts.</p>
</div>
{/* Action Buttons */}
<div className="flex items-center justify-end gap-space-sm pt-2">
<button className="min-h-[44px] px-4 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" id="cancelDeclineBtn">
          Cancel
        </button>
<button className="min-h-[44px] px-5 rounded-xl bg-error text-on-error font-label-lg text-label-lg hover:bg-on-error-container active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm" id="confirmDeclineBtn">
<span className="material-symbols-outlined text-[18px]">block</span>
          Decline request
        </button>
</div>
</div>
</div>
</div>
</main>
    </>
  );
}
