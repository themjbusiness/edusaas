export function TeacherBottomSheets() {
  return (
    <>
      {/* Original Title: EduSaas - Teacher Bottom Sheets */}
      <main className="flex-1 px-4 pt-4 pb-24 opacity-35 filter blur-[1px] pointer-events-none select-none">
    <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-brand-teal">Morning Session</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">6 Enrolled</span>
      </div>
      <h2 className="text-[20px] font-bold text-brand-dark">11th Pre-Medical A</h2>
      <p className="text-[13px] text-brand-muted">Chapter 1: Derived Units in Terms of Base Units</p>
    </div>

    {/* Roster preview items */}
    <div className="space-y-2">
      <div className="p-3 bg-white rounded-xl border border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 text-brand-danger font-bold text-[12px] flex items-center justify-center">01</div>
          <div>
            <p className="font-bold text-[14px] text-brand-dark">Ali Raza</p>
            <p className="text-[11px] text-brand-muted">Absent Thu, Oct 1 · Best 3/5</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-brand-dangerBg text-brand-danger text-[11px] font-bold">Pending</span>
      </div>
      <div className="p-3 bg-white rounded-xl border border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-card text-brand-navy font-bold text-[12px] flex items-center justify-center">02</div>
          <div>
            <p className="font-bold text-[14px] text-brand-dark">Imran Khan</p>
            <p className="text-[11px] text-brand-muted">Cleared 5/5</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">Present</span>
      </div>
    </div>
  </main>
    </>
  );
}
