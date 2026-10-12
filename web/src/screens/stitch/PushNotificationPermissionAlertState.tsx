export function PushNotificationPermissionAlertState() {
  return (
    <>
      {/* Original Title: EduSaas - Push Notification Permission & Alert State */}
      <main className="flex flex-col relative w-full pt-16 pb-20 bg-surface min-h-screen"><div className="flex flex-col w-full relative">
{/* Interactive State Switcher Control */}
<section className="px-margin-mobile py-space-sm bg-surface-container-low flex flex-col gap-space-xs sticky top-0 z-40 shadow-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[15px] text-secondary">tune</span>
        Interactive Flow Preview
      </span>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium">FBISE Mobile Portal</span>
</div>
<div className="grid grid-cols-2 gap-space-xs p-1 bg-surface-container-highest rounded-xl">
<button className="py-2 px-space-xs rounded-lg font-label-md text-label-md text-center transition-all bg-primary-container text-surface shadow-sm font-semibold flex items-center justify-center gap-1" id="btn-state-1" >
<span className="material-symbols-outlined text-[16px]">notifications_active</span>
<span>1: Permission Sheet</span>
</button>
<button className="py-2 px-space-xs rounded-lg font-label-md text-label-md text-center transition-all text-on-surface-variant hover:text-on-surface font-medium flex items-center justify-center gap-1" id="btn-state-2" >
<span className="material-symbols-outlined text-[16px]">check_circle</span>
<span>2: Alerts On & Banner</span>
</button>
</div>
</section>
{/* Main Parent Dashboard Underlying Canvas */}
<div className="flex flex-col w-full px-margin-mobile pt-space-md pb-space-xl gap-space-md relative">
{/* STATE 2 DYNAMIC BANNER: Incoming Real-time Push Notification Simulation */}
<aside className="hidden flex-col gap-space-xs p-space-md rounded-xl bg-primary text-on-primary shadow-xl animate-bounce-short" id="simulated-push-card">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-on-secondary">
<span className="material-symbols-outlined text-[14px]">school</span>
</div>
<span className="font-label-md text-label-md font-semibold text-primary-fixed">EduSaas FBISE</span>
<span className="font-label-sm text-label-sm text-primary-fixed-dim">• Just now</span>
</div>
<button aria-label="Dismiss alert" className="text-primary-fixed-dim hover:text-on-primary min-w-[28px] min-h-[28px] flex items-center justify-center" >
<span className="material-symbols-outlined text-[16px]">close</span>
</button>
</div>
<div className="flex flex-col pl-7">
<span className="font-label-lg text-label-lg font-semibold text-surface">Ali Raza passed Physics 1.2 Quiz (5/5) 🎉</span>
<span className="font-body-sm text-body-sm text-primary-fixed-dim">All 5 derived units questions answered correctly in Class Section 11-A.</span>
</div>
</aside>
{/* Student FBISE Profile Badge Card */}
<article className="flex flex-col p-space-md bg-surface-container-lowest rounded-xl shadow-sm gap-space-sm">
<div className="flex items-start justify-between">
<div className="flex gap-space-sm items-center">
<div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden relative shrink-0">
<img className="w-full h-full object-cover" data-alt="High quality academic portrait photograph of an 11th grade Pakistani male student Ali Raza wearing Margalla Heights College navy blazer with federal board necktie against neutral classroom background, soft daytime lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ7FlQQONEg6Rc698nLxg5m2afpMEytYTAKWLevCbqfNW69djNJUqOvjCzMPeEFLC-aRmXNsEHHDLYCnbZuDIwRjJCTaJESbMcQ7iVk6_yVkTWZPnMU0qse10RpNhtz0h8LsOV_2F15a8guI03kh2zUS-dQo-D4-4O8OQVBDCwDsWEtutKsaLLs7Nm6F5MiKUjJsfZp7XJOBwVI1PIM_WffCh8jUio0c8G7R--94RbH0asjTGnUN8vTQ"/>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Ali Raza</span>
<span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">11A-01</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">HSSC Part I • Pre-Medical Group</span>
</div>
</div>
<span className="font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold">Active Enrolled</span>
</div>
<div className="grid grid-cols-3 gap-space-xs pt-space-xs">
<div className="flex flex-col p-space-xs bg-surface-container-low rounded-lg text-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Attendance</span>
<span className="font-label-lg text-label-lg text-secondary font-bold">96.4%</span>
</div>
<div className="flex flex-col p-space-xs bg-surface-container-low rounded-lg text-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Term GPA</span>
<span className="font-label-lg text-label-lg text-primary font-bold">3.92</span>
</div>
<div className="flex flex-col p-space-xs bg-surface-container-low rounded-lg text-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">FBISE Status</span>
<span className="font-label-lg text-label-lg text-on-surface font-semibold">Verified</span>
</div>
</div>
</article>
{/* Notification Status Widget on Home */}
<div className="flex flex-col" id="home-notification-widget">
{/* Default Inactive / Setup Card (Visible in State 1 behind sheet) */}
<article className="flex flex-col p-space-md bg-surface-container-lowest rounded-xl shadow-sm gap-space-sm" id="widget-state-unregistered">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant tracking-wider">Device Push Channel</span>
</div>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-semibold">Disabled</span>
</div>
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-on-surface-variant">
<span className="material-symbols-outlined text-[22px]">notifications_off</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md font-semibold text-on-surface">Live alerts are turned off</span>
<span className="font-body-sm text-body-sm text-on-surface-variant truncate">Enable instant notices for attendance and quizzes</span>
</div>
</div>
<button className="mt-space-xs w-full min-h-[44px] py-2 px-space-md rounded-xl bg-surface-container-high text-primary font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-space-xs" >
<span className="material-symbols-outlined text-[18px]">add_alert</span>
          Configure Browser Notifications
        </button>
</article>
{/* Active Alerts Card (State 2 Target View) */}
<article className="hidden flex-col p-space-md bg-surface-container-lowest rounded-xl shadow-sm gap-space-sm" id="widget-state-registered">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">Push Notifications</span>
<span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            Active on this device
          </span>
</div>
<div className="flex items-center gap-space-sm">
<div className="w-11 h-11 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0 shadow-sm">
<span className="material-symbols-outlined text-[24px]">verified</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Alerts on</span>
<span className="material-symbols-outlined text-secondary text-[20px]" style={{}}>check_circle</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Direct mobile push stream bound to Mrs. Fatima Raza</span>
</div>
</div>
<div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-1">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Subscribed Broadcast Feed:</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Receiving immediate SMS-free absence calls, quiz pass milestones, and clearance slips for Ali Raza.</span>
</div>
<div className="flex items-center justify-between pt-space-xs">
<button className="font-label-sm text-label-sm text-outline hover:text-error transition-colors flex items-center gap-1 min-h-[36px]" >
<span className="material-symbols-outlined text-[15px]">do_not_disturb_on</span>
            Turn off or manage in browser settings
          </button>
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono">ID: FBISE-PRNT-4821</span>
</div>
</article>
</div>
{/* College Announcements & Attendance Digest Preview */}
<section className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">Today's Class Schedule & Activity</span>
<span className="font-label-sm text-label-sm text-primary font-medium">May 19, 2025</span>
</div>
<div className="flex flex-col p-space-md bg-surface-container-lowest rounded-xl shadow-sm gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">science</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-semibold text-on-surface">Biology Lab Session</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Prof. Tariq Mahmood • Lab 04</span>
</div>
</div>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium">Present 08:15 AM</span>
</div>
<div className="flex items-center justify-between pt-space-xs">
<div className="flex items-center gap-space-sm">
<div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">calculate</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-semibold text-on-surface">Physics 1.2 Surprise Quiz</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Classroom 2-B • Units and Measurements</span>
</div>
</div>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">Scored 5/5</span>
</div>
</div>
</section>
{/* Regulatory Compliance Notice Footer Card */}
<footer className="flex items-center gap-space-sm p-space-md bg-surface-container-high rounded-xl text-on-surface-variant">
<span className="material-symbols-outlined text-[20px] text-primary shrink-0">verified_user</span>
<p className="font-body-sm text-body-sm">
        FBISE Regulatory Notice: Official push records are archived alongside SMS records for regulatory verification under Section 4-B of Islamabad Intermediate Directorate.
      </p>
</footer>
</div>
{/* ========================================================== */}
{/* STATE 1 INTERACTIVE OVERLAY: BACKDROP + BROWSER PROMPT + BOTTOM SHEET */}
{/* ========================================================== */}
<div className="absolute inset-0 z-50 flex flex-col justify-between overflow-hidden bg-on-surface/40 backdrop-blur-[2px]" id="state-1-modal-container">
{/* Native Browser Permission Prompt (Top Banner Simulation) */}
<aside className="w-full px-margin-mobile pt-space-xs animate-fade-in">
<div className="w-full bg-surface-container-lowest rounded-xl shadow-xl p-space-sm flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[15px]">lock</span>
</div>
<span className="font-label-md text-label-md font-semibold text-on-surface">edusaas.pk</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">wants to:</span>
</div>
<span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono">Browser Native Reference</span>
</div>
<div className="flex items-center gap-space-xs pl-7">
<span className="material-symbols-outlined text-[18px] text-primary">notifications</span>
<span className="font-body-md text-body-md text-on-surface font-medium">Show notifications</span>
</div>
<div className="flex items-center justify-end gap-space-sm pt-space-xs">
<button className="min-h-[40px] px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors" >
            Block
          </button>
<button className="min-h-[40px] px-space-md py-1.5 rounded-lg bg-primary-container text-surface font-label-md text-label-md font-semibold hover:bg-primary transition-colors shadow-sm" >
            Allow
          </button>
</div>
</div>
</aside>
{/* Tap-to-dismiss spacer */}
<div className="flex-grow w-full cursor-pointer" ></div>
{/* Bottom Sheet Container */}
<section className="w-full bg-surface-container-lowest rounded-t-3xl shadow-2xl p-margin-mobile flex flex-col gap-space-md pb-space-lg animate-slide-up">
{/* Drag Handle */}
<div className="w-full flex justify-center py-0.5">
<div className="w-12 h-1.5 bg-outline-variant/60 rounded-full"></div>
</div>
{/* Icon & Header with notification badge */}
<div className="flex flex-col items-center text-center gap-space-sm pt-space-xs">
<div className="relative">
<div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary-container shadow-inner">
<span className="material-symbols-outlined text-[36px]" style={{}}>notifications_active</span>
</div>
<span className="absolute -top-1 -right-1 flex h-4 w-4">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
<span className="relative inline-flex rounded-full h-4 w-4 bg-secondary"></span>
</span>
</div>
<div className="flex flex-col gap-1 px-space-sm">
<span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Get alerts on this phone</span>
<p className="font-body-md text-body-md text-on-surface-variant">
            You'll get an instant notification when your child is marked absent or cleared, and when they pass a quiz. You can turn this off any time in your browser settings.
          </p>
</div>
</div>
{/* Notification Benefit Checklist Cards */}
<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-2xl">
<div className="flex items-center gap-space-sm p-space-xs">
<div className="w-8 h-8 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[18px]">emergency_home</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md font-semibold text-on-surface">Real-time absence alerts</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Immediate ping if Ali is not marked in morning roll call</span>
</div>
</div>
<div className="flex items-center gap-space-sm p-space-xs">
<div className="w-8 h-8 rounded-xl bg-surface-container-highest flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined text-[18px]">verified</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md font-semibold text-on-surface">Daily subject quiz passes</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Instant score alerts when quizzes are evaluated</span>
</div>
</div>
<div className="flex items-center gap-space-sm p-space-xs">
<div className="w-8 h-8 rounded-xl bg-surface-container-highest flex items-center justify-center text-tertiary-container shrink-0">
<span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md font-semibold text-on-surface">Teacher clearance updates</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">FBISE practical exam clearances and hall slips</span>
</div>
</div>
</div>
{/* Sheet Actions */}
<div className="flex flex-col gap-space-xs pt-space-xs">
<button className="w-full min-h-[48px] py-3 px-space-md rounded-xl bg-primary-container text-surface font-label-lg text-label-lg font-semibold hover:bg-primary transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-space-xs" >
<span className="material-symbols-outlined text-[20px]">notifications</span>
          Allow notifications
        </button>
<button className="w-full min-h-[44px] py-2 px-space-md rounded-xl text-on-surface-variant hover:text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center justify-center" >
          Not now
        </button>
</div>
{/* Micro Privacy Seal */}
<div className="flex items-center justify-center gap-1.5 text-center text-outline text-[11px]">
<span className="material-symbols-outlined text-[14px]">shield</span>
<span>No spam. Only essential student welfare alerts sent via SSL.</span>
</div>
</section>
</div>
</div>
</main>
    </>
  );
}
