export function MobileSignInVerification() {
  return (
    <>
      {/* Original Title: EduSaas - Mobile Sign In & Verification */}
      <main className="flex-1 flex flex-col pt-16 pb-safe px-4 max-w-md mx-auto w-full">
{/* 1. FLOATING SMS NOTIFICATION TOAST */}
<div className="mt-2 mb-3 bg-white/95 backdrop-blur-md border border-border-subtle rounded-xl p-3 shadow-md transition-all duration-300 transform translate-y-0 flex items-start gap-3 relative" id="smsNotificationToast">
<div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
<span className="material-symbols-outlined text-[18px]">sms</span>
</div>
<div className="flex-1 min-w-0 pr-6">
<div className="flex items-center justify-between gap-1 mb-0.5">
<span className="text-[11px] font-bold tracking-wide uppercase text-primary flex items-center gap-1">
            SMS · EduSaas
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
</span>
<span className="text-[11px] text-text-secondary">now</span>
</div>
<p className="text-xs text-text-main font-medium leading-snug">
          Your sign-in code is <span className="font-bold text-[#1E3A5F] tracking-wide select-all bg-[#E8EEFF] px-1 py-0.5 rounded">482913</span>. It expires in 5 minutes.
        </p>
</div>
<button aria-label="Dismiss toast" className="absolute right-2.5 top-2.5 text-text-secondary hover:text-text-main p-1 rounded-md"  type="button">
<span className="material-symbols-outlined text-[16px]">close</span>
</button>
</div>
{/* 2. BRANDING & HEADER */}
<div className="text-center my-3">
{/* Centred navy app mark: Open textbook with play triangle audio indicator */}
<div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E3A5F] flex items-center justify-center shadow-sm text-white mb-2.5">
<svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
{/* Stylized open book with play wedge in spine/page */}
<path d="M12 4.5C10.2 3.5 7.8 3 5 3C3.3 3 2 3.4 2 3.4V18.8C2 18.8 3.3 18.5 5 18.5C7.5 18.5 10 19.3 12 20.5C14 19.3 16.5 18.5 19 18.5C20.7 18.5 22 18.8 22 18.8V3.4C22 3.4 20.7 3 19 3C16.2 3 13.8 3.5 12 4.5ZM11 17.5C9.3 16.8 7.3 16.5 5 16.5C4.2 16.5 3.5 16.6 3.5 16.6V5C4 4.9 4.5 4.8 5 4.8C7.3 4.8 9.4 5.2 11 6.1V17.5ZM20.5 16.6C20.5 16.6 19.8 16.5 19 16.5C16.7 16.5 14.7 16.8 13 17.5V6.1C14.6 5.2 16.7 4.8 19 4.8C19.5 4.8 20 4.9 20.5 5V16.6Z" opacity="0.95"></path>
<path d="M14.5 11.2L17.5 13L14.5 14.8V11.2Z" fill="#89F2E3"></path>
</svg>
</div>
<div className="inline-flex items-center gap-1.5 justify-center">
<span className="text-base font-bold tracking-tight text-primary">EduSaas</span>
<span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">demo</span>
</div>
<h1 className="text-[22px] font-bold text-text-main tracking-tight mt-1 leading-snug">Sign in</h1>
<p className="text-[13px] text-text-secondary max-w-xs mx-auto mt-0.5 leading-normal">
        For students, teachers and parents registered by your college.
      </p>
</div>
{/* 3. STEP 1: MOBILE NUMBER INPUT CARD */}
<div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm mb-3 transition-all duration-300" id="step1Card">
<div className="flex items-center justify-between mb-2">
<label className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary" htmlFor="phoneInput">
          Mobile number
        </label>
<span className="text-[11px] text-text-secondary">Pakistan</span>
</div>
<div className="flex items-center gap-2 mb-3">
{/* Fixed +92 prefix badge */}
<div className="h-12 px-3 rounded-[10px] bg-surface border border-border-subtle flex items-center gap-1.5 flex-shrink-0 font-medium text-text-main">
<span className="text-base leading-none">🇵🇰</span>
<span className="font-semibold text-sm text-[#1E3A5F]">+92</span>
</div>
{/* Phone Input */}
<input className="flex-1 h-12 px-3.5 rounded-[10px] bg-white border border-border-subtle text-text-main placeholder:text-gray-400 font-medium text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all" id="phoneInput" inputMode="numeric" maxLength={10} placeholder="300 1234567" type="tel" value="3992220001"/>
</div>
{/* Primary Action Button: Send code */}
<button className="w-full h-12 rounded-[10px] bg-[#1E3A5F] hover:bg-primary-hover active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"  type="button">
<span>Send code</span>
<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
{/* Info Banner with Shield Icon below button inside card structure */}
<div className="mt-3.5 pt-3 border-t border-border-subtle flex items-start gap-2 text-text-secondary">
<span className="material-symbols-outlined text-[17px] text-[#006A61] flex-shrink-0 mt-0.5">verified_user</span>
<p className="text-[12px] leading-snug">
          Only numbers registered by the college can sign in. Each account sees only its own class, child or record.
        </p>
</div>
</div>
{/* 4. STEP 2: VERIFICATION / OTP CARD */}
<div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm mb-3 transition-all duration-300" id="step2Card">
<div className="flex items-start justify-between gap-2 mb-3">
<div className="text-xs text-text-main font-medium leading-relaxed">
          We sent a 6-digit code to <span className="font-semibold text-primary" id="displayPhone">+92 399 2220001</span>.
          <button className="text-secondary-teal font-semibold underline underline-offset-2 ml-1 hover:opacity-80"  type="button">Change</button>
</div>
<span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">Step 2 of 2</span>
</div>
{/* 6-digit code boxes */}
<div className="grid grid-cols-6 gap-2 my-2" id="otpContainer">
<div className="h-12 rounded-lg border-2 border-red-300 bg-red-50/50 flex items-center justify-center text-lg font-bold text-text-main">4</div>
<div className="h-12 rounded-lg border-2 border-red-300 bg-red-50/50 flex items-center justify-center text-lg font-bold text-text-main">8</div>
<div className="h-12 rounded-lg border-2 border-red-300 bg-red-50/50 flex items-center justify-center text-lg font-bold text-text-main">2</div>
<div className="h-12 rounded-lg border-2 border-red-300 bg-red-50/50 flex items-center justify-center text-lg font-bold text-text-main">9</div>
<div className="h-12 rounded-lg border-2 border-red-300 bg-red-50/50 flex items-center justify-center text-lg font-bold text-text-main">1</div>
<div className="h-12 rounded-lg border-2 border-red-300 bg-red-50/50 flex items-center justify-center text-lg font-bold text-text-main">0</div>
</div>
{/* Error State Banner / Message */}
<div className="mt-2.5 p-2 rounded-lg bg-error-bg border border-red-200 flex items-center gap-1.5 text-error-text">
<span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
<span className="text-xs font-semibold">That code is wrong. 4 tries left.</span>
</div>
{/* Timer / Action button */}
<div className="mt-3.5 flex items-center justify-between text-xs text-text-secondary pt-1">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[15px]">schedule</span>
          Resend code in <strong className="text-text-main font-semibold">30s</strong>
</span>
<button className="font-semibold text-secondary-teal hover:underline min-h-[36px] flex items-center"  type="button">
          Autofill 482913
        </button>
</div>
<button className="w-full h-11 mt-3 rounded-[10px] bg-[#1E3A5F] hover:bg-primary-hover active:scale-[0.99] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center shadow-sm" type="button">
        Verify &amp; Enter Portal
      </button>
</div>
{/* 5. INTERACTIVE DEMO ACCOUNTS (FOR PRESENTERS) */}
<div className="bg-surface-card rounded-xl border border-border-subtle shadow-sm mb-4 overflow-hidden">
{/* Accordion Header */}
<button aria-expanded="true" className="w-full p-3.5 flex items-center justify-between bg-surface/50 hover:bg-surface border-b border-border-subtle transition-colors min-h-[48px]"  type="button">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-[#1E3A5F]">group</span>
<span className="text-xs font-bold uppercase tracking-wider text-text-main">Demo accounts (for presenters)</span>
</div>
<div className="flex items-center gap-1 text-text-secondary">
<span className="text-[11px] font-medium hidden sm:inline">4 available</span>
<span className="material-symbols-outlined text-[18px] transition-transform duration-200 rotate-180" id="demoExpandIcon">expand_more</span>
</div>
</button>
{/* Accordion Body: List grouped by role */}
<div className="p-2 space-y-1.5 transition-all" id="demoAccountsList">
<p className="text-[11px] text-text-secondary px-2 pt-1 pb-0.5">
          Tapping a row fills the phone input and collapses the list.
        </p>
{/* Role: Student */}
<button className="w-full p-2.5 rounded-lg border border-border-subtle hover:border-[#1E3A5F] hover:bg-[#F9FAFC] active:bg-[#F0F4FA] flex items-center justify-between text-left transition-all min-h-[48px]"  type="button">
<div className="flex items-center gap-2.5 min-w-0">
<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
              🟩 Student
            </span>
<div className="min-w-0 truncate">
<span className="text-xs font-semibold text-text-main">Ali Raza</span>
<span className="text-xs text-text-secondary block">Roll 11A-01 · 11th Pre-Medical</span>
</div>
</div>
<span className="text-xs font-mono font-medium text-text-secondary flex-shrink-0 ml-2">399 2220001</span>
</button>
{/* Role: Teacher */}
<button className="w-full p-2.5 rounded-lg border border-border-subtle hover:border-[#1E3A5F] hover:bg-[#F9FAFC] active:bg-[#F0F4FA] flex items-center justify-between text-left transition-all min-h-[48px]"  type="button">
<div className="flex items-center gap-2.5 min-w-0">
<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex-shrink-0">
              🟦 Teacher
            </span>
<div className="min-w-0 truncate">
<span className="text-xs font-semibold text-text-main">Mr. Tariq Mehmood</span>
<span className="text-xs text-text-secondary block">Dept. of Physics · Faculty</span>
</div>
</div>
<span className="text-xs font-mono font-medium text-text-secondary flex-shrink-0 ml-2">399 1110001</span>
</button>
{/* Role: Parent */}
<button className="w-full p-2.5 rounded-lg border border-border-subtle hover:border-[#1E3A5F] hover:bg-[#F9FAFC] active:bg-[#F0F4FA] flex items-center justify-between text-left transition-all min-h-[48px]"  type="button">
<div className="flex items-center gap-2.5 min-w-0">
<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex-shrink-0">
              🟨 Parent
            </span>
<div className="min-w-0 truncate">
<span className="text-xs font-semibold text-text-main">Mrs. Fatima Raza</span>
<span className="text-xs text-text-secondary block">Parent of Ali Raza (11A)</span>
</div>
</div>
<span className="text-xs font-mono font-medium text-text-secondary flex-shrink-0 ml-2">399 3330001</span>
</button>
{/* Role: College Admin */}
<button className="w-full p-2.5 rounded-lg border border-border-subtle hover:border-[#1E3A5F] hover:bg-[#F9FAFC] active:bg-[#F0F4FA] flex items-center justify-between text-left transition-all min-h-[48px]"  type="button">
<div className="flex items-center gap-2.5 min-w-0">
<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex-shrink-0">
              🟪 Admin
            </span>
<div className="min-w-0 truncate">
<span className="text-xs font-semibold text-text-main">Ms. Sana Javed</span>
<span className="text-xs text-text-secondary block">College Registrar Directorate</span>
</div>
</div>
<span className="text-xs font-mono font-medium text-text-secondary flex-shrink-0 ml-2">399 4440001</span>
</button>
</div>
</div>
{/* Institutional Footer / Helpline link */}
<div className="text-center py-2 text-xs text-text-secondary space-y-1">
<p>Authorized Institutional Portal · Affiliated with Federal Board (FBISE)</p>
<div className="flex items-center justify-center gap-3 text-secondary-teal font-medium">
<a className="hover:underline" href="#helpdesk">Registrar Helpdesk</a>
<span>·</span>
<a className="hover:underline" href="#faqs">FBISE Portal Clearance</a>
</div>
</div>
</main>
    </>
  );
}
