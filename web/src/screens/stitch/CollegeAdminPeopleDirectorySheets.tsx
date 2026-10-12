import { useEffect, useState } from 'react';
import { useSession } from '../../App';
import { get, post } from '../../lib/api';
import { initials, prettyPhone } from '../../lib/format';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Sheet, Skeleton, useToast } from '../../ui';

export interface Person {
  id: string; name: string; role: 'student' | 'teacher' | 'parent'; phone: string; gender: string; active: boolean;
  class?: string; classId?: string; roll?: string; parent?: { id: string; name: string; phone: string };
  assignments?: string[]; children?: string[];
}
export interface ClassRow { id: string; name: string; grade: string; section: string; gender: string; academicYear: string; students: number;
  assignments: { id: number; teacher: string; teacherId: string; subject: string; subjectCode: string }[] }

const ROLES: [Person['role'], string][] = [['student', 'Students'], ['teacher', 'Teachers'], ['parent', 'Parents']];
const digits = (v: string) => v.replace(/\D/g, '').replace(/^0/, '');

export function CollegeAdminPeopleDirectorySheets() {
  const { me } = useSession();
  const [role, setRole] = useState<Person['role']>('student');
  const [q, setQ] = useState(''), [query, setQuery] = useState('');
  useEffect(() => { const id = window.setTimeout(() => setQuery(q.trim()), 300); return () => window.clearTimeout(id); }, [q]);
  
  const { data, error, reload } = useLoad(() => get<Person[]>(`admin/people?role=${role}${query ? '&q=' + encodeURIComponent(query) : ''}`), [role, query]);
  const classes = useLoad(() => get<ClassRow[]>('admin/classes'));
  
  const [editing, setEditing] = useState<Person | 'new' | null>(null);
  const toast = useToast();

  const label = { student: 'student', teacher: 'teacher', parent: 'parent' }[role];

  return (
    <main className="flex flex-col relative w-full pt-16 pb-20 px-margin-mobile bg-surface min-h-screen">
      <div className="flex flex-col w-full pb-6">
        
        {/* ADMIN PERSONA & SUB-HEADER */}
        <div className="flex flex-col gap-space-xs mb-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined text-[14px]">verified</span>
              </span>
              <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-semibold">Logged in: {me.name} (Registrar)</span>
            </div>
            <span className="font-label-sm text-[11px] bg-surface-container-high text-primary px-2.5 py-0.5 rounded-full font-medium">FBISE Session 2024-25</span>
          </div>
          
          {/* TITLE ROW WITH ACTION BUTTON */}
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="font-headline-lg-mobile text-[24px] text-primary font-bold">People</h1>
              <p className="font-body-sm text-[14px] text-on-surface-variant">{me.college} records</p>
            </div>
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-container text-on-primary rounded-xl font-label-lg text-[14px] font-bold shadow-sm active:opacity-90 transition-opacity" onClick={() => {
              if (role === 'student' && classes.data && !classes.data.length) toast('Create a class first, under Classes.');
              else setEditing('new');
            }}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* PILL TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-space-md no-scrollbar">
          {ROLES.map(([r, l]) => (
            <button key={r} onClick={() => setRole(r)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-label-md text-[14px] font-bold shadow-sm shrink-0 ${role === r ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`} type="button">
              <span>{l}</span>
            </button>
          ))}
        </div>

        {/* SEARCH INPUT WITH CONTROLS */}
        <div className="relative flex items-center mb-space-md">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input className="w-full h-12 pl-11 pr-10 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-[14px] shadow-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-0" placeholder="Search by name, phone or roll number" type="text" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button className="absolute right-3 flex items-center text-on-surface-variant hover:text-on-surface p-1" onClick={() => setQ('')} type="button">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        {/* DIRECTORY METRIC PILL */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="font-label-sm text-[12px] text-on-surface-variant">Active {role} Enrollments</span>
          <span className="font-label-sm text-[12px] text-secondary font-medium">FBISE Verified</span>
        </div>

        {/* STUDENT DIRECTORY LIST CARD */}
        {error ? <ErrorCard error={error} onRetry={reload} /> : !data ? <Skeleton rows={5} /> : data.length ? (
          <>
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col mb-space-md">
              {data.map((p, i) => (
                <div key={p.id}>
                  <div className={`p-3.5 flex items-center justify-between transition-colors cursor-pointer ${p.active ? 'hover:bg-surface-container-low' : 'bg-error-container/20 hover:bg-error-container/30 relative'}`} onClick={() => setEditing(p)}>
                    {!p.active && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error rounded-l-xl"></div>}
                    <div className={`flex items-center gap-3 min-w-0 pr-2 ${p.active ? '' : 'opacity-85'}`}>
                      <div className={`w-10 h-10 rounded-full font-label-lg text-[16px] font-bold flex items-center justify-center shrink-0 ${p.active ? 'bg-primary-container text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                        {initials(p.name)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-headline-sm text-[16px] font-bold truncate ${p.active ? 'text-on-surface' : 'text-on-surface line-through decoration-error/50'}`}>{p.name}</span>
                          {p.active ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[10px] font-semibold">
                              Suspended
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-[13px] text-on-surface-variant truncate mt-0.5">
                          {prettyPhone(p.phone)} · {p.role === 'student' ? `${p.class} · Roll ${p.roll} · parent ${p.parent?.name}` : p.role === 'teacher' ? (p.assignments?.length ? p.assignments.join(', ') : 'No classes') : (p.children?.length ? 'Parent of ' + p.children.join(', ') : 'No children')}
                        </span>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-[22px] shrink-0 ${p.active ? 'text-outline-variant' : 'text-error'}`}>chevron_right</span>
                  </div>
                  {i < data.length - 1 && <div className="h-[1px] bg-surface-container-high mx-3.5"></div>}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center py-2 mb-space-md">
              <p className="font-body-sm text-[13px] text-on-surface-variant flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
                Showing {data.length} {role}s
              </p>
            </div>
          </>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px]">{query ? `Nobody matches “${query}”.` : `No ${role}s here yet.`}</div>
        )}

      </div>
      
      {editing === 'new' && <AddPerson role={role} label={label} classes={classes.data || []} onClose={() => setEditing(null)}
        onDone={(p) => { toast(p.name + ' added.'); reload(); }} />}
      {editing && editing !== 'new' && <EditPerson p={editing} classes={classes.data || []} onClose={() => setEditing(null)}
        onDone={(msg) => { toast(msg); reload(); }} />}

    </main>
  );
}

function AddPerson({ role, label, classes, onClose, onDone }: { role: Person['role']; label: string; classes: ClassRow[]; onClose: () => void; onDone: (p: Person) => void }) {
  const [f, setF] = useState({ name: '', phone: '', gender: role === 'parent' ? 'female' : 'male', classId: classes[0]?.id || '', roll: '', parentPhone: '', parentName: '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  
  return (
    <Sheet title={`Add a ${label}`} confirm={`Add ${label}`} onClose={onClose}
      onConfirm={async () => onDone(await post<Person>('admin/people', {
        role, name: f.name.trim(), phone: digits(f.phone), gender: f.gender,
        ...(role === 'student' ? { classId: f.classId, roll: f.roll.trim(), parentPhone: digits(f.parentPhone), parentName: f.parentName.trim() } : {}),
      }))}>
      <div className="flex flex-col gap-3.5 py-2">
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-[13px] font-semibold text-on-surface">Full name <span className="text-error">*</span></label>
          <input className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 focus:ring-secondary border border-outline-variant" placeholder="e.g., Muhammad Bilal" type="text" value={f.name} onChange={set('name')} />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-[13px] font-semibold text-on-surface">Mobile number <span className="text-error">*</span></label>
          <div className="flex items-center h-11 rounded-xl bg-surface-container-low px-3.5 gap-2 focus-within:ring-2 focus-within:ring-secondary border border-outline-variant overflow-hidden">
            <span className="font-body-md text-[14px] font-bold text-primary shrink-0">+92</span>
            <span className="h-4 w-[1px] bg-outline-variant"></span>
            <input className="w-full bg-transparent text-on-surface font-body-md text-[14px] outline-none" placeholder="399 2220009" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: digits(e.target.value) })} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-md text-[13px] font-semibold text-on-surface">Gender <span className="text-error">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl font-label-md text-[14px] cursor-pointer transition-colors ${f.gender === 'male' ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-high text-primary'}`}>
              <input checked={f.gender === 'male'} className="hidden" name="gender" type="radio" value="male" onChange={set('gender')} />
              <span className="material-symbols-outlined text-[18px]">male</span>
              <span>Male</span>
            </label>
            <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl font-label-md text-[14px] cursor-pointer transition-colors ${f.gender === 'female' ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-high text-primary'}`}>
              <input checked={f.gender === 'female'} className="hidden" name="gender" type="radio" value="female" onChange={set('gender')} />
              <span className="material-symbols-outlined text-[18px]">female</span>
              <span>Female</span>
            </label>
          </div>
        </div>

        {role === 'student' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-[13px] font-semibold text-on-surface">Class <span className="text-error">*</span></label>
                <select className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 focus:ring-secondary border border-outline-variant" value={f.classId} onChange={set('classId')}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-[13px] font-semibold text-on-surface">Roll number <span className="text-error">*</span></label>
                <input className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 focus:ring-secondary border border-outline-variant" placeholder="e.g., 11A-06" type="text" value={f.roll} onChange={set('roll')} />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-label-sm text-[11px] text-primary uppercase font-bold tracking-wider">Parent</span>
                <div className="h-[1px] flex-1 bg-surface-container-high"></div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-[13px] font-semibold text-on-surface">Parent's mobile number <span className="text-error">*</span></label>
                  <div className="flex items-center h-11 rounded-xl bg-surface-container-low px-3.5 gap-2 focus-within:ring-2 focus-within:ring-secondary border border-outline-variant overflow-hidden">
                    <span className="font-body-md text-[14px] font-bold text-primary shrink-0">+92</span>
                    <span className="h-4 w-[1px] bg-outline-variant"></span>
                    <input className="w-full bg-transparent text-on-surface font-body-md text-[14px] outline-none" placeholder="300 1234567" type="tel" value={f.parentPhone} onChange={(e) => setF({ ...f, parentPhone: digits(e.target.value) })} />
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">They sign in with this number. Nobody else can use it.</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-[13px] font-semibold text-on-surface">Parent's full name</label>
                  <input className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 focus:ring-secondary border border-outline-variant" placeholder="e.g., Mrs. Aisha Bilal" type="text" value={f.parentName} onChange={set('parentName')} />
                  <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight">Leave blank if the parent is already registered</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

function EditPerson({ p, classes, onClose, onDone }: { p: Person; classes: ClassRow[]; onClose: () => void; onDone: (msg: string) => void }) {
  const [f, setF] = useState({ name: p.name, phone: p.phone.replace(/^\+92/, ''), classId: p.classId || '', roll: p.roll || '', reason: '' });
  const [error, setError] = useState('');
  
  async function setActive(active: boolean) {
    setError('');
    try {
      await post('admin/people/' + p.id, active ? { active } : { active, reason: f.reason.trim() });
      onClose(); onDone(p.name + (active ? ' reactivated.' : ' suspended.'));
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <Sheet title={`Edit ${p.role} · ${p.name}`} confirm="Save changes" onClose={onClose}
      onConfirm={async () => {
        await post('admin/people/' + p.id, { name: f.name.trim(), phone: digits(f.phone), ...(p.role === 'student' ? { classId: f.classId, roll: f.roll.trim() } : {}) });
        onDone('Saved.');
      }}>
      
      <div className="flex flex-col gap-4 py-2">
        <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Registered Contact</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-[10px] ${p.active ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container font-bold'}`}>
              {p.active ? 'Active' : 'Suspended'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body-md text-[14px] font-semibold text-primary">{prettyPhone(p.phone)}</span>
            <span className="font-body-sm text-[13px] text-on-surface-variant">{p.role === 'student' ? p.parent?.name : ''}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-label-md text-[13px] font-semibold text-on-surface">Full name</label>
          <input className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 border border-outline-variant" type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-[13px] font-semibold text-on-surface">Mobile number</label>
          <div className="flex items-center h-11 rounded-xl bg-surface-container-low px-3.5 gap-2 focus-within:ring-2 focus-within:ring-secondary border border-outline-variant overflow-hidden">
            <span className="font-body-md text-[14px] font-bold text-primary shrink-0">+92</span>
            <span className="h-4 w-[1px] bg-outline-variant"></span>
            <input className="w-full bg-transparent text-on-surface font-body-md text-[14px] outline-none" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: digits(e.target.value) })} />
          </div>
        </div>

        {p.role === 'student' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-[13px] font-semibold text-on-surface">Class</label>
              <select className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 focus:ring-secondary border border-outline-variant" value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-[13px] font-semibold text-on-surface">Roll number</label>
              <input className="h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 focus:ring-secondary border border-outline-variant" type="text" value={f.roll} onChange={(e) => setF({ ...f, roll: e.target.value })} />
            </div>
          </div>
        )}

        {p.active ? (
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-[11px] text-error uppercase font-bold tracking-wider">Account Action</span>
              <div className="h-[1px] flex-1 bg-surface-container-high"></div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-high flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant leading-tight">
                Suspending removes portal access and pauses SMS/WhatsApp dispatches.
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-[13px] font-semibold text-on-surface">Reason for suspension <span className="text-error">*</span></label>
              <textarea className="p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-[14px] outline-none focus:ring-2 focus:ring-error border border-outline-variant resize-none" placeholder="e.g. Left the college" rows={2} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })}></textarea>
            </div>
            <button className="w-full h-11 rounded-xl bg-error-container text-on-error-container font-label-lg text-[14px] font-bold flex items-center justify-center gap-2 active:opacity-90 mt-1" type="button" onClick={() => setActive(false)}>
              <span className="material-symbols-outlined text-[18px]">person_off</span>
              Suspend account
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            <button className="w-full h-11 rounded-xl bg-secondary text-on-secondary font-label-lg text-[14px] font-bold shadow-sm flex items-center justify-center gap-2 active:opacity-90" type="button" onClick={() => setActive(true)}>
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Reactivate account
            </button>
          </div>
        )}

        {error && <p className="text-[13px] text-error min-h-[1.2em]" role="alert">{error}</p>}
      </div>
    </Sheet>
  );
}
