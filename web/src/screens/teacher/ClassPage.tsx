import { useMemo, useState } from 'react';
import { get, post, type Clearance } from '../../lib/api';
import { dayName, initials, todayLong, when } from '../../lib/format';
import { useLoad } from '../../lib/useLoad';
import { Badge, ErrorCard, Icon, OfflineBanner, PhoneInput, Sheet, Skeleton, Stat, useToast } from '../../ui';
import type { Assignment } from './TeacherHome';

interface Student { id: string; name: string; roll: string; status: string | null; parent: { name: string; phone: string }; whatsappFailed: boolean }
interface ClassData {
  assignment: Assignment; date: string; submitted: boolean; topic: string | null;
  lessons: { id: string; topic: string; title: string }[]; students: Student[]; clearances: Clearance[];
}
const REASONS = ['Medical certificate provided', 'On official college duty', 'Covered the topic with the teacher in person'];

export default function ClassPage({ args }: { args: string[] }) {
  const aid = args[0] || '';
  const { data, error, reload, setData } = useLoad(() => get<ClassData>('teacher/assignments/' + encodeURIComponent(aid)), [aid]);
  const back = <div className="flex gap-1.5 items-center text-on-surface-variant text-[14px]"><a href="#/teacher"><Icon name="back" sm />My classes</a></div>;
  if (error) return <>{back}<ErrorCard error={error} onRetry={reload} /></>;
  if (!data) return <Skeleton />;
  if (!data.lessons.length) {
    return (
      <>{back}<p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>{data.assignment.subject}</p><h1 className="text-[22px] leading-tight my-1 font-bold">{data.assignment.class}</h1>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 soon-card"><Icon name="clock" /><div><b>{data.assignment.subject} lessons are coming soon</b>
          <div className="text-on-surface-variant text-[14px] text-[13px]">Attendance with missed-lesson clearance starts when the first {data.assignment.subject} lesson is approved. {data.students.length} students are in this class.</div></div></div></>
    );
  }
  return <Roster key={data.date + data.submitted + data.clearances.length} d={data} aid={aid} reload={reload} setData={setData} back={back} />;
}

function Roster({ d, aid, reload, setData, back }: { d: ClassData; aid: string; reload: () => void; setData: (x: ClassData) => void; back: React.ReactNode }) {
  const toast = useToast();
  const initial = useMemo(() => Object.fromEntries(d.students.map((s) => [s.id, s.status || 'present'])), [d]);
  const [marks, setMarks] = useState<Record<string, string>>(initial);
  const [topic, setTopic] = useState(d.topic || d.lessons[0].id);
  const [saving, setSaving] = useState(false);
  const [override, setOverride] = useState<Clearance | null>(null);
  const [phoneFor, setPhoneFor] = useState<Student | null>(null);
  const saved = JSON.stringify([d.topic || d.lessons[0].id, initial]);
  const dirty = !d.submitted || JSON.stringify([topic, marks]) !== saved;
  const absent = Object.values(marks).filter((v) => v === 'absent').length;
  const pending = d.clearances.filter((c) => c.status === 'pending');
  const clear = [...d.clearances].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1));
  const today = d.clearances.filter((c) => c.whatsapp), todo = today.filter((c) => !c.whatsapp!.notifiedAt);

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
    }, (e) => toast(e.message));
  }

  return (
    <>
      <OfflineBanner />{back}
      <p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>{todayLong()} · {d.assignment.subject}</p><h1 className="text-[22px] leading-tight my-1 font-bold">{d.assignment.class}</h1>
      <div className="grid grid-cols-3 gap-2 my-3">
        <Stat value={d.students.length - absent} label="Present" tone="ok" />
        <Stat value={absent} label="Absent" />
        <Stat value={pending.length} label="Pending" tone={pending.length ? 'warn' : undefined} />
      </div>
      {today.length > 0 && (todo.length === 0
        ? <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 ok-card text-[13px] flex gap-2.5 items-center"><Icon name="check" sm /><span>All parents of today’s absent students have been told on WhatsApp.</span></div>
        : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 wa-card">
            <div className="flex gap-2.5 items-center justify-between"><b>Tell parents on WhatsApp</b><Badge tone="warn">{todo.length} not told yet</Badge></div>
            <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ margin: '4px 0 8px' }}>Free: each button opens your WhatsApp with the message ready. Tap Send there. Parents with the app also got an alert.</p>
            {todo.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 py-2 border-b border-outline-variant"><span className="w-10 h-10 rounded-full flex-none grid place-items-center bg-surface-container-low text-on-surface-variant font-bold text-[14px]">{initials(c.student)}</span>
                <div className="flex-1 min-w-0"><b>{c.whatsapp!.parent}</b><div className="text-on-surface-variant text-[14px] text-[13px]">parent of {c.student}</div></div>
                <a className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer wa-btn" target="_blank" rel="noopener" onClick={() => sentOnWhatsApp(c)}
                  href={`https://wa.me/${c.whatsapp!.phone}?text=${encodeURIComponent(c.whatsapp!.text)}`}><Icon name="chat" sm />Send on WhatsApp</a>
              </div>
            ))}
          </div>
        ))}
      <div className="class-grid">
        <section className="col-att">
          <h2 className="flex gap-2.5 items-center justify-between text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">{d.submitted ? 'Today’s attendance' : 'Take attendance'}{d.submitted && <Badge tone="ok" icon="check">Submitted</Badge>}</h2>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="tp" style={{ marginTop: 0 }}>Topic taught today</label>
          <select id="tp" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {d.lessons.map((l) => <option key={l.id} value={l.id}>{l.topic} {l.title}</option>)}
          </select>
          <p className="text-on-surface-variant text-[14px] text-[13px]">Absent students get this topic as their missed lecture, and their parents get an alert.</p>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5" style={{ padding: '4px 12px' }}>
            {d.students.map((s) => {
              const st = marks[s.id];
              return (
                <div key={s.id} className={'att' + (st === 'absent' ? ' is-absent' : '')}>
                  <span className="w-10 h-10 rounded-full flex-none grid place-items-center bg-surface-container-low text-on-surface-variant font-bold text-[14px]">{initials(s.name)}</span>
                  <div className="flex-1 min-w-0"><b>{s.name}</b>
                    <div className="text-on-surface-variant text-[14px] text-[13px] who"><span>{s.roll} · {s.parent.name}</span>
                      {s.whatsappFailed && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap bg-[#fff3dc] text-[#a55a06]" title="WhatsApp failed; the alert went by SMS">SMS used</span>}
                      <button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low inline" aria-label={'Edit parent number for ' + s.name} title="Edit parent number" onClick={() => setPhoneFor(s)}><Icon name="edit" sm /></button>
                    </div></div>
                  <div className="flex gap-1" role="group" aria-label={s.name}>
                    <button className="p" aria-pressed={st === 'present'} aria-label="Present" onClick={() => setMarks({ ...marks, [s.id]: 'present' })}>P</button>
                    <button className="a" aria-pressed={st === 'absent'} aria-label="Absent" onClick={() => setMarks({ ...marks, [s.id]: 'absent' })}>A</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sticky bottom-[72px] flex gap-2 py-2 bg-surface">
            <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" onClick={() => setMarks(Object.fromEntries(d.students.map((s) => [s.id, 'present'])))}>All present</button>
            <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer flex-1 min-w-0" disabled={!dirty || saving} onClick={submit}>
              {saving ? 'Saving…' : !dirty ? <><Icon name="check" sm />Saved</> : (d.submitted ? 'Save changes' : 'Submit attendance') + (absent ? ` · ${absent} absent` : '')}
            </button>
          </div>
        </section>
        <section className={'col-clear' + (clear.length ? '' : ' empty')}>
          <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Class clearance</h2>
          {clear.length ? clear.map((c) => {
            const ok = c.status === 'cleared';
            return (
              <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 my-2.5">
                <div className="flex gap-2.5 items-center"><span className="w-10 h-10 rounded-full flex-none grid place-items-center bg-surface-container-low text-on-surface-variant font-bold text-[14px]">{initials(c.student)}</span>
                  <div className="flex-1 min-w-0"><b>{c.student}</b>
                    <div className="text-on-surface-variant text-[14px] text-[13px]">{c.lesson.topic} {c.lesson.title} · absent {dayName(c.date)}</div>
                    <div className="text-on-surface-variant text-[14px] text-[13px]">{ok ? (c.clearedBy === 'teacher' ? 'Cleared by teacher: ' + c.overrideReason : `Passed ${c.best}/5, ${when(c.clearedAt)}`)
                      : c.lastAttempt ? `Last attempt ${when(c.lastAttempt)} · best ${c.best}/5 · ${c.attempts} attempt${c.attempts > 1 ? 's' : ''}` : 'Not started yet'}</div></div>
                  {ok ? <Badge tone="ok" icon="check">Cleared</Badge> : <Badge tone="pend" icon="cross">Pending</Badge>}
                </div>
                {!ok && <div style={{ textAlign: 'right' }}><button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low" onClick={() => setOverride(c)}>Clear manually…</button></div>}
              </div>
            );
          }) : <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px] text-[13px]">No absences yet. When you mark a student absent, their catch-up progress appears here.</div>}
        </section>
      </div>
      {override && <OverrideSheet c={override} onClose={() => setOverride(null)} onDone={() => { toast(override.student + ' cleared. Parent notified.'); reload(); }} />}
      {phoneFor && <PhoneSheet s={phoneFor} onClose={() => setPhoneFor(null)}
        onDone={(parent) => { toast('Parent number updated'); setData({ ...d, students: d.students.map((x) => (x.id === phoneFor.id ? { ...x, parent } : x)) }); }} />}
    </>
  );
}

function OverrideSheet({ c, onClose, onDone }: { c: Clearance; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState('');
  return (
    <Sheet title={`Clear ${c.student} manually`} confirm="Clear for class" onClose={onClose}
      onConfirm={async () => {
        const r = reason === 'Other' ? other.trim() : reason;
        if (r.length < 3) throw new Error('Write a short reason, for example “Medical certificate provided”.');
        await post(`teacher/clearances/${c.id}/override`, { reason: r }); onDone();
      }}>
      <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ marginTop: 0 }}>{c.lesson.topic} {c.lesson.title}. The reason is saved with the record, and the parent gets an alert.</p>
      <fieldset className="choices"><legend className="block font-semibold text-[14px] mt-3.5 mb-1.5">Reason</legend>
        {[...REASONS, 'Other'].map((r) => (
          <label key={r} className="choice"><input type="radio" name="rsn" checked={reason === r} onChange={() => setReason(r)} /><span>{r}</span></label>
        ))}
      </fieldset>
      {reason === 'Other' && <textarea rows={2} maxLength={200} placeholder="Write the reason" aria-label="Other reason" autoFocus value={other} onChange={(e) => setOther(e.target.value)} />}
    </Sheet>
  );
}

function PhoneSheet({ s, onClose, onDone }: { s: Student; onClose: () => void; onDone: (p: { name: string; phone: string }) => void }) {
  const [v, setV] = useState(s.parent.phone.replace(/^\+92/, ''));
  return (
    <Sheet title="Parent’s mobile number" confirm="Save number" onClose={onClose}
      onConfirm={async () => {
        const n = v.replace(/^0/, '');
        if (!/^3\d{9}$/.test(n)) throw new Error('Enter a 10-digit mobile number starting with 3.');
        const r = await post<{ parent: { name: string; phone: string } }>(`teacher/students/${s.id}/parent-phone`, { phone: '0' + n });
        onDone(r.parent);
      }}>
      <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ marginTop: 0 }}>{s.parent.name}, parent of {s.name}. Absence alerts go to this number.</p>
      <PhoneInput id="pp-in" label="Mobile number" value={v} onChange={setV} />
    </Sheet>
  );
}
