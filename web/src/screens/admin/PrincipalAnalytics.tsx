import { useState } from 'react';
import { get, getToken, type ClassBreakdownRow, type PrincipalOverview, type TeacherBreakdownRow } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Skeleton, useToast } from '../../ui';

export function PrincipalAnalytics() {
  const toast = useToast();
  const [days, setDays] = useState<number>(30);
  const [breakdownBy, setBreakdownBy] = useState<'class' | 'teacher'>('class');
  const [exporting, setExporting] = useState(false);

  const { data: overview, error: ovError, reload: reloadOv } = useLoad(
    () => get<PrincipalOverview>(`principal/overview?days=${days}`),
    [days]
  );

  const { data: breakdown, error: bdError, reload: reloadBd } = useLoad(
    () => get<ClassBreakdownRow[] | TeacherBreakdownRow[]>(`principal/breakdown?days=${days}&by=${breakdownBy}`),
    [days, breakdownBy]
  );

  const error = ovError || bdError;
  const reload = () => { reloadOv(); reloadBd(); };

  async function handleExportCsv() {
    setExporting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/principal/export?days=${days}&format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clearance-report-${days}d.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast('CSV Report downloaded successfully.');
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin-mobile">
        <ErrorCard error={error} onRetry={reload} />
      </main>
    );
  }

  if (!overview || !breakdown) {
    return (
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin-mobile">
        <div className="max-w-6xl mx-auto w-full py-6">
          <Skeleton rows={6} />
        </div>
      </main>
    );
  }

  const classRows = breakdownBy === 'class' ? (breakdown as ClassBreakdownRow[]) : [];
  const teacherRows = breakdownBy === 'teacher' ? (breakdown as TeacherBreakdownRow[]) : [];

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin-mobile min-h-screen">
      <div className="max-w-6xl mx-auto w-full py-4 flex flex-col gap-6">

        {/* Header & Date Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
          <div>
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-[12px] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px] text-secondary">monitoring</span>
              <span>Executive Analytics & ROI</span>
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-[26px] md:text-[32px] text-primary font-bold tracking-tight mt-1">
              {overview.college}
            </h1>
            <p className="font-body-sm text-[14px] text-on-surface-variant mt-0.5">
              Board-readiness metrics, catch-up compliance, and student clearance velocity.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Range chips */}
            <div className="flex items-center bg-surface-container-high rounded-xl p-1 gap-1">
              {[
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: '90 Days (Term)', val: 90 },
              ].map((c) => (
                <button
                  key={c.val}
                  onClick={() => setDays(c.val)}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-[13px] font-bold transition-all ${
                    days === c.val
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-[0.98] text-primary border border-outline-variant/40 font-label-md text-[13px] font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Clearance Rate */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                Clearance Rate
              </span>
              <div className="w-8 h-8 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-[32px] font-bold text-primary tracking-tight">
                  {overview.clearanceRate}%
                </span>
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                  overview.clearanceRate >= 80
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {overview.clearanceRate >= 80 ? 'Target Met (≥80%)' : 'Needs Focus (<80%)'}
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                {overview.clearedCount} of {overview.totalAbsences} absences cleared
              </p>
            </div>
          </div>

          {/* Card 2: Total Absences */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                Total Absences
              </span>
              <div className="w-8 h-8 rounded-full bg-error-container/40 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[18px]">person_off</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-headline-lg text-[32px] font-bold text-primary tracking-tight">
                {overview.totalAbsences}
              </span>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                Recorded over last {days} days
              </p>
            </div>
          </div>

          {/* Card 3: Median Time to Clear */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                Catch-up Velocity
              </span>
              <div className="w-8 h-8 rounded-full bg-primary-container/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">timer</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-[32px] font-bold text-primary tracking-tight">
                  {overview.medianHoursToClear != null ? `${overview.medianHoursToClear}h` : '—'}
                </span>
                {overview.medianHoursToClear != null && (
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${
                    overview.medianHoursToClear <= 24
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {overview.medianHoursToClear <= 24 ? '≤24h SLA' : '>24h Latency'}
                  </span>
                )}
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                Median hours from absence to clearance
              </p>
            </div>
          </div>

          {/* Card 4: At-Risk Students */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                At-Risk Students
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-700">
                <span className="material-symbols-outlined text-[18px]">warning</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="font-headline-lg text-[32px] font-bold text-rose-700 dark:text-rose-400 tracking-tight">
                {overview.atRiskCount}
              </span>
              <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">
                Students locked or with ≥3 absences
              </p>
            </div>
          </div>
        </div>

        {/* Daily Trend Chart (Visual Absences vs Clearances) */}
        {overview.dailyTrend && overview.dailyTrend.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-label-lg text-[16px] font-bold text-primary">Daily Clearance Activity</h3>
                <p className="font-body-sm text-[13px] text-on-surface-variant">Absences recorded vs clearances granted daily</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block"></span>
                  <span className="text-on-surface-variant">Absences</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                  <span className="text-on-surface-variant">Clearances</span>
                </div>
              </div>
            </div>

            {/* Micro Bar Chart */}
            <div className="h-40 w-full flex items-end gap-1.5 pt-4 pb-2 border-b border-outline-variant/30 overflow-x-auto">
              {overview.dailyTrend.map((pt, i) => {
                const maxVal = Math.max(
                  ...overview.dailyTrend.map((p) => Math.max(p.absences, p.clearances)),
                  1
                );
                const absH = Math.round((pt.absences / maxVal) * 110);
                const clrH = Math.round((pt.clearances / maxVal) * 110);
                const shortDate = pt.date.slice(5);

                return (
                  <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative">
                    <div className="w-full flex items-end justify-center gap-0.5 h-[120px]">
                      <div
                        style={{ height: `${Math.max(4, absH)}px` }}
                        className="w-1.5 sm:w-2.5 bg-rose-400/80 rounded-t-sm transition-all group-hover:bg-rose-500"
                        title={`${pt.date}: ${pt.absences} absences`}
                      ></div>
                      <div
                        style={{ height: `${Math.max(4, clrH)}px` }}
                        className="w-1.5 sm:w-2.5 bg-emerald-500/80 rounded-t-sm transition-all group-hover:bg-emerald-600"
                        title={`${pt.date}: ${pt.clearances} clearances`}
                      ></div>
                    </div>
                    <span className="text-[10px] text-on-surface-variant/70 mt-1 whitespace-nowrap block">
                      {i % 4 === 0 || i === overview.dailyTrend.length - 1 ? shortDate : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparative Breakdown Table */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-label-lg text-[16px] font-bold text-primary">Compliance Breakdown</h3>
              <p className="font-body-sm text-[13px] text-on-surface-variant">Compare catch-up performance across your college</p>
            </div>

            <div className="flex items-center bg-surface-container-high rounded-xl p-1 gap-1 self-start sm:self-auto">
              <button
                onClick={() => setBreakdownBy('class')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-[13px] font-bold transition-all ${
                  breakdownBy === 'class' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                By Class
              </button>
              <button
                onClick={() => setBreakdownBy('teacher')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-[13px] font-bold transition-all ${
                  breakdownBy === 'teacher' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                By Teacher
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {breakdownBy === 'class' ? (
              <table className="w-full text-left border-collapse font-body-sm text-[13px]">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Assigned Teacher(s)</th>
                    <th className="py-2.5 px-3">Enrolled</th>
                    <th className="py-2.5 px-3">Absences</th>
                    <th className="py-2.5 px-3">Clearances</th>
                    <th className="py-2.5 px-3">Clearance %</th>
                    <th className="py-2.5 px-3">Median Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {classRows.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-primary">{r.name}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{r.teacherName}</td>
                      <td className="py-3 px-3 font-semibold">{r.studentCount}</td>
                      <td className="py-3 px-3 text-rose-700 font-semibold">{r.absences}</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">{r.clearances}</td>
                      <td className="py-3 px-3">
                        {r.rate != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${r.rate >= 80 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, r.rate)}%` }}
                              ></div>
                            </div>
                            <span className="font-bold">{r.rate}%</span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/60">No absences</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {r.medianHours != null ? `${r.medianHours} hrs` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse font-body-sm text-[13px]">
                <thead>
                  <tr className="border-b border-outline-variant/40 text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Subjects</th>
                    <th className="py-2.5 px-3">Absences Marked</th>
                    <th className="py-2.5 px-3">Clearances</th>
                    <th className="py-2.5 px-3">Clearance %</th>
                    <th className="py-2.5 px-3">Median Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {teacherRows.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-primary">{t.name}</td>
                      <td className="py-3 px-3 text-on-surface-variant">{t.subject}</td>
                      <td className="py-3 px-3 text-rose-700 font-semibold">{t.absences}</td>
                      <td className="py-3 px-3 text-emerald-700 font-semibold">{t.clearances}</td>
                      <td className="py-3 px-3">
                        {t.rate != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${t.rate >= 80 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, t.rate)}%` }}
                              ></div>
                            </div>
                            <span className="font-bold">{t.rate}%</span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/60">No absences</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {t.medianHours != null ? `${t.medianHours} hrs` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
