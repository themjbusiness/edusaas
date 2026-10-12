import { useState } from 'react';
import { useSession } from '../../App';
import { get, post } from '../../lib/api';
import { todayLong, when } from '../../lib/format';
import { useLoad } from '../../lib/useLoad';
import { Badge, ErrorCard, OfflineBanner, Sheet, Skeleton, Stat, SubjectIcon, useToast } from '../../ui';

export interface AuditRow { id: number; action: string; type: string; summary: string; actor: string | null; at: string }
interface Overview {
  college: string; counts: { teachers: number; students: number; parents: number; classes: number };
  requests: { id: number; class: string; teacher: string; createdAt: string; subject: { code: string; name: string; status: string } }[];
  activity: AuditRow[];
}

export function ActivityList({ rows }: { rows: AuditRow[] }) {
  if (!rows.length) return <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px] text-[13px]">No activity yet.</div>;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5" style={{ padding: '4px 12px' }}>
      {rows.map((a) => <div key={a.id} className="flex items-center gap-2.5 py-2 border-b border-outline-variant"><div className="flex-1 min-w-0"><div>{a.summary}</div>
        <div className="text-on-surface-variant text-[14px] text-[13px]">{(a.actor || 'EduSaas team') + ' · ' + when(a.at)}</div></div></div>)}
    </div>
  );
}

export default function AdminHome() {
  const { me } = useSession();
  const toast = useToast();
  const { data: d, error, reload } = useLoad(() => get<Overview>('admin/overview'));
  const [declining, setDeclining] = useState<number | null>(null);
  const [note, setNote] = useState('');
  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!d) return <Skeleton rows={3} />;
  async function decide(id: number, approve: boolean, n = '') {
    const r = await post<{ subject: { name: string }; class: string }>(`admin/subject-requests/${id}/decide`, { approve, note: n });
    toast(approve ? `${r.subject.name} added to ${r.class}.` : 'Request declined. The teacher will see your note.');
    reload();
  }
  return (
    <>
      <OfflineBanner />
      <p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>{todayLong()}</p><h1 className="text-[22px] leading-tight my-1 font-bold">{d.college}</h1><p className="text-on-surface-variant text-[14px]">College admin · {me.name}</p>
      <div className="grid grid-cols-3 gap-2 my-3 four">
        <Stat value={d.counts.students} label="Students" href="#/people/student" />
        <Stat value={d.counts.teachers} label="Teachers" href="#/people/teacher" />
        <Stat value={d.counts.parents} label="Parents" href="#/people/parent" />
        <Stat value={d.counts.classes} label="Classes" href="#/classes" />
      </div>
      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Subject requests {d.requests.length > 0 && <Badge tone="warn">{d.requests.length} waiting</Badge>}</h2>
      {d.requests.length ? d.requests.map((r) => (
        <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 my-2.5">
          <div className="flex gap-2.5 items-center"><span className="sicon"><SubjectIcon code={r.subject.code} /></span>
            <div className="flex-1 min-w-0"><b>{r.subject.name} for {r.class}</b>
              <div className="text-on-surface-variant text-[14px] text-[13px]">Asked by {r.teacher} · {when(r.createdAt)}{r.subject.status === 'live' ? '' : ' · no lessons yet (Coming soon)'}</div></div></div>
          <div className="flex gap-2.5 items-center" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="sm" onClick={() => { setNote(''); setDeclining(r.id); }}>Decline…</button>
            <button className="sm inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer" onClick={() => decide(r.id, true).catch((e) => toast(e.message))}>Approve</button>
          </div>
        </div>
      )) : <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px] text-[13px]">No requests waiting. Teachers ask for subjects from “My classes → Add subject”.</div>}
      <h2 className="flex gap-2.5 items-center justify-between text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Recent activity <a className="text-[13px]" href="#/activity">See all</a></h2>
      <ActivityList rows={d.activity} />
      {declining != null && (
        <Sheet title="Decline this request" confirm="Decline" onClose={() => setDeclining(null)} onConfirm={() => decide(declining, false, note.trim())}>
          <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="dn">Note for the teacher (optional)</label>
          <textarea id="dn" rows={3} maxLength={200} placeholder="For example: Ms. Hira already teaches this class" value={note} onChange={(e) => setNote(e.target.value)} />
        </Sheet>
      )}
    </>
  );
}
