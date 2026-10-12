import { useEffect, useState } from 'react';
import { get, post } from '../../lib/api';
import { initials, prettyPhone } from '../../lib/format';
import { useLoad } from '../../lib/useLoad';
import { Badge, ErrorCard, Icon, PhoneInput, Sheet, Skeleton, Tabs, useToast } from '../../ui';

export interface Person {
  id: string; name: string; role: 'student' | 'teacher' | 'parent'; phone: string; gender: string; active: boolean;
  class?: string; classId?: string; roll?: string; parent?: { id: string; name: string; phone: string };
  assignments?: string[]; children?: string[];
}
export interface ClassRow { id: string; name: string; grade: string; section: string; gender: string; academicYear: string; students: number;
  assignments: { id: number; teacher: string; teacherId: string; subject: string; subjectCode: string }[] }
const ROLES: [Person['role'], string][] = [['student', 'Students'], ['teacher', 'Teachers'], ['parent', 'Parents']];
const digits = (v: string) => v.replace(/\D/g, '').replace(/^0/, '');

export default function People({ args }: { args: string[] }) {
  const role = (ROLES.some(([r]) => r === args[0]) ? args[0] : 'student') as Person['role'];
  const [q, setQ] = useState(''), [query, setQuery] = useState('');
  useEffect(() => { const id = window.setTimeout(() => setQuery(q.trim()), 300); return () => window.clearTimeout(id); }, [q]);
  const { data, error, reload } = useLoad(() => get<Person[]>(`admin/people?role=${role}${query ? '&q=' + encodeURIComponent(query) : ''}`), [role, query]);
  const classes = useLoad(() => get<ClassRow[]>('admin/classes'));
  const [editing, setEditing] = useState<Person | 'new' | null>(null);
  const toast = useToast();
  const label = { student: 'student', teacher: 'teacher', parent: 'parent' }[role];
  return (
    <>
      <h1 className="flex gap-2.5 items-center justify-between text-[22px] leading-tight my-1 font-bold">People<button className="sm inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer" onClick={() => {
        if (role === 'student' && classes.data && !classes.data.length) toast('Create a class first, under Classes.');
        else setEditing('new');
      }}><Icon name="plus2" sm />Add</button></h1>
      <Tabs label="People" current={role} items={ROLES.map(([r, l]) => ({ key: r, href: '#/people/' + r, label: l }))} />
      <input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" type="text" placeholder="Search by name, phone or roll number" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ marginTop: 10 }}>
        {error ? <ErrorCard error={error} onRetry={reload} /> : !data ? <Skeleton /> : data.length ? (
          <>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5" style={{ padding: '4px 8px' }}>
              {data.map((p) => (
                <button key={p.id} className={'person' + (p.active ? '' : ' off')} onClick={() => setEditing(p)}>
                  <span className="w-10 h-10 rounded-full flex-none grid place-items-center bg-surface-container-low text-on-surface-variant font-bold text-[14px]">{initials(p.name)}</span>
                  <span className="flex-1 min-w-0"><b>{p.name}</b>{!p.active && <> <Badge tone="pend">Suspended</Badge></>}
                    <span className="text-on-surface-variant text-[14px] text-[13px]">{prettyPhone(p.phone)} · {p.role === 'student' ? `${p.class} · Roll ${p.roll} · parent ${p.parent?.name}`
                      : p.role === 'teacher' ? (p.assignments?.length ? p.assignments.join(', ') : 'No classes yet')
                      : (p.children?.length ? 'Parent of ' + p.children.join(', ') : 'No children linked')}</span></span>
                  <Icon name="chev" sm />
                </button>
              ))}
            </div>
            <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ textAlign: 'center' }}>{data.length} shown</p>
          </>
        ) : <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px] text-[13px]">{query ? `Nobody matches “${query}”.` : 'Nobody here yet. Use Add, or import a file.'}</div>}
      </div>
      {editing === 'new' && <AddPerson role={role} label={label} classes={classes.data || []} onClose={() => setEditing(null)}
        onDone={(p) => { toast(p.name + ' added.'); reload(); }} />}
      {editing && editing !== 'new' && <EditPerson p={editing} classes={classes.data || []} onClose={() => setEditing(null)}
        onDone={(msg) => { toast(msg); reload(); }} />}
    </>
  );
}

function AddPerson({ role, label, classes, onClose, onDone }: { role: Person['role']; label: string; classes: ClassRow[]; onClose: () => void; onDone: (p: Person) => void }) {
  const [f, setF] = useState({ name: '', phone: '', gender: role === 'parent' ? 'female' : 'male', classId: classes[0]?.id || '', roll: '', parentPhone: '', parentName: '' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Sheet title={'Add a ' + label} confirm={'Add ' + label} onClose={onClose}
      onConfirm={async () => onDone(await post<Person>('admin/people', {
        role, name: f.name.trim(), phone: digits(f.phone), gender: f.gender,
        ...(role === 'student' ? { classId: f.classId, roll: f.roll.trim(), parentPhone: digits(f.parentPhone), parentName: f.parentName.trim() } : {}),
      }))}>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="pn">Full name</label><input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="pn" type="text" value={f.name} onChange={set('name')} />
      <PhoneInput id="pp" label="Mobile number" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="pg">Gender</label>
      <select id="pg" value={f.gender} onChange={set('gender')}><option value="male">Male</option><option value="female">Female</option></select>
      {role === 'student' && (
        <>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="pc">Class</label>
          <select id="pc" value={f.classId} onChange={set('classId')}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="pr">Roll number</label><input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="pr" type="text" placeholder="e.g. 11A-07" value={f.roll} onChange={set('roll')} />
          <div className="sheet-sub">Parent</div>
          <PhoneInput id="ppp" label="Parent’s mobile number" value={f.parentPhone} onChange={(v) => setF({ ...f, parentPhone: v })} />
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="ppn">Parent’s full name</label>
          <input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="ppn" type="text" placeholder="Leave blank if the parent is already registered" value={f.parentName} onChange={set('parentName')} />
        </>
      )}
      <p className="text-on-surface-variant text-[14px] text-[13px]">They sign in with this number. Nobody else can use it.</p>
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
    <Sheet title={p.name} confirm="Save changes" onClose={onClose}
      onConfirm={async () => {
        await post('admin/people/' + p.id, { name: f.name.trim(), phone: digits(f.phone), ...(p.role === 'student' ? { classId: f.classId, roll: f.roll.trim() } : {}) });
        onDone('Saved.');
      }}>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="pn">Full name</label><input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="pn" type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <PhoneInput id="pp" label="Mobile number" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
      {p.role === 'student' && (
        <>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="pc">Class</label>
          <select id="pc" value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value })}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="pr">Roll number</label><input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="pr" type="text" value={f.roll} onChange={(e) => setF({ ...f, roll: e.target.value })} />
          <p className="text-on-surface-variant text-[14px] text-[13px]">Parent: {p.parent?.name}, {prettyPhone(p.parent?.phone)}. Open the Parents tab to change the parent’s details.</p>
        </>
      )}
      <div className="sheet-sub">Account</div>
      {p.active ? (
        <>
          <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ margin: '4px 0' }}>Suspending signs them out and stops them signing in. Records are kept.</p>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="sr">Reason for suspending</label>
          <input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="sr" type="text" placeholder="e.g. Left the college" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
          <button className="block" style={{ marginTop: 8, color: 'var(--bad)' }} onClick={() => setActive(false)}>Suspend account</button>
        </>
      ) : (
        <><p className="text-[13px]"><Badge tone="pend">Suspended</Badge></p><button className="block" onClick={() => setActive(true)}>Reactivate account</button></>
      )}
      {error && <p className="text-[13px] text-error min-h-[1.2em] my-2" role="alert">{error}</p>}
    </Sheet>
  );
}
