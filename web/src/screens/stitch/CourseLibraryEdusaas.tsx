import { useEffect, useRef } from 'react';
import { get, type StudentHome, type SubjectDetail } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Skeleton, SubjectIcon } from '../../ui';

export function CourseLibraryEdusaas({ args }: { args?: string[] }) {
  const { subj } = useI18n();
  const home = useLoad(() => get<StudentHome>('student/home'));
  const subs = home.data?.subjects || [];
  const cur = subs.some((x) => x.code === args?.[0]) ? args![0] : subs[0]?.code;
  const detail = useLoad(() => (cur ? get<SubjectDetail>('student/subjects/' + encodeURIComponent(cur)) : Promise.resolve(null)), [cur]);
  const tabs = useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    tabs.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' }); 
  }, [cur]);

  if (home.error) return <ErrorCard error={home.error} onRetry={home.reload} />;
  const d = home.data;
  if (!d) return <Skeleton rows={6} />;

  const isLive = detail.data?.subject.status === 'live';
  
  return (
    <main className="flex flex-col relative w-full pt-16 pb-20 bg-surface min-h-screen">
      <div className="flex flex-col w-full">
        
        {/* Top Screen Title & Context Bar */}
        <div className="px-margin-mobile pt-space-md pb-space-sm flex flex-col gap-space-xs">
          <div className="flex items-center justify-between gap-space-sm">
            <div>
              <h1 className="font-headline-lg-mobile text-[24px] font-bold text-primary tracking-tight">Course library</h1>
              <p className="font-body-md text-[14px] text-on-surface-variant font-medium mt-0.5">{d.me.class} · {subs.length} subjects</p>
            </div>
          </div>
          
          {/* Quick Search Field */}
          <div className="mt-space-xs relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md font-[14px] shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-colors" placeholder="Search chapters, topics..." type="search" />
          </div>
        </div>

        {/* Subject Switcher Pills (Horizontal Scroll) */}
        <div className="pt-space-xs pb-space-md" ref={tabs}>
          <div className="flex items-center gap-space-xs px-margin-mobile overflow-x-auto no-scrollbar scroll-smooth">
            {subs.map((x) => {
              const active = x.code === cur;
              return (
                <a key={x.code} href={'#/library/' + x.code} aria-selected={active} className={`flex-shrink-0 flex items-center gap-2 h-11 px-4 rounded-xl shadow-sm transition-colors ${active ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'}`}>
                  <SubjectIcon code={x.code} sm />
                  <span className="font-label-lg text-[14px] font-bold">{subj(x.name)}</span>
                  {x.status !== 'live' ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-[11px] font-semibold">Soon</span>
                  ) : active ? (
                    <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                  ) : null}
                </a>
              );
            })}
          </div>
        </div>

        <div className="px-margin-mobile flex flex-col gap-space-lg">
          {detail.error ? <ErrorCard error={detail.error} /> : !detail.data ? <Skeleton rows={4} /> : (
            <>
              {/* Subject Overview Hero Card */}
              <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-md">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-11 h-11 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center flex-shrink-0">
                      <SubjectIcon code={detail.data.subject.code} />
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-sm text-[18px] font-bold text-on-surface">{subj(detail.data.subject.name)}</span>
                      </div>
                      <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">Grade {detail.data.subject.grade.replace('th', '')} · {detail.data.units.length} units available</p>
                    </div>
                  </div>
                </div>
              </div>

              {!isLive && (
                <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col items-center text-center shadow-sm mt-2">
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-space-sm">
                    <span className="material-symbols-outlined text-[28px]">hourglass_top</span>
                  </div>
                  <h3 className="font-headline-sm text-[18px] text-on-surface mb-1 font-bold">Curriculum Under Review</h3>
                  <p className="font-body-md text-[14px] text-on-surface-variant max-w-xs leading-relaxed mb-space-md">
                    {subj(detail.data.subject.name)} is coming soon — Lessons appear here after the EduSaas team produces them and your teacher approves them.
                  </p>
                </div>
              )}

              {/* Units List */}
              {isLive && detail.data.units.map(unit => {
                const isComingSoon = unit.status !== 'live';
                if (isComingSoon) {
                  return (
                    <div key={unit.number} className="bg-surface-container-low/70 rounded-xl p-space-sm px-space-md flex items-center justify-between mt-2 shadow-sm border border-outline-variant/30">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-label-md text-[14px] font-bold text-on-surface-variant flex-shrink-0">
                          {unit.number.toString().padStart(2, '0')}
                        </span>
                        <span className="font-body-md text-[14px] text-on-surface truncate font-medium">
                          {unit.title}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-[11px] font-semibold bg-surface-container text-on-surface-variant flex-shrink-0">
                        Coming soon
                      </span>
                    </div>
                  );
                }
                
                return (
                  <div key={unit.number} className="flex flex-col gap-space-sm mt-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-label-md text-[12px] font-bold text-primary uppercase tracking-wide">
                          Unit {unit.number} · {unit.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-space-sm">
                      {unit.lessons?.map((lesson, idx) => {
                        const passed = lesson.progress?.passed;
                        const score = lesson.progress?.best;
                        return (
                          <a href={`#/lesson/${lesson.id}`} key={lesson.id} className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-sm active:bg-surface-container-low transition-colors border border-outline-variant/30">
                            <div className="flex items-start justify-between gap-space-xs">
                              <div className="flex items-start gap-space-xs">
                                <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-primary font-label-sm text-[11px] font-bold flex-shrink-0 mt-0.5">
                                  {lesson.topic || `${unit.number}.${idx + 1}`}
                                </span>
                                <div>
                                  <h2 className="font-headline-sm text-[15px] font-bold text-on-surface leading-snug">{lesson.title}</h2>
                                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">{lesson.duration || '0:00'} · Pages {lesson.pages || '-'}</p>
                                </div>
                              </div>
                              {passed ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold flex items-center gap-1 flex-shrink-0">
                                  <span className="material-symbols-outlined text-[14px]">check</span> {score}/5 Cleared
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-[11px] font-bold">
                                  Listen & Take Quiz
                                </span>
                              )}
                            </div>
                            <div className="pt-1 flex items-center justify-between mt-2">
                              <span className="font-label-md text-[13px] font-bold text-secondary flex items-center gap-1">
                                {passed ? 'Review narration & quiz results' : 'Start Lesson'} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {d.nextGrade && d.nextGrade.subjects.length > 0 && (
            <div className="flex flex-col gap-space-sm pt-space-xs pb-space-lg mt-4">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Grade {d.nextGrade.grade.replace('th', '')} · Coming soon</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {d.nextGrade.subjects.map((n) => (
                  <div key={n} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low text-outline font-label-md text-[13px] font-bold">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>{subj(n)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <p className="font-body-sm text-[13px] text-on-surface-variant text-center my-4 opacity-80">
            Units are added as the Content Factory produces them and teachers approve them.
          </p>
        </div>

      </div>
    </main>
  );
}
