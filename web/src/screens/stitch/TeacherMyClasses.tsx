import { useEffect, useState } from 'react';
import { useSession } from '../../App';
import { get, post } from '../../lib/api';
import { todayLong } from '../../lib/format';
import { go } from '../../lib/router';
import { useLoad } from '../../lib/useLoad';
import AlertsCard from '../../ui/AlertsCard';
import { ErrorCard, OfflineBanner, Sheet, Skeleton, SubjectIcon, useToast } from '../../ui';

export interface Assignment { id: number; class: string; classId: string; subject: string; subjectCode: string; grade: string; subjectStatus: string; students: number }
interface Request { id: number; classId: string; class: string; subject: { code: string; name: string; status: string }; status: string; note: string }
interface CatalogueRow { code: string; name: string; status: string; inClass: boolean }

let autoOpened = false; // open the only class straight away, once per visit
const dismissed = (): number[] => { try { return JSON.parse(localStorage.getItem('edusaas_dismissed') || '[]'); } catch { return []; } };

export function TeacherMyClasses() {
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
  if (!data) return <Skeleton rows={4} />;
  
  const [list] = data;
  
  function dismiss(id: number) {
    const ids = [...gone, id];
    try { localStorage.setItem('edusaas_dismissed', JSON.stringify(ids)); } catch { /* ignore */ }
    setGone(ids);
  }

  return (
    <main className="flex flex-col relative w-full pt-16 pb-24 px-margin-mobile bg-surface min-h-screen">
      <div className="flex flex-col w-full pb-6 space-y-4">
        <OfflineBanner />
        
        {/* Top Greeting & Faculty Badge */}
        <section className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{todayLong()}</span>
            <span className="bg-surface-container-high text-primary font-label-sm text-label-sm px-2.5 py-0.5 rounded-full font-semibold">
              ID: T-{me.id?.toString().padStart(4, '0') || '8402'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Assalam o alaikum,</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate">{me.name}</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                {me.college} · FBISE Faculty
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="font-label-lg text-label-lg text-on-primary font-bold">{me.name.substring(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </section>

        <AlertsCard teacher />

        {/* My Classes Section */}
        <section className="flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md text-on-surface font-semibold tracking-wider">MY CLASSES</span>
              <span className="w-5 h-5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm flex items-center justify-center font-bold">{list.length}</span>
            </div>
            <button className="inline-flex items-center gap-1 min-h-[44px] px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm active:bg-surface-container" type="button" onClick={() => setAdding(true)}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add subject</span>
            </button>
          </div>

          {list.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px]">You are not assigned to any class yet. Please contact the college admin.</div>
          ) : list.map((a) => (
            <a key={a.id} href={'#/class/' + a.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col space-y-3.5 transition-transform active:scale-[0.99] cursor-pointer block no-underline">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm text-[26px]">
                  <SubjectIcon code={a.subjectCode} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-headline-sm text-[16px] text-on-surface truncate font-bold">{a.subject}</h4>
                    <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {a.class} · {a.students} students
                  </p>
                </div>
              </div>
              {a.subjectStatus !== 'live' ? (
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col space-y-1">
                  <span className="font-label-sm text-label-sm font-semibold flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[15px]">hourglass_empty</span>
                    Coming soon
                  </span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant italic truncate">Curriculum assets in production</span>
                </div>
              ) : (
                <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col space-y-1">
                  <span className="font-label-sm text-[12px] font-semibold flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[15px]">play_circle</span>
                    Active Status
                  </span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant truncate">Live curriculum access</span>
                </div>
              )}
            </a>
          ))}
        </section>

        {/* Subject Requests Section */}
        {open.length > 0 && (
          <section className="flex flex-col space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-label-md text-[12px] text-on-surface font-semibold tracking-wider">YOUR SUBJECT REQUESTS</span>
                <span className="w-5 h-5 rounded-full bg-surface-container-highest text-primary font-label-sm text-[12px] flex items-center justify-center font-bold">{open.length}</span>
              </div>
            </div>

            {open.map((r) => {
              const dec = r.status === 'declined';
              return (
                <div key={r.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={dec ? "text-error text-[20px]" : "text-outline text-[20px]"}>
                        <SubjectIcon code={r.subject.code} />
                      </div>
                      <span className="font-label-lg text-[14px] text-on-surface truncate font-bold">{r.subject.name}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 font-label-sm text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0 ${dec ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-primary'}`}>
                      <span className="material-symbols-outlined text-[14px]">{dec ? 'cancel' : 'hourglass_empty'}</span>
                      {dec ? 'Declined' : 'Pending admin'}
                    </span>
                  </div>
                  <p className="font-body-sm text-[13px] text-on-surface-variant">
                    Requested for <span className="font-medium text-on-surface">{r.class}</span>
                  </p>
                  
                  {dec && r.note && (
                    <div className="bg-surface-container-low p-3 rounded-lg flex flex-col space-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-on-surface font-label-sm text-[12px] font-semibold">
                        <span className="material-symbols-outlined text-[16px] text-outline">speaker_notes</span>
                        Admin note:
                      </div>
                      <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
                        {r.note}
                      </p>
                    </div>
                  )}
                  {dec && (
                    <div className="flex items-center justify-end pt-0.5 mt-1">
                      <button className="min-h-[44px] px-3 inline-flex items-center text-outline hover:text-error font-label-md text-[13px] active:bg-surface-container-low rounded-lg transition-colors" type="button" onClick={() => dismiss(r.id)}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>

      {adding && <AddSubject list={list} onClose={() => setAdding(false)} onDone={(r) => { toast(`${r.subject.name} requested for ${r.class}. Waiting for the college admin.`); reload(); }} />}
    </main>
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
  }, [classId]);

  if (!classes.length) return <Sheet title="Add a subject" confirm="OK" onClose={onClose} onConfirm={() => {}}>You need at least one class before you can add a subject.</Sheet>;

  return (
    <Sheet title="Add a subject" confirm="Send request" onClose={onClose}
      onConfirm={async () => {
        if (!pick) throw new Error('Choose a subject.');
        onDone(await post<Request>('teacher/subject-requests', { classId, subject: pick }));
      }}>
      <p className="text-on-surface-variant text-[13px]" style={{ marginTop: 0 }}>Your college admin approves the request. Subjects without lessons yet show as “Coming soon”.</p>
      
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5 text-primary" htmlFor="as-c">Class</label>
      <select className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface mb-4" id="as-c" value={classId} onChange={(e) => setClassId(e.target.value)}>
        {classes.map((c) => <option key={c.classId} value={c.classId}>{c.class}</option>)}
      </select>
      
      <fieldset className="flex flex-col space-y-2">
        <legend className="block font-semibold text-[14px] mb-2 text-primary">Subject</legend>
        {!rows ? <span className="text-on-surface-variant text-[13px]">Loading…</span> : rows.map((r) => {
          const mine = list.some((a) => a.classId === classId && a.subjectCode === r.code);
          const has = mine || r.inClass;
          
          return (
            <label key={r.code} className={`flex items-center gap-3 p-3 rounded-xl border ${pick === r.code ? 'border-primary bg-primary-container/20' : 'border-outline-variant bg-surface-container-lowest'} ${has ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-container-low'}`}>
              <input className="accent-primary w-4 h-4" type="radio" name="as-sub" value={r.code} disabled={has} checked={pick === r.code} onChange={() => setPick(r.code)} />
              <div className="text-[20px] text-secondary">
                <SubjectIcon code={r.code} />
              </div>
              <span className="flex-1 min-w-0 font-medium text-[14px] text-on-surface">{r.name}</span>
              {mine ? <span className="bg-[#D3F1E2] text-[#047857] px-2 py-0.5 rounded text-[10px] font-bold">You teach this</span> 
               : has ? <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold">Already taught</span> 
               : r.status !== 'live' && <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-bold">Coming soon</span>}
            </label>
          );
        })}
      </fieldset>
    </Sheet>
  );
}
