import { useState } from 'react';
import { get, post, type Clearance, type Me, type Message } from '../../lib/api';
import { dayName, hm, initials, when } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { useLoad } from '../../lib/useLoad';
import AlertsCard from '../../ui/AlertsCard';
import { ErrorCard, OfflineBanner, Skeleton, SubjectIcon, useToast } from '../../ui';

export interface ChildSummary {
  attendanceRate30d: number | null; attendanceClasses30d: { present: number; total: number };
  topicsDone: number; topicsTotal: number; avgScore: number | null; medianDaysToClear: number | null; lastActive: string | null;
}
interface Child {
  id: string; name: string; class: string; roll: string; clearances: Clearance[];
  attendance: { date: string; status: string; subject: string }[];
  subjects: { code: string; name: string; status: string; done: number; total: number; avgScore: number | null }[];
  summary: ChildSummary;
}
interface ParentData { me: Me; children: Child[]; weeklySummary: boolean }

export function ParentHomeMrsFatimaRaza() {
  const { t, locale, subj } = useI18n();
  const toast = useToast();
  const { data, error, reload } = useLoad(() => Promise.all([get<ParentData>('parent/home'), get<Message[]>('messages')]));
  const [weekly, setWeekly] = useState<boolean | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!data) return <Skeleton rows={4} />;
  
  const [d, msgs] = data;
  const on = weekly ?? d.weeklySummary;
  
  async function toggle(v: boolean) {
    setWeekly(v);
    try { await post('parent/settings', { weeklySummary: v }); toast(t(v ? 'Weekly summary turned on' : 'Weekly summary turned off')); }
    catch (e) { setWeekly(!v); toast((e as Error).message); }
  }

  const activeChild = d.children.find(c => c.id === activeChildId) || d.children[0];

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-20 bg-surface px-margin-mobile">
      <div className="flex flex-col w-full pb-6 space-y-space-md">
        <OfflineBanner />

        {/* Parent Greeting & Institution Header */}
        <div className="flex flex-col gap-space-xs pt-space-xs">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">FBISE Affiliated Institution</span>
          </div>
          <h2 className="font-headline-md text-[24px] text-on-surface tracking-tight">
            Assalam o alaikum, <span className="text-primary font-bold">{d.me.name.split(' ').pop()}</span>
          </h2>
          <p className="font-body-sm text-[14px] text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-outline">apartment</span>
            {d.me.college}
          </p>
        </div>

        {/* Multi-Child Selector Chips */}
        {d.children.length > 1 && (
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 -mx-margin-mobile px-margin-mobile">
            {d.children.map(c => {
              const isActive = activeChild.id === c.id;
              const pending = c.clearances.filter(x => x.status === 'pending').length;
              return (
                <button key={c.id} onClick={() => setActiveChildId(c.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm flex-shrink-0 transition-transform active:scale-95 ${isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'}`} type="button">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-secondary-fixed' : 'bg-secondary'}`}></span>
                  <span className="font-label-md text-[14px]">{c.name.split(' ')[0]} ({c.class})</span>
                  {pending > 0 ? (
                    <span className="bg-error text-on-error font-label-sm text-[12px] px-1.5 py-0.2 rounded-full font-bold">{pending}</span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Primary Child Card */}
        {activeChild && (
          <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden animate-[fadeIn_0.3s_ease-out]">
            <div className="p-space-md bg-surface-container-low flex items-start justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-headline-sm text-[20px] flex-shrink-0 shadow-inner">
                  {initials(activeChild.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-lg text-[16px] text-on-surface font-bold truncate">{activeChild.name}</span>
                    <span className="font-label-sm text-[12px] text-on-surface-variant bg-surface-variant px-1.5 py-0.5 rounded">{activeChild.roll}</span>
                  </div>
                  <span className="font-body-sm text-[13px] text-on-surface-variant truncate">{activeChild.class}</span>
                </div>
              </div>
              
              {activeChild.clearances.filter(x => x.status === 'pending').length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[12px] font-semibold bg-[#FFF3DC] text-[#A55A06] flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px]">pending_actions</span>
                  {activeChild.clearances.filter(x => x.status === 'pending').length} to clear
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[12px] font-semibold bg-[#E3F5EC] text-[#047857] flex-shrink-0">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  Up to date
                </span>
              )}
            </div>

            <div className="p-space-md flex flex-col space-y-space-md">
              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-container rounded-lg p-2.5 flex flex-col items-center text-center justify-center">
                  <span className={`font-headline-sm text-[20px] font-bold ${activeChild.summary.attendanceRate30d != null && activeChild.summary.attendanceRate30d < 75 ? 'text-[#B42318]' : 'text-primary'}`}>
                    {activeChild.summary.attendanceRate30d == null ? '–' : activeChild.summary.attendanceRate30d + '%'}
                  </span>
                  <span className="font-label-sm text-[12px] text-on-surface-variant mt-0.5">Attendance</span>
                  <span className="font-label-sm text-[10px] text-outline leading-tight mt-0.5">{activeChild.summary.attendanceClasses30d.present} / {activeChild.summary.attendanceClasses30d.total}</span>
                </div>
                <div className="bg-surface-container rounded-lg p-2.5 flex flex-col items-center text-center justify-center">
                  <span className="font-headline-sm text-[20px] text-primary font-bold">{activeChild.summary.topicsDone} / {activeChild.summary.topicsTotal}</span>
                  <span className="font-label-sm text-[12px] text-on-surface-variant mt-0.5">Topics Done</span>
                </div>
                <div className="bg-surface-container rounded-lg p-2.5 flex flex-col items-center text-center justify-center">
                  <div className="flex items-center text-primary font-bold">
                    <span className="font-headline-sm text-[20px]">{activeChild.summary.avgScore == null ? '–' : activeChild.summary.avgScore}</span>
                    {activeChild.summary.avgScore != null && <span className="text-[12px] text-outline">/5</span>}
                  </div>
                  <span className="font-label-sm text-[12px] text-on-surface-variant mt-0.5">Avg Score</span>
                </div>
              </div>

              {/* Actionable Alerts */}
              {activeChild.clearances.length > 0 && (
                <div className="flex flex-col space-y-2">
                  {activeChild.clearances.map(x => (
                    x.status === 'pending' ? (
                      <div key={x.id} className="bg-[#FFF3DC] rounded-lg p-3 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#A55A06] text-[18px] flex-shrink-0 mt-0.5">warning</span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-label-md text-[14px] text-[#A55A06] font-bold">Absent {dayName(x.date, locale)}</span>
                            <span className="font-label-sm text-[11px] bg-[#B42318] text-white px-1.5 rounded">Action Required</span>
                          </div>
                          <p className="font-body-sm text-[13px] text-[#7A3F00] mt-1 leading-snug">
                            Must complete <span className="font-semibold">{subj(x.lesson.subject)} {x.lesson.topic} {x.lesson.title}</span> {x.attempts > 0 ? `(best score: ${x.best ?? 0}/5)` : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div key={x.id} className="bg-[#E3F5EC] rounded-lg p-2.5 flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#047857] text-[18px] flex-shrink-0">check_circle</span>
                        <span className="font-body-sm text-[13px] text-[#047857] font-medium leading-tight">
                          Cleared <strong className="font-semibold">{subj(x.lesson.subject)} {x.lesson.topic}</strong> · {when(x.clearedAt, locale)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Recent Study Activity */}
              <div className="flex items-center gap-2 px-1 text-on-surface-variant font-body-sm text-[13px]">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                <span className="truncate">
                  {activeChild.summary.lastActive ? `Last studied ${hm(activeChild.summary.lastActive, locale)}` : 'No lessons started yet'} 
                  {activeChild.summary.medianDaysToClear != null && ` · clears in ~${activeChild.summary.medianDaysToClear} days`}
                </span>
              </div>

              {/* Attendance Strip */}
              {activeChild.attendance.length > 0 && (
                <div className="flex flex-col space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider">7-Day Attendance</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {activeChild.attendance.slice(0, 7).reverse().map((a, k) => {
                      const isAbsent = a.status === 'absent';
                      return (
                        <div key={k} className={`flex flex-col items-center py-1.5 rounded ${isAbsent ? 'bg-[#FDECEA] shadow-sm' : 'bg-surface-container'}`}>
                          <span className={`font-label-sm text-[10px] font-bold ${isAbsent ? 'text-[#B42318]' : 'text-outline font-medium'}`}>
                            {new Date(a.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short' }).toUpperCase()}
                          </span>
                          <span className={`w-6 h-6 mt-1 rounded-full font-label-md text-[14px] flex items-center justify-center font-bold ${isAbsent ? 'bg-[#B42318] text-white' : 'bg-[#E3F5EC] text-[#047857]'}`}>
                            {isAbsent ? 'A' : 'P'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subjects */}
              <div className="flex flex-col space-y-2 pt-1">
                <span className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider">Subjects & Modules</span>
                <div className="flex flex-col space-y-2">
                  {activeChild.subjects.map(s => {
                    const live = s.status === 'live';
                    return (
                      <a key={s.code} href={live ? `#/child/${activeChild.id}/${s.code}` : undefined} className={`flex items-center justify-between p-3 rounded-lg ${live ? 'bg-surface-container-low hover:bg-surface-container transition-colors' : 'bg-surface-container-low/60 opacity-75'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[20px] ${live ? 'bg-primary-fixed text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                            <SubjectIcon code={s.code} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-label-md text-[14px] text-on-surface font-bold">{subj(s.name)}</span>
                              {live && <span className="font-label-sm text-[12px] text-secondary font-medium">{s.done} of {s.total} topics</span>}
                            </div>
                            {live && s.total > 0 && (
                              <div className="w-36 h-1.5 bg-surface-variant rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-secondary rounded-full" style={{ width: `${(s.done / s.total) * 100}%` }}></div>
                              </div>
                            )}
                          </div>
                        </div>
                        {live ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {s.avgScore != null && <span className="font-label-md text-[14px] text-primary font-semibold">avg {s.avgScore}/5</span>}
                            <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
                          </div>
                        ) : (
                          <span className="font-label-sm text-[12px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full font-medium">Coming soon</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        <AlertsCard />

        {/* Messages from the College */}
        <div className="flex flex-col space-y-space-sm pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">mark_chat_unread</span>
              <h3 className="font-label-sm text-[12px] text-on-surface-variant font-bold uppercase tracking-wider">Messages</h3>
            </div>
            {msgs.length > 4 && (
              <a className="font-label-sm text-[13px] text-primary font-semibold hover:underline flex items-center" href="#/msgs">
                See all <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </a>
            )}
          </div>
          
          {msgs.slice(-4).map(m => (
            <div key={m.id} className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-label-sm text-[12px] font-bold ${
                    m.type === 'absence' ? 'bg-surface-container-high text-primary' : 'bg-primary-fixed text-primary'
                  }`}>
                    {m.type === 'absence' ? <span className="material-symbols-outlined text-[16px]">campaign</span> : initials(d.me.college || 'C')}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-[14px] text-on-surface font-bold leading-tight">{m.type === 'absence' ? 'System' : d.me.college || 'College'}</span>
                  </div>
                </div>
                <span className="font-label-sm text-[11px] text-outline">{when(m.at, locale)}</span>
              </div>
              <p className="font-body-sm text-[13px] text-on-surface bg-surface-container-low p-2.5 rounded-lg leading-relaxed">
                {m.body}
              </p>
            </div>
          ))}
          {msgs.length === 0 && <p className="text-on-surface-variant text-[13px] p-2">No messages.</p>}
        </div>

        {/* Weekly Summary Toggle */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-md cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => toggle(!on)}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-[15px] text-on-surface font-bold">Weekly summary</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant leading-snug">
                Every Sunday evening, receive a brief progress digest in Messages.
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center">
            <div className={`w-11 h-6 rounded-full relative p-0.5 shadow-inner transition-colors ${on ? 'bg-primary' : 'bg-surface-container-high'}`}>
              <div className={`w-5 h-5 bg-on-primary rounded-full shadow-sm transform transition-transform ${on ? 'translate-x-5' : 'translate-x-0 bg-outline'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
