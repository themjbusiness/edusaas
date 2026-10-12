import { useEffect, useState } from 'react';
import { useSession } from '../../App';
import { get, post } from '../../lib/api';
import { todayLong } from '../../lib/format';
import { go } from '../../lib/router';
import { useLoad } from '../../lib/useLoad';
import AlertsCard from '../../ui/AlertsCard';
import { Badge, ErrorCard, Icon, OfflineBanner, Sheet, Skeleton, SubjectIcon, useToast } from '../../ui';

export interface Assignment { id: number; class: string; classId: string; subject: string; subjectCode: string; grade: string; subjectStatus: string; students: number }
interface Request { id: number; classId: string; class: string; subject: { code: string; name: string; status: string }; status: string; note: string }
interface CatalogueRow { code: string; name: string; status: string; inClass: boolean }

let autoOpened = false; // open the only class straight away, once per visit
const dismissed = (): number[] => { try { return JSON.parse(localStorage.getItem('edusaas_dismissed') || '[]'); } catch { return []; } };

export default function TeacherHome() {
  const { me } = useSession();
  const toast = useToast();
  const { data, error, reload } = useLoad(() => Promise.all([get<Assignment[]>('teacher/assignments'), get<Request[]>('teacher/subject-requests')]));
  const [adding, setAdding] = useState(false);
  const [gone, setGone] = useState(dismissed);
  const open = data ? data[1].filter((r) => r.status === 'pending' || (r.status === 'declined' && !gone.includes(r.id))) : [];
  useEffect(() => {
    if (data && data[0].length === 1 && !open.length && !autoOpened) { autoOpened = true; go('#/class/' + data[0][0].id); }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!data) return <Skeleton rows={2} />;
  const [list] = data;
  function dismiss(id: number) {
    const ids = [...gone, id];
    try { localStorage.setItem('edusaas_dismissed', JSON.stringify(ids)); } catch { /* ignore */ }
    setGone(ids);
  }
  return (
    <>
      <OfflineBanner />
      <p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>{todayLong()}</p><h1 className="text-[22px] leading-tight my-1 font-bold">{me.name}</h1><p className="text-on-surface-variant text-[14px]">{me.college}</p>
      <h2 className="flex gap-2.5 items-center justify-between text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">My classes<button className="sm" onClick={() => setAdding(true)}><Icon name="plus2" sm />Add subject</button></h2>
      {list.length ? (
        <div className="lesson-list">
          {list.map((a) => (
            <a key={a.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5" href={'#/class/' + a.id}><div className="flex gap-3 items-center">
              <span className="sicon"><SubjectIcon code={a.subjectCode} /></span>
              <div className="flex-1 min-w-0"><b>{a.class}</b><div className="flex gap-3 flex-wrap text-on-surface-variant text-[13px] mt-0.5"><span>{a.subject}</span><span>{a.students} students</span>
                {a.subjectStatus !== 'live' && <Badge tone="neutral">Coming soon</Badge>}</div></div></div></a>
          ))}
        </div>
      ) : <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px]">You are not assigned to any class yet. Please contact the college admin.</div>}
      {open.length > 0 && (
        <>
          <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Your subject requests</h2>
          {open.map((r) => {
            const dec = r.status === 'declined';
            return (
              <div key={r.id} className={'card tight' + (dec ? '' : ' locked')}><div className="flex gap-2.5 items-center">
                <span className="sicon"><SubjectIcon code={r.subject.code} /></span>
                <div className="flex-1 min-w-0"><b>{r.class}</b><div className="flex gap-3 flex-wrap text-on-surface-variant text-[13px] mt-0.5"><span>{r.subject.name}</span>
                  {dec ? <Badge tone="pend">Declined</Badge> : <Badge tone="warn">Waiting for college admin</Badge>}</div>
                  {dec && r.note && <div className="text-on-surface-variant text-[14px] text-[13px]">{r.note}</div>}</div>
                {dec && <button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low" onClick={() => dismiss(r.id)}>Dismiss</button>}
              </div></div>
            );
          })}
        </>
      )}
      <AlertsCard teacher />
      {adding && <AddSubject list={list} onClose={() => setAdding(false)}
        onDone={(r) => { toast(`${r.subject.name} requested for ${r.class}. Waiting for the college admin.`); reload(); }} />}
    </>
  );
}

function AddSubject({ list, onClose, onDone }: { list: Assignment[]; onClose: () => void; onDone: (r: Request) => void }) {
  const classes = list.filter((a, i) => list.findIndex((b) => b.classId === a.classId) === i);
  const [classId, setClassId] = useState(classes[0]?.classId || '');
  const [rows, setRows] = useState<CatalogueRow[] | null>(null);
  const [pick, setPick] = useState('');
  const cls = classes.find((c) => c.classId === classId);
  useEffect(() => {
    if (!cls) return;
    setRows(null); setPick('');
    get<CatalogueRow[]>(`catalogue?grade=${parseInt(cls.grade, 10)}&classId=${encodeURIComponent(cls.classId)}`).then(setRows, () => setRows([]));
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!classes.length) return <Sheet title="Add a subject" confirm="OK" onClose={onClose} onConfirm={() => {}}>You need at least one class before you can add a subject.</Sheet>;
  return (
    <Sheet title="Add a subject" confirm="Send request" onClose={onClose}
      onConfirm={async () => {
        if (!pick) throw new Error('Choose a subject.');
        onDone(await post<Request>('teacher/subject-requests', { classId, subject: pick }));
      }}>
      <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ marginTop: 0 }}>Your college admin approves the request. Subjects without lessons yet show as “Coming soon”.</p>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="as-c">Class</label>
      <select id="as-c" value={classId} onChange={(e) => setClassId(e.target.value)}>
        {classes.map((c) => <option key={c.classId} value={c.classId}>{c.class}</option>)}
      </select>
      <fieldset className="choices"><legend className="block font-semibold text-[14px] mt-3.5 mb-1.5">Subject</legend>
        {!rows ? <span className="text-on-surface-variant text-[14px] text-[13px]">Loading…</span> : rows.map((r) => {
          const mine = list.some((a) => a.classId === classId && a.subjectCode === r.code), has = mine || r.inClass;
          return (
            <label key={r.code} className={'choice' + (has ? ' locked' : '')}>
              <input type="radio" name="as-sub" value={r.code} disabled={has} checked={pick === r.code} onChange={() => setPick(r.code)} />
              <SubjectIcon code={r.code} sm /><span className="flex-1 min-w-0">{r.name}</span>
              {mine ? <Badge tone="ok">You teach this</Badge> : has ? <Badge tone="neutral">Already taught here</Badge> : r.status !== 'live' && <Badge tone="neutral">Coming soon</Badge>}
            </label>
          );
        })}
      </fieldset>
    </Sheet>
  );
}
