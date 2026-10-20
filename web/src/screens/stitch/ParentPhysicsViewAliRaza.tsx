import { useSession } from '../../App';
import { get } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Skeleton, SubjectIcon } from '../../ui';

interface Topic { id: string; topic: string; title: string; status: 'passed' | 'quiz_ready' | 'listening' | 'not_started'; heardShare: number; best: number | null; missed: boolean; cleared: boolean }
interface ChildSubject {
  child: { id: string; name: string; class: string }; subject: { code: string; name: string; status: string };
  passMark: number; quizSize: number; units: { number: number; title: string; status: string; topics: Topic[] }[];
}

export function ParentPhysicsViewAliRaza({ args }: { args?: string[] }) {
  const { me } = useSession();
  const { subj } = useI18n();
  const sid = args?.[0] || '';
  const code = args?.[1] || '';
  const { data: d, error, reload } = useLoad(() => get<ChildSubject>(`parent/children/${encodeURIComponent(sid)}/subjects/${encodeURIComponent(code)}`), [sid, code]);
  
  if (error) return (
    <main className="flex-1 w-full bg-surface pt-16 pb-safe px-margin-mobile">
      <a className="flex items-center gap-1 text-primary font-label-md text-[14px] mb-4" href="#/parent">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span> My child
      </a>
      <ErrorCard error={error} onRetry={reload} />
    </main>
  );
  if (!d) return <Skeleton rows={6} />;

  const soon = d.units.filter((u) => u.status !== 'live').length;
  const liveUnits = d.units.filter(u => u.status === 'live');

  return (
    <main className="flex-1 w-full bg-surface pt-16 pb-safe min-h-screen">
      <div className="flex flex-col w-full">
        <div className="px-margin-mobile pt-space-md pb-space-xl flex flex-col gap-space-md">
          
          <a className="flex items-center gap-1 text-on-surface-variant hover:text-primary font-label-md text-[14px] transition-colors -mb-2" href="#/parent">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> {d.child.name}
          </a>

          {/* Subject Hero Profile */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
            <div className="flex items-start gap-space-md">
              <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
                <SubjectIcon code={d.subject.code} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-space-xs">
                  <h1 className="font-headline-lg-mobile text-[24px] font-bold text-primary tracking-tight truncate">{subj(d.subject.name)}</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-container-high text-primary">
                    Compulsory
                  </span>
                </div>
                <p className="font-label-lg text-[14px] text-on-surface font-bold truncate mt-0.5">{d.child.name} · {d.child.class}</p>
                <p className="font-body-sm text-[12px] text-on-surface-variant truncate">{me?.college || 'FBISE Affiliated College'}</p>
              </div>
            </div>
            {/* Quick Summary Pills */}
            <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-[13px] font-bold">
                <span className="material-symbols-outlined text-[14px]">verified</span> FBISE Syllabus 2024–25
              </span>
            </div>
          </div>

          {/* FBISE Guardian Rule Notification Strip */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm shadow-sm border border-outline-variant/30">
            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px] text-primary">info</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-[14px] text-primary font-bold">Attendance & Quiz Policy</span>
              <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5 leading-relaxed">
                After each lesson there is a {d.quizSize}-question quiz. {d.passMark} correct answers is a pass. A missed lecture is cleared when the quiz is passed.
              </p>
            </div>
          </div>

          {/* Units */}
          {liveUnits.map((u) => {
            const passed = u.topics.filter(t => t.status === 'passed').length;
            const total = u.topics.length;
            const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
            
            return (
              <div key={u.number} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
                <div className="p-space-md bg-surface-container-low flex items-center justify-between gap-space-sm border-b border-outline-variant/30">
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-[11px] text-primary tracking-wider uppercase font-bold">Unit {u.number}</span>
                    <span className="font-label-lg text-[16px] text-on-surface font-bold truncate">{u.title}</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-md text-[12px] font-bold shrink-0">
                    {passed} of {total} cleared
                  </span>
                </div>
                {/* Unit Progress Meter Bar */}
                <div className="w-full bg-surface-container-high h-1.5">
                  <div className="bg-secondary h-1.5 rounded-r-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                </div>

                <div className="p-space-md flex flex-col gap-0 divide-y divide-surface-container-high/60">
                  {u.topics.map((tp) => {
                    const isPassed = tp.status === 'passed';
                    const isQuizReady = tp.status === 'quiz_ready';
                    const isListening = tp.status === 'listening';
                    const isMissed = tp.missed;
                    const isCleared = tp.cleared;

                    return (
                      <div key={tp.id} className={`flex items-start justify-between gap-space-sm p-space-sm rounded-lg transition-colors ${isQuizReady ? 'bg-error-container/20' : isListening ? 'hover:bg-surface-container-low/50' : isPassed ? 'hover:bg-surface-container-low/50' : 'opacity-85'}`}>
                        <div className="flex items-start gap-space-sm min-w-0 flex-1">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container text-primary font-label-md text-[14px] font-bold shrink-0 mt-0.5">
                            {tp.topic}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-label-lg text-[14px] text-on-surface font-bold leading-snug">{tp.title}</span>
                            {isMissed && !isCleared && (
                              <div className="inline-flex items-center gap-1 mt-1 text-error">
                                <span className="material-symbols-outlined text-[15px]">error</span>
                                <span className="font-label-sm text-[12px] font-bold">Missed lecture, not cleared yet</span>
                              </div>
                            )}
                            {isCleared && (
                              <div className="inline-flex items-center gap-1 mt-1 text-on-secondary-container">
                                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                                <span className="font-label-sm text-[12px] font-bold">Missed, now cleared</span>
                              </div>
                            )}
                            {isListening && (
                              <div className="inline-flex items-center gap-1 mt-1 text-on-surface-variant">
                                <span className="material-symbols-outlined text-[15px]">graphic_eq</span>
                                <span className="font-label-sm text-[12px]">Lecture audio in progress</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          {isPassed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[12px] font-bold shadow-sm">
                              <span className="material-symbols-outlined text-[14px]">done_all</span> Passed {tp.best}/5
                            </span>
                          ) : isQuizReady ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-[12px] font-bold">
                              <span className="material-symbols-outlined text-[14px]">quiz</span> Quiz ready
                            </span>
                          ) : isListening ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-md text-[12px] font-bold">
                              <span className="material-symbols-outlined text-[14px]">headphones</span> {Math.round(tp.heardShare * 100)}% heard
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[12px] font-bold">
                              — Not started
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Footer Note FBISE Curriculum Sync Banner */}
          {soon > 0 && (
            <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col items-center text-center gap-space-xs mt-4">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-1">
                <span className="material-symbols-outlined text-[18px]">auto_stories</span>
              </div>
              <span className="font-headline-sm text-[16px] font-bold text-primary">{soon} more unit{soon > 1 ? 's' : ''} coming soon</span>
              <p className="font-body-sm text-[13px] text-on-surface-variant max-w-[280px]">
                Curriculum modules are added as teachers publish lectures and FBISE syllabus updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
