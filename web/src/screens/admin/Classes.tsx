import { useState } from 'react';
import { del, get, post } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Icon, Sheet, Skeleton, SubjectIcon, useToast } from '../../ui';
import type { ClassRow, Person } from './People';

const GENDER: Record<string, string> = { male: 'Boys', female: 'Girls', mixed: 'Mixed' };

export default function Classes() {
  const toast = useToast();
  const { data, error, reload } = useLoad(() => get<ClassRow[]>('admin/classes'));
  const [adding, setAdding] = useState(false);
  const [assignTo, setAssignTo] = useState<ClassRow | null>(null);
  const [removing, setRemoving] = useState<ClassRow['assignments'][number] | null>(null);
  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!data) return <Skeleton />;
  return (
    <>
      <h1 className="flex gap-2.5 items-center justify-between text-[22px] leading-tight my-1 font-bold">Classes<button className="sm inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer" onClick={() => setAdding(true)}><Icon name="plus2" sm />New class</button></h1>
      {data.length ? (
        <div className="lesson-list">
          {data.map((c) => (
            <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5">
              <div className="flex gap-2.5 items-center"><span className="inline-grid place-items-center min-w-[44px] h-[44px] rounded-[10px] bg-[#e3f4f2] text-[#0b6f66] font-bold text-[15px]">{c.section}</span>
                <div className="flex-1 min-w-0"><b>{c.name}</b><div className="text-on-surface-variant text-[14px] text-[13px]">{c.academicYear} · {GENDER[c.gender]} · {c.students} students</div></div></div>
              <div className="text-on-surface-variant text-[14px] text-[13px]" style={{ margin: '10px 0 4px' }}>Teachers</div>
              {c.assignments.length ? c.assignments.map((a) => (
                <div key={a.id} className="asg"><SubjectIcon code={a.subjectCode} sm /><span className="flex-1 min-w-0"><b>{a.subject}</b> · {a.teacher}</span>
                  <button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low inline" aria-label={`Remove ${a.teacher} from ${a.subject}`} onClick={() => setRemoving(a)}><Icon name="cross" sm /></button></div>
              )) : <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ margin: 0 }}>No teachers yet.</p>}
              <button className="sm" style={{ marginTop: 8 }} onClick={() => setAssignTo(c)}><Icon name="plus2" sm />Assign teacher</button>
            </div>
          ))}
        </div>
      ) : <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px] text-[13px]">No classes yet. Create one, then add students.</div>}
      {adding && <NewClass onClose={() => setAdding(false)} onDone={(n) => { toast(n + ' created.'); reload(); }} />}
      {assignTo && <Assign c={assignTo} onClose={() => setAssignTo(null)} onDone={() => { toast('Teacher assigned.'); reload(); }} />}
      {removing && (
        <Sheet title="Remove this teacher?" confirm="Remove" onClose={() => setRemoving(null)}
          onConfirm={async () => { await del('admin/assignments/' + removing.id); toast('Removed.'); reload(); }}>
          <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ marginTop: 0 }}>{removing.teacher} will no longer teach {removing.subject}. Attendance and clearances already recorded are kept.</p>
        </Sheet>
      )}
    </>
  );
}

function NewClass({ onClose, onDone }: { onClose: () => void; onDone: (name: string) => void }) {
  const [f, setF] = useState({ grade: '11th', stream: '', section: '', gender: 'male', academicYear: '2026-2027' });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Sheet title="New class" confirm="Create class" onClose={onClose}
      onConfirm={async () => onDone((await post<ClassRow>('admin/classes', { ...f, stream: f.stream.trim(), section: f.section.trim() })).name)}>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="cg">Grade</label><select id="cg" value={f.grade} onChange={set('grade')}><option>11th</option><option>12th</option></select>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="cs">Stream</label><input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="cs" type="text" placeholder="e.g. Pre-Medical" value={f.stream} onChange={set('stream')} />
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="cx">Section</label><input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="cx" type="text" placeholder="e.g. A" value={f.section} onChange={set('section')} />
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="cgen">Students</label>
      <select id="cgen" value={f.gender} onChange={set('gender')}><option value="male">Boys</option><option value="female">Girls</option><option value="mixed">Mixed</option></select>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="cy">Academic year</label><input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="cy" type="text" value={f.academicYear} onChange={set('academicYear')} />
    </Sheet>
  );
}

function Assign({ c, onClose, onDone }: { c: ClassRow; onClose: () => void; onDone: () => void }) {
  const { data } = useLoad(() => Promise.all([get<Person[]>('admin/people?role=teacher'), get<{ code: string; name: string; status: string }[]>('catalogue?grade=' + parseInt(c.grade, 10))]));
  const teachers = data ? data[0].filter((x) => x.active) : [];
  const [teacher, setTeacher] = useState(''), [subject, setSubject] = useState('');
  return (
    <Sheet title={'Assign a teacher to ' + c.name} confirm="Assign" onClose={onClose} busy={!data}
      onConfirm={async () => {
        const tid = teacher || teachers[0]?.id, sub = subject || data?.[1][0]?.code;
        if (!tid) throw new Error('Add a teacher first, under People.');
        await post('admin/assignments', { teacherId: tid, classId: c.id, subject: sub }); onDone();
      }}>
      {!data ? <span className="text-on-surface-variant text-[14px] text-[13px]">Loading…</span> : (
        <>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="at">Teacher</label>
          <select id="at" value={teacher || teachers[0]?.id || ''} onChange={(e) => setTeacher(e.target.value)}>{teachers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="as">Subject</label>
          <select id="as" value={subject || data[1][0]?.code || ''} onChange={(e) => setSubject(e.target.value)}>
            {data[1].map((x) => <option key={x.code} value={x.code}>{x.name}{x.status === 'live' ? '' : ' (coming soon)'}</option>)}</select>
        </>
      )}
    </Sheet>
  );
}
