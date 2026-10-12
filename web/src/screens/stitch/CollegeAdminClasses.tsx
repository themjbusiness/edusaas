import { useState } from 'react';
import { useSession } from '../../App';
import { del, get, post } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Sheet, Skeleton, SubjectIcon, useToast } from '../../ui';
import type { ClassRow, Person } from '../admin/People';

const GENDER: Record<string, string> = { male: 'Boys', female: 'Girls', mixed: 'Mixed' };

export function CollegeAdminClasses() {
  const { me } = useSession();
  const toast = useToast();
  const { data, error, reload } = useLoad(() => get<ClassRow[]>('admin/classes'));
  const [adding, setAdding] = useState(false);
  const [assignTo, setAssignTo] = useState<ClassRow | null>(null);
  const [removing, setRemoving] = useState<ClassRow['assignments'][number] | null>(null);

  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!data) return <Skeleton rows={4} />;

  const studentsTotal = data.reduce((sum, c) => sum + c.students, 0);

  return (
    <main className="flex flex-col relative w-full pt-16 pb-24 bg-background min-h-screen px-margin-mobile">
      <div className="flex flex-col w-full pb-8">
        
        {/* Logged-in Identity & Academic Session Sub-banner */}
        <div className="w-full bg-surface-container-high rounded-xl p-space-sm mb-space-md shadow-sm">
          <div className="flex items-center justify-between gap-space-xs">
            <div className="flex items-center gap-space-xs min-w-0">
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0 animate-pulse"></span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate uppercase tracking-wider">Logged In: {me?.name} (Admin)</span>
                <span className="font-body-sm text-body-sm text-primary font-semibold truncate">HSSC & SSC Operations</span>
              </div>
            </div>
            <div className="shrink-0 px-2.5 py-1 bg-surface-container-lowest rounded-full shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[14px]">event_note</span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">2026–2027</span>
            </div>
          </div>
        </div>

        {/* Page Header & New Class Trigger */}
        <div className="flex items-center justify-between gap-space-sm mb-space-md">
          <div className="flex flex-col min-w-0">
            <h2 className="font-headline-lg-mobile text-[24px] text-primary tracking-tight font-bold">Classes</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Active FBISE sections & faculty allocations</p>
          </div>
          <button className="shrink-0 min-h-[44px] px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-[14px] shadow-sm flex items-center gap-1.5 active:scale-95 transition font-bold" onClick={() => setAdding(true)}>
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New class</span>
          </button>
        </div>

        {/* Class Cards Stack */}
        <div className="flex flex-col gap-space-md">
          {data.length === 0 ? (
            <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm text-on-surface-variant font-body-sm">
              No classes yet. Create one, then add students.
            </div>
          ) : data.map((c) => (
            <div key={c.id} className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
              <div className="flex items-start justify-between gap-space-sm mb-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm font-bold shrink-0 shadow-sm">
                    {c.section}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-headline-sm text-[16px] text-primary truncate font-bold">{c.name}</h3>
                      <span className="w-2 h-2 rounded-full bg-secondary shrink-0" title="Active Section"></span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-[12px]">
                      <span>{c.academicYear}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">{c.gender === 'male' ? 'male' : c.gender === 'female' ? 'female' : 'wc'}</span>
                        <span>{GENDER[c.gender]}</span>
                      </span>
                      <span>•</span>
                      <span className="text-secondary font-semibold">{c.students} students</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-semibold shrink-0 uppercase tracking-wider">{c.grade}</span>
              </div>
              
              {/* Teachers Subsection */}
              <div className="mt-space-sm pt-2 bg-surface-container-low rounded-xl p-2.5">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase">Assigned Teachers ({c.assignments.length})</span>
                  {c.assignments.length > 0 && <span className="font-label-sm text-[11px] text-secondary font-semibold">Verified</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  {c.assignments.length === 0 ? (
                    <p className="text-on-surface-variant text-[12px] p-2">No teachers yet.</p>
                  ) : c.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 text-[18px]">
                          <SubjectIcon code={a.subjectCode} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-[13px] text-on-surface truncate font-semibold">{a.teacher}</span>
                          <span className="font-body-sm text-[12px] text-on-surface-variant truncate">{a.subject}</span>
                        </div>
                      </div>
                      <button aria-label={`Remove ${a.teacher} from ${a.subject}`} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition" onClick={() => setRemoving(a)}>
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Assign teacher button */}
                <button className="mt-2.5 w-full min-h-[44px] py-2 px-3 bg-surface-container hover:bg-surface-container-high rounded-xl text-primary font-label-md text-[13px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-[0.99]" onClick={() => setAssignTo(c)}>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Assign teacher</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Counter Footer Bar */}
        {data.length > 0 && (
          <div className="mt-space-md p-space-sm bg-surface-container rounded-xl flex items-center justify-between text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">groups</span>
              <span className="font-body-sm text-[13px] font-medium">Showing <strong>{data.length} active classes</strong></span>
            </div>
            <span className="font-label-sm text-[11px] font-semibold px-2.5 py-1 bg-surface-container-lowest text-primary rounded-full shadow-sm">{studentsTotal} students enrolled</span>
          </div>
        )}
      </div>

      {adding && <NewClass onClose={() => setAdding(false)} onDone={(n) => { toast(n + ' created.'); reload(); }} />}
      {assignTo && <Assign c={assignTo} onClose={() => setAssignTo(null)} onDone={() => { toast('Teacher assigned.'); reload(); }} />}
      
      {removing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity flex items-end justify-center">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl shadow-xl flex flex-col p-space-md space-y-space-md transform transition-transform duration-300">
            <div className="w-12 h-1 rounded-full bg-outline-variant self-center -mt-1 mb-1"></div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col pr-2">
                <h3 className="font-headline-sm text-[18px] text-primary font-bold">
                  Remove this teacher?
                </h3>
                <p className="font-body-sm text-[13px] text-on-surface-variant mt-1">
                  {removing.teacher} will no longer teach {removing.subject}. Attendance and clearances already recorded are kept.
                </p>
              </div>
              <button className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shrink-0" onClick={() => setRemoving(null)}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-4">
              <button className="min-h-[44px] px-4 rounded-xl bg-surface-container text-on-surface font-label-lg text-[14px] font-semibold hover:bg-surface-container-high transition-colors" onClick={() => setRemoving(null)}>
                Cancel
              </button>
              <button className="min-h-[44px] px-5 rounded-xl bg-error text-on-error font-label-lg text-[14px] font-semibold hover:bg-on-error-container active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm" onClick={async () => { await del('admin/assignments/' + removing.id); toast('Removed.'); setRemoving(null); reload(); }}>
                <span className="material-symbols-outlined text-[18px]">person_remove</span>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function NewClass({ onClose, onDone }: { onClose: () => void; onDone: (name: string) => void }) {
  const [f, setF] = useState({ grade: '11th', stream: 'Pre-Medical', section: 'A', gender: 'male', academicYear: '2026-2027' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  
  return (
    <Sheet title="New class" confirm="Create class" onClose={onClose}
      onConfirm={async () => onDone((await post<ClassRow>('admin/classes', { ...f, stream: f.stream.trim(), section: f.section.trim() })).name)}>
      <div className="flex flex-col space-y-4 pt-2 pb-4">
        <div>
          <label className="block font-label-md text-[13px] text-primary font-semibold mb-1.5">Grade / Academic Level</label>
          <select className="w-full h-12 bg-surface-container-low text-on-surface px-3.5 rounded-xl font-body-md text-[14px] outline-none focus:bg-surface-container-high transition border border-outline-variant" value={f.grade} onChange={set('grade')}>
            <option>9th</option>
            <option>10th</option>
            <option>11th</option>
            <option>12th</option>
          </select>
        </div>
        
        <div>
          <label className="block font-label-md text-[13px] text-primary font-semibold mb-1.5">FBISE Academic Stream</label>
          <input className="w-full h-12 bg-surface-container-low text-on-surface px-3.5 rounded-xl font-body-md text-[14px] outline-none focus:bg-surface-container-high transition border border-outline-variant" placeholder="e.g. Pre-Medical" type="text" value={f.stream} onChange={set('stream')} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-label-md text-[13px] text-primary font-semibold mb-1.5">Section Name</label>
            <input className="w-full h-12 bg-surface-container-low text-on-surface px-3.5 rounded-xl font-body-md text-[14px] outline-none focus:bg-surface-container-high transition border border-outline-variant" placeholder="e.g. A" type="text" value={f.section} onChange={set('section')} />
          </div>
          <div>
            <label className="block font-label-md text-[13px] text-primary font-semibold mb-1.5">Academic Session</label>
            <input className="w-full h-12 bg-surface-container-low text-on-surface px-3.5 rounded-xl font-body-md text-[14px] outline-none focus:bg-surface-container-high transition border border-outline-variant" type="text" value={f.academicYear} onChange={set('academicYear')} />
          </div>
        </div>
        
        <div>
          <label className="block font-label-md text-[13px] text-primary font-semibold mb-1.5">Campus Cohort / Gender</label>
          <select className="w-full h-12 bg-surface-container-low text-on-surface px-3.5 rounded-xl font-body-md text-[14px] outline-none focus:bg-surface-container-high transition border border-outline-variant" value={f.gender} onChange={set('gender')}>
            <option value="male">Boys</option>
            <option value="female">Girls</option>
            <option value="mixed">Co-ed</option>
          </select>
        </div>
      </div>
    </Sheet>
  );
}

function Assign({ c, onClose, onDone }: { c: ClassRow; onClose: () => void; onDone: () => void }) {
  const { data } = useLoad(() => Promise.all([get<Person[]>('admin/people?role=teacher'), get<{ code: string; name: string; status: string }[]>('catalogue?grade=' + parseInt(c.grade, 10))]));
  const teachers = data ? data[0].filter((x) => x.active) : [];
  const [teacher, setTeacher] = useState(''), [subject, setSubject] = useState('');
  
  return (
    <Sheet title={'Assign a teacher'} confirm="Assign" onClose={onClose} busy={!data}
      onConfirm={async () => {
        const tid = teacher || teachers[0]?.id, sub = subject || data?.[1][0]?.code;
        if (!tid) throw new Error('Add a teacher first, under People.');
        await post('admin/assignments', { teacherId: tid, classId: c.id, subject: sub }); onDone();
      }}>
      <p className="font-body-sm text-[13px] text-on-surface-variant mb-4">Allocate faculty to <strong>{c.name}</strong></p>
      
      {!data ? <span className="text-on-surface-variant text-[14px]">Loading…</span> : (
        <div className="flex flex-col space-y-4 pb-4">
          <div>
            <label className="block font-label-md text-[13px] text-primary font-semibold mb-1.5">Select Faculty Member</label>
            <select className="w-full h-12 bg-surface-container-low text-on-surface px-3.5 rounded-xl font-body-md text-[14px] outline-none focus:bg-surface-container-high transition border border-outline-variant" value={teacher || teachers[0]?.id || ''} onChange={(e) => setTeacher(e.target.value)}>
              {teachers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-label-md text-[13px] text-primary font-semibold mb-1.5">Assigned Subject</label>
            <select className="w-full h-12 bg-surface-container-low text-on-surface px-3.5 rounded-xl font-body-md text-[14px] outline-none focus:bg-surface-container-high transition border border-outline-variant" value={subject || data[1][0]?.code || ''} onChange={(e) => setSubject(e.target.value)}>
              {data[1].map((x) => <option key={x.code} value={x.code}>{x.name}{x.status === 'live' ? '' : ' (coming soon)'}</option>)}
            </select>
          </div>
          
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary-container/50 text-on-surface mt-2">
            <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">shield_person</span>
            <p className="font-body-sm text-[12px] leading-relaxed">
              Assigned faculty gain instant <strong>daily attendance clearance</strong> and SMS/WhatsApp alert dispatch permissions for enrolled parents in this section.
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
}
