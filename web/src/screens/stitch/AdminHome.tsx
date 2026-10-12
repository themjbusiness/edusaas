import { useState } from 'react';
import { useSession } from '../../App';
import { get, post } from '../../lib/api';
import { when } from '../../lib/format';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Skeleton, useToast } from '../../ui';

export interface AuditRow { id: number; action: string; type: string; summary: string; actor: string | null; at: string }
interface Overview {
  college: string; counts: { teachers: number; students: number; parents: number; classes: number };
  requests: { id: number; class: string; teacher: string; createdAt: string; subject: { code: string; name: string; status: string } }[];
  activity: AuditRow[];
}

export function AdminHome() {
  const { me } = useSession();
  const toast = useToast();
  const { data: d, error, reload } = useLoad(() => get<Overview>('admin/overview'));
  const [declining, setDeclining] = useState<number | null>(null);
  const [note, setNote] = useState('');

  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!d) return <Skeleton rows={3} />;

  async function decide(id: number, approve: boolean, n = '') {
    try {
      const r = await post<{ subject: { name: string }; class: string }>(`admin/subject-requests/${id}/decide`, { approve, note: n });
      toast(approve ? `${r.subject.name} added to ${r.class}.` : 'Request declined. The teacher will see your note.');
      setDeclining(null);
      setNote('');
      reload();
    } catch (e) {
      toast((e as Error).message);
    }
  }

  const activeRequest = declining ? d.requests.find((r) => r.id === declining) : null;

  return (
    <main className="flex flex-col relative w-full pt-16 pb-20 px-margin-mobile bg-surface min-h-screen">
      <div className="flex flex-col w-full pb-6 space-y-space-md">
        
        {/* Institutional Welcome Banner */}
        <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">FBISE Affiliated Institution</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-sm text-label-sm font-medium">Session 2024-25</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm font-headline-sm text-headline-sm">
                {me?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-surface-container-low"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-headline-sm text-primary truncate">{me?.name || 'Administrator'}</span>
                <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-[10px]">ADMIN</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {d.college}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 gap-space-sm">
          <a href="#/people" className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Enrolled</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary leading-none">{d.counts.students}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Students</span>
            </div>
          </a>

          <a href="#/people" className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">co_present</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary leading-none">{d.counts.teachers}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Teachers</span>
            </div>
          </a>

          <a href="#/people" className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">family_restroom</span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Linked</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary leading-none">{d.counts.parents}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Parents</span>
            </div>
          </a>

          <a href="#/classes" className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">domain</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-lg text-headline-lg text-primary leading-none">{d.counts.classes}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Classes</span>
            </div>
          </a>
        </section>

        {/* Subject Requests */}
        <section className="flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <h2 className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant font-bold">Subject Requests</h2>
              {d.requests.length > 0 && <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">{d.requests.length} waiting</span>}
            </div>
          </div>

          {d.requests.length === 0 ? (
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm text-on-surface-variant font-body-sm">
              No requests waiting. Teachers ask for subjects from “My classes → Add subject”.
            </div>
          ) : d.requests.map((r) => (
            <div key={r.id} className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm transition-all duration-200 flex flex-col space-y-space-md">
              <div className="flex items-start gap-space-sm">
                <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-headline-sm text-headline-sm font-bold">{r.subject.name.substring(0, 1)}</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-label-lg text-label-lg text-primary font-semibold truncate">{r.subject.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold whitespace-nowrap">
                      Pending
                    </span>
                  </div>
                  <span className="font-body-md text-body-md font-medium text-on-surface">{r.class}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Asked by <strong className="font-semibold text-on-surface">{r.teacher}</strong> · {when(r.createdAt)}
                  </p>
                </div>
              </div>
              {r.subject.status !== 'live' && (
                <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-outline">info</span>
                  <span className="font-body-sm text-body-sm">No lessons created yet (Coming soon).</span>
                </div>
              )}
              <div className="flex items-center gap-space-sm pt-1">
                <button className="flex-1 min-h-[44px] px-3 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high active:bg-surface-variant transition-colors flex items-center justify-center gap-1.5" onClick={() => setDeclining(r.id)}>
                  <span className="material-symbols-outlined text-[18px]">close</span> Decline…
                </button>
                <button className="flex-1 min-h-[44px] px-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm" onClick={() => decide(r.id, true)}>
                  <span className="material-symbols-outlined text-[18px]">check</span> Approve
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Recent Activity */}
        <section className="flex flex-col space-y-space-xs">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant font-bold">Recent Activity</h2>
            <a className="font-label-sm text-label-sm text-secondary font-semibold hover:underline flex items-center gap-0.5" href="#/activity">
              See all <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
          
          {d.activity.length === 0 ? (
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm text-on-surface-variant font-body-sm">
              No activity yet.
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-sm flex flex-col space-y-space-xs">
              {d.activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">
                      {a.type === 'student' ? 'school' : a.type === 'teacher' ? 'co_present' : 'info'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="font-body-md text-body-md text-on-surface leading-snug">
                      <strong className="font-semibold text-primary">{a.action}:</strong> {a.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{a.actor || 'System'}</span>
                      <span className="w-1 h-1 rounded-full bg-outline"></span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{when(a.at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Decline Bottom Sheet Modal */}
      {declining != null && activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity flex items-end justify-center">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl shadow-xl flex flex-col p-space-md space-y-space-md transform transition-transform duration-300">
            <div className="w-12 h-1 rounded-full bg-outline-variant self-center -mt-1 mb-1"></div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col pr-2">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Decline {activeRequest.subject.name} for {activeRequest.class}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {activeRequest.teacher} will see this reason in the faculty portal.
                </p>
              </div>
              <button className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shrink-0" onClick={() => setDeclining(null)}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-md text-label-md text-primary font-semibold flex items-center justify-between" htmlFor="declineReasonInput">
                <span>Reason for refusal</span>
              </label>
              <textarea 
                className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all resize-none border border-outline-variant" 
                id="declineReasonInput" 
                placeholder="e.g. Please consult Dean of Sciences..." 
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-2">
              <button className="min-h-[44px] px-4 rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors" onClick={() => setDeclining(null)}>
                Cancel
              </button>
              <button className="min-h-[44px] px-5 rounded-xl bg-error text-on-error font-label-lg text-label-lg hover:bg-on-error-container active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm" onClick={() => decide(activeRequest.id, false, note.trim())}>
                <span className="material-symbols-outlined text-[18px]">block</span>
                Decline request
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
