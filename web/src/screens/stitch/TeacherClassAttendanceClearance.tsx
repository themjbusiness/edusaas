import { useMemo, useState } from 'react';
import { get, post, type Clearance } from '../../lib/api';
import { initials, todayLong, when } from '../../lib/format';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Skeleton, useToast } from '../../ui';

interface Student { id: string; name: string; roll: string; status: string | null; parent: { name: string; phone: string }; whatsappFailed: boolean }
export interface Assignment { id: number; subject: string; class: string; students: number; }
interface ClassData {
  assignment: Assignment; date: string; submitted: boolean; topic: string | null;
  lessons: { id: string; topic: string; title: string }[]; students: Student[]; clearances: Clearance[];
}

export function TeacherClassAttendanceClearance({ args }: { args?: string[] }) {
  const aid = args?.[0] || '';
  const { data: d, error, reload, setData } = useLoad(() => get<ClassData>('teacher/assignments/' + encodeURIComponent(aid)), [aid]);

  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!d) return <Skeleton rows={6} />;

  if (!d.lessons.length) {
    return (
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin-mobile">
        <div className="flex flex-col w-full pb-28">
          <div className="flex flex-col gap-space-xs mb-space-md">
            <h1 className="font-headline-lg-mobile text-[24px] text-primary tracking-tight">{d.assignment.class}</h1>
            <span className="font-label-sm text-[11px] text-secondary font-medium">{d.assignment.subject}</span>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">clock</span>
            <div>
              <b>{d.assignment.subject} lessons are coming soon</b>
              <div className="text-on-surface-variant text-[13px]">Attendance with missed-lesson clearance starts when the first {d.assignment.subject} lesson is approved. {d.students.length} students are in this class.</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <Roster d={d} aid={aid} reload={reload} setData={setData} />;
}

function Roster({ d, aid, reload, setData }: { d: ClassData; aid: string; reload: () => void; setData: (x: ClassData) => void }) {
  const toast = useToast();
  const initial = useMemo(() => Object.fromEntries(d.students.map((s) => [s.id, s.status || 'present'])), [d]);
  const [marks, setMarks] = useState<Record<string, string>>(initial);
  const [topic, setTopic] = useState(d.topic || d.lessons[0].id);
  const [saving, setSaving] = useState(false);
  const [override, setOverride] = useState<Clearance | null>(null);
  
  const saved = JSON.stringify([d.topic || d.lessons[0].id, initial]);
  const dirty = !d.submitted || JSON.stringify([topic, marks]) !== saved;
  const absentCount = Object.values(marks).filter((v) => v === 'absent').length;
  const pending = d.clearances.filter((c) => c.status === 'pending');
  const clear = [...d.clearances].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1));
  const todayWa = d.clearances.filter((c) => c.whatsapp);
  const todoWa = todayWa.filter((c) => !c.whatsapp!.notifiedAt);

  async function submit() {
    setSaving(true);
    try {
      const r = await post<{ alertsSent: number }>(`teacher/assignments/${aid}/attendance`, { lesson: topic, statuses: marks });
      toast('Attendance saved.' + (r.alertsSent ? ` ${r.alertsSent} parent${r.alertsSent > 1 ? 's' : ''} alerted in the app. Tell them on WhatsApp too.` : ''));
      reload();
    } catch (e) { toast((e as Error).message); setSaving(false); }
  }

  function sentOnWhatsApp(c: Clearance) {
    post<{ notifiedAt: string }>(`teacher/clearances/${c.id}/whatsapp-sent`).then((r) => {
      setData({ ...d, clearances: d.clearances.map((x) => (x.id === c.id && x.whatsapp ? { ...x, whatsapp: { ...x.whatsapp, notifiedAt: r.notifiedAt } } : x)) });
    }, (e) => toast((e as Error).message));
  }

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin-mobile min-h-screen">
      <div className="flex flex-col w-full pb-28">
        
        {/* Header Context & Title Area */}
        <div className="flex flex-col gap-space-xs mb-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              <span className="font-label-sm text-[11px] tracking-wide uppercase">{todayLong()} · {d.assignment.subject}</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-secondary text-[14px]">groups</span>
              <span className="font-label-sm text-[11px] text-primary font-semibold">{d.students.length} enrolled</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h1 className="font-headline-lg-mobile text-[24px] text-primary tracking-tight font-bold">{d.assignment.class}</h1>
          </div>
        </div>

        {/* 3-Column Attendance Stat Tiles */}
        <div className="grid grid-cols-3 gap-2.5 mb-space-md">
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-on-secondary-fixed text-[16px]">check</span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Present</span>
            <span className="font-headline-md text-[20px] text-secondary font-bold leading-none mt-1">{d.students.length - absentCount}</span>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-7 h-7 rounded-full bg-error-container flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-error text-[16px]">close</span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Absent</span>
            <span className="font-headline-md text-[20px] text-error font-bold leading-none mt-1">{absentCount}</span>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-primary-container text-[16px]">pending_actions</span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Backlog</span>
            <span className="font-headline-md text-[20px] text-primary font-bold leading-none mt-1">{pending.length}</span>
          </div>
        </div>

        {/* WhatsApp Parent Notification Card */}
        {todayWa.length > 0 && (
          <div className="bg-secondary-container/25 rounded-xl p-space-md mb-space-lg shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-on-secondary text-[20px]">chat</span>
                </div>
                <span className="font-label-lg text-[14px] text-primary font-bold">Tell parents on WhatsApp</span>
              </div>
              {todoWa.length > 0 ? (
                <span className="font-label-sm text-[11px] bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full font-semibold">
                  {todoWa.length} not told yet
                </span>
              ) : (
                <span className="font-label-sm text-[11px] bg-[#C7EED8] text-[#047857] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check</span> All told
                </span>
              )}
            </div>
            <p className="font-body-sm text-[13px] text-on-surface-variant mb-space-md">
              Free institutional dispatch: tap opens official FBISE template in your WhatsApp ready to send.
            </p>
            
            <div className="flex flex-col gap-2">
              {todoWa.map(c => (
                <div key={c.id} className="bg-surface-container-lowest rounded-lg p-3 flex flex-col gap-2.5 shadow-sm border border-outline-variant/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-label-md text-[14px] font-bold shrink-0 mt-0.5">
                      {initials(c.student)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-[14px] font-bold text-primary truncate">{c.whatsapp!.parent}</p>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">Parent of {c.student}</p>
                    </div>
                  </div>
                  <a className="w-full bg-secondary hover:bg-tertiary-container active:scale-[0.99] transition-all text-on-secondary rounded-lg min-h-[44px] px-space-md flex items-center justify-center gap-2 font-label-md text-[14px] font-bold shadow-sm" target="_blank" rel="noopener" onClick={() => sentOnWhatsApp(c)} href={`https://wa.me/${c.whatsapp!.phone}?text=${encodeURIComponent(c.whatsapp!.text)}`}>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Send WhatsApp Notice</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: Class Clearance Backlog */}
        <div className="mb-space-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <h2 className="font-label-md text-[13px] font-bold tracking-wider uppercase text-primary">Class Clearance</h2>
            </div>
          </div>
          
          <div className={`bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-2 p-2 ${clear.length ? '' : 'justify-center items-center p-6'}`}>
            {clear.length ? clear.map(c => {
              const ok = c.status === 'cleared';
              return (
                <div key={c.id} className={`p-3 rounded-lg flex ${ok ? 'items-center justify-between flex-row' : 'flex-col'} gap-2 ${ok ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}`}>
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-label-md text-[14px] font-bold shrink-0 ${ok ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error text-on-error'}`}>
                        {initials(c.student)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-label-lg text-[14px] font-bold text-primary truncate">{c.student}</h3>
                        <p className={`font-body-sm text-[12px] ${ok ? 'text-on-surface-variant' : 'text-error font-medium'} truncate`}>{c.lesson.topic} {c.lesson.title}</p>
                        {ok && <p className="font-label-sm text-[11px] text-secondary font-medium mt-0.5">{c.clearedBy === 'teacher' ? 'Cleared by teacher' : `Passed ${c.best}/5`}</p>}
                      </div>
                    </div>
                    {ok ? (
                      <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold shrink-0 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">check</span> Cleared
                      </span>
                    ) : (
                      <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                  {!ok && (
                    <div className="bg-surface rounded-md p-2 flex items-center justify-between text-on-surface-variant mt-1">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[15px]">history</span>
                        <span className="font-body-sm text-[11px]">{c.lastAttempt ? `Last attempt ${when(c.lastAttempt)} · Best: ${c.best}/5` : 'Not started yet'}</span>
                      </div>
                      <button onClick={() => setOverride(c)} className="font-label-md text-[13px] text-secondary font-bold hover:underline ml-2 shrink-0">
                        Clear manually…
                      </button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <p className="font-body-sm text-[13px] text-on-surface-variant text-center">No absences yet. When you mark a student absent, their catch-up progress appears here.</p>
            )}
          </div>
        </div>

        {/* SECTION: Today's Attendance */}
        <div className="flex flex-col gap-space-sm mb-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-label-md text-[13px] font-bold tracking-wider uppercase text-primary">{d.submitted ? 'Today\'s Attendance' : 'Take Attendance'}</h2>
            {d.submitted && (
              <span className="bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">done_all</span> Submitted
              </span>
            )}
          </div>
          
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-2">
            <label className="font-label-md text-[14px] font-bold text-primary flex items-center justify-between" htmlFor="topic-select">
              <span>Topic taught today</span>
            </label>
            <div className="relative w-full">
              <select className="w-full min-h-[48px] px-3.5 pr-10 bg-surface-container-low text-on-surface rounded-xl font-body-md text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-secondary transition-all border border-outline-variant" id="topic-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {d.lessons.map(l => <option key={l.id} value={l.id}>{l.topic} {l.title}</option>)}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[22px]">
                arrow_drop_down
              </span>
            </div>
            <p className="font-body-sm text-[12px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-secondary text-[16px] shrink-0">info</span>
              <span>Absent students receive this topic as a mandatory clearance quiz.</span>
            </p>
          </div>
        </div>

        {/* SECTION: Student Roster Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md mb-6">
          <div className="flex items-center justify-between mb-space-sm pb-2">
            <span className="font-label-md text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Candidate Roll & Parent</span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Tap P / A</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {d.students.map(s => {
              const st = marks[s.id];
              return (
                <div key={s.id} className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${st === 'absent' ? 'bg-error-container/20' : 'bg-surface-container-low'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-label-md text-[14px] font-bold shrink-0 shadow-sm ${st === 'absent' ? 'bg-error text-on-error' : 'bg-primary-container text-on-primary-container'}`}>
                      {initials(s.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-label-lg text-[14px] font-bold text-primary truncate leading-tight">{s.name}</h4>
                      <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-[12px]">
                        <span className="font-medium text-primary">{s.roll}</span>
                        <span className="truncate">· {s.parent.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center bg-surface-container-high rounded-xl p-1 gap-1 shrink-0">
                    <button onClick={() => setMarks({ ...marks, [s.id]: 'present' })} className={`w-10 h-10 rounded-lg font-label-lg text-[16px] font-bold transition-all flex items-center justify-center ${st === 'present' ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>
                      P
                    </button>
                    <button onClick={() => setMarks({ ...marks, [s.id]: 'absent' })} className={`w-10 h-10 rounded-lg font-label-lg text-[16px] font-bold transition-all flex items-center justify-center ${st === 'absent' ? 'bg-error text-on-error shadow-sm' : 'text-on-surface-variant hover:text-error'}`}>
                      A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Docked Sticky Action Bar */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md px-margin-mobile py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] border-t border-outline-variant">
          <div className="flex items-center gap-2.5 max-w-lg mx-auto">
            <button onClick={() => setMarks(Object.fromEntries(d.students.map((s) => [s.id, 'present'])))} className="min-h-[44px] px-3.5 rounded-xl bg-surface-container-high text-primary hover:bg-surface-variant font-label-md text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all shrink-0">
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>All present</span>
            </button>
            <button onClick={submit} disabled={!dirty || saving} className="flex-1 min-w-0 min-h-[44px] rounded-xl bg-primary text-on-primary font-label-md text-[14px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50">
              <span className="material-symbols-outlined text-[18px]">{!dirty ? 'check' : 'cloud_upload'}</span>
              <span className="truncate">{saving ? 'Saving…' : !dirty ? 'Saved' : (d.submitted ? 'Save changes' : 'Submit attendance') + (absentCount ? ` · ${absentCount} absent` : '')}</span>
            </button>
          </div>
        </div>
        
      </div>

      {override && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-space-md w-full max-w-sm shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
              <h3 className="font-headline-sm text-[18px] font-bold">Manual Clearance</h3>
            </div>
            <p className="font-body-md text-[14px] text-on-surface-variant">
              Manually clear <b>{override.student}</b> for {override.lesson.topic} {override.lesson.title}.
            </p>
            <div className="bg-surface-container-low p-3 rounded-xl flex flex-col gap-1">
              <span className="font-label-sm text-[12px] font-bold text-on-surface-variant">Authorized Reason</span>
              <select className="w-full bg-surface-container-lowest font-body-sm text-[14px] p-2 rounded-lg text-on-surface focus:outline-none border border-outline-variant"
                onChange={(e) => {
                  post(`teacher/clearances/${override.id}/override`, { reason: e.target.value }).then(() => {
                    toast(override.student + ' cleared. Parent notified.');
                    setOverride(null); reload();
                  }).catch(err => toast(err.message));
                }}
              >
                <option value="">Select a reason to clear...</option>
                <option value="Medical certificate provided">Medical certificate provided</option>
                <option value="On official college duty">On official college duty</option>
                <option value="Covered the topic with the teacher in person">Covered the topic with the teacher in person</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setOverride(null)} className="flex-1 min-h-[44px] rounded-xl bg-surface-container-high text-primary font-label-md text-[14px] font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
