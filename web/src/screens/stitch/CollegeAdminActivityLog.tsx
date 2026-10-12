import { useState, useMemo } from 'react';
import { get } from '../../lib/api';
import { hm, dayName } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Skeleton } from '../../ui';

export interface AuditRow { id: number; action: string; type: string; summary: string; actor: string | null; at: string }

export function CollegeAdminActivityLog() {
  const { locale } = useI18n();
  const { data, error, reload } = useLoad(() => get<AuditRow[]>('admin/audit'));
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(row => {
      if (q && !row.summary.toLowerCase().includes(q.toLowerCase()) && !row.action.toLowerCase().includes(q.toLowerCase())) return false;
      if (filter !== 'all') {
        if (filter === 'faculty' && !['teacher', 'Teacher', 'assign'].some(k => row.action.includes(k) || row.summary.includes(k))) return false;
        if (filter === 'students' && !['student', 'Student', 'parent'].some(k => row.action.includes(k) || row.summary.includes(k))) return false;
        if (filter === 'classes' && !['class', 'Class'].some(k => row.action.includes(k) || row.summary.includes(k))) return false;
        if (filter === 'imports' && !['import'].some(k => row.action.includes(k) || row.summary.includes(k))) return false;
      }
      return true;
    });
  }, [data, q, filter]);

  const groups = useMemo(() => {
    const res: Record<string, AuditRow[]> = {};
    for (const row of filtered) {
      const d = row.at.substring(0, 10);
      if (!res[d]) res[d] = [];
      res[d].push(row);
    }
    return Object.entries(res).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function getIcon(action: string) {
    const a = action.toLowerCase();
    if (a.includes('add') || a.includes('enroll')) return { icon: 'person_add', bg: 'bg-secondary/10 text-secondary' };
    if (a.includes('import')) return { icon: 'upload_file', bg: 'bg-primary-container/15 text-primary-container' };
    if (a.includes('suspend') || a.includes('declin')) return { icon: 'block', bg: 'bg-error-container text-error' };
    if (a.includes('assign') || a.includes('alloc')) return { icon: 'link', bg: 'bg-secondary-container/60 text-on-secondary-container' };
    if (a.includes('alert') || a.includes('sync')) return { icon: 'sync', bg: 'bg-surface-container-high text-primary' };
    return { icon: 'history', bg: 'bg-surface-container-high text-on-surface-variant' };
  }

  return (
    <main className="flex flex-col relative w-full pt-16 bg-surface px-margin-mobile pb-safe min-h-screen">
      <div className="flex flex-col w-full pb-10">
        
        {/* Institutional Context & Welcome Bar */}
        <div className="flex flex-col gap-space-sm pt-space-sm pb-space-md">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-[11px]">
              <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
              Margalla Heights College · Audit Register
            </span>
            <span className="font-label-sm text-[11px] text-secondary flex items-center gap-1 bg-secondary-container/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <div>
            <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed">
              Every change in your college: who did it and when. Phone numbers are partly hidden for regulatory compliance.
            </p>
          </div>
        </div>
        
        {/* Search & Filter Area */}
        <div className="flex flex-col gap-space-sm pb-space-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input className="w-full h-12 pl-10 pr-10 bg-surface-container-lowest rounded-xl font-body-md text-[14px] text-on-surface placeholder:text-outline shadow-sm focus:outline-none focus:bg-surface-container-low transition-all" placeholder="Filter log entries..." type="search" value={q} onChange={e => setQ(e.target.value)} />
            {q && (
              <button aria-label="Clear search" className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface" onClick={() => setQ('')} type="button">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-margin-mobile px-margin-mobile">
            {['all', 'faculty', 'students', 'classes', 'imports'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-label-md text-[14px] transition-colors shadow-sm ${filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>
                {f === 'all' ? 'All activities' : f === 'faculty' ? 'Faculty & Staff' : f === 'students' ? 'Students & Parents' : f === 'classes' ? 'Classes & Subjects' : 'Imports'}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Logs Feed */}
        <div className="flex flex-col gap-space-lg">
          {error ? <ErrorCard error={error} onRetry={reload} /> : !data ? <Skeleton rows={5} /> : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline mb-3">
                <span className="material-symbols-outlined text-[28px]">search_off</span>
              </div>
              <h3 className="font-headline-sm text-[16px] text-on-surface mb-1">No activity matches</h3>
              <p className="font-body-md text-[14px] text-on-surface-variant max-w-xs mb-4">
                Try adjusting your search terms or tap “All activities” to reset.
              </p>
              <button onClick={() => { setQ(''); setFilter('all'); }} className="h-10 px-4 rounded-xl bg-primary text-on-primary font-label-md text-[14px] flex items-center gap-1.5 shadow-sm active:opacity-85 transition-opacity" type="button">
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Reset Filters
              </button>
            </div>
          ) : (
            groups.map(([date, rows]) => (
              <section key={date} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-label-sm text-[11px] text-outline tracking-wider font-semibold uppercase">{date === new Date().toISOString().substring(0, 10) ? 'TODAY' : dayName(date, locale)}</h2>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">{rows.length} {rows.length === 1 ? 'event' : 'events'}</span>
                </div>
                {rows.map(row => {
                  const style = getIcon(row.action);
                  return (
                    <article key={row.id} className="group bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
                          <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-[11px]">
                              {row.type || 'Event'}
                            </span>
                            <span className="font-label-sm text-[11px] text-on-surface-variant shrink-0">{hm(row.at)}</span>
                          </div>
                          <p className="font-body-md text-[14px] text-on-surface leading-snug">
                            <strong className="font-semibold text-primary">{row.action}</strong>
                            <br/>
                            <span className="text-on-surface-variant">{row.summary}</span>
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 font-label-sm text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px]">account_circle</span>
                            <span className="truncate">{row.actor || 'System'}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            ))
          )}
        </div>

        {/* Privacy & Regulatory Compliance Box */}
        <section className="mt-space-lg flex flex-col gap-3">
          <div className="bg-surface-container-low rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-label-md text-[14px] text-primary font-semibold mb-1 flex items-center gap-1">
                Privacy Protection Guarantee
              </h4>
              <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
                Under Federal Board (FBISE) institution records protocols, sensitive phone numbers and verification keys are masked for institutional security. Only verified chief administrators can request an unmasked export.
              </p>
            </div>
          </div>
          <button className="w-full h-12 bg-primary text-on-primary rounded-xl font-label-lg text-[14px] font-bold flex items-center justify-center gap-2 shadow-sm active:bg-primary-container transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Download audit report (.CSV)</span>
          </button>
          <p className="font-label-sm text-[11px] text-outline text-center">
            Retention period: 7 academic years
          </p>
        </section>
      </div>
    </main>
  );
}
