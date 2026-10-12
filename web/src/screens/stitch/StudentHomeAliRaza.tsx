import { type StudentHome } from '../../lib/api';
import { dayName, todayLong } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { take } from '../../lib/prefetch';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, OfflineBanner, Skeleton } from '../../ui';

export function StudentHomeAliRaza() {
  const { t, tr, subj, locale } = useI18n();
  const { data: d, error, reload } = useLoad(() => take<StudentHome>('student/home'));

  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!d) return <><OfflineBanner /><Skeleton rows={4} /></>;

  const done = d.lessons.filter((l) => l.progress.passed).length;
  const pending = d.clearances.filter((c) => c.status === 'pending');
  const cleared = d.clearances.filter((c) => c.status === 'cleared');
  
  // Progress calculation for circle
  const total = d.lessons.length || 1;
  const progressPercent = Math.round((done / total) * 100);
  const strokeDasharray = 163.36;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progressPercent) / 100;

  return (
    <>
      <OfflineBanner />
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-20 bg-surface px-margin-mobile">
        <div className="flex flex-col w-full pb-6 space-y-4">
          
          {/* TOP STUDENT PROFILE & PROGRESS CARD */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all duration-200 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-start justify-between gap-space-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md mb-1">
                  <span className="material-symbols-outlined text-[15px] text-on-surface-variant">calendar_today</span>
                  <span>{todayLong(locale)}</span>
                </div>
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight truncate">
                  {t('Assalam o alaikum, {name}', { name: d.me.name.split(' ')[0] })}
                </h1>
                <div className="flex items-center gap-space-xs mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded text-on-surface font-body-sm text-body-sm font-medium">
                    <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                    FBISE Margalla Heights
                  </span>
                  <span className="text-on-surface-variant font-body-sm text-body-sm">
                    · {d.me.class} ({t('Roll {roll}', { roll: d.me.roll || '' })})
                  </span>
                </div>
              </div>
              
              {/* Live Circular Progress Graphic */}
              <div className="flex flex-col items-center justify-center shrink-0 pl-1">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg aria-hidden className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                    <circle className="stroke-surface-container text-surface-container fill-none" cx="32" cy="32" r="26" strokeWidth="5" />
                    <circle 
                      className="stroke-secondary fill-none transition-all duration-700 ease-out" 
                      cx="32" cy="32" r="26" 
                      strokeDasharray={strokeDasharray} 
                      strokeDashoffset={strokeDashoffset} 
                      strokeLinecap="round" strokeWidth="5" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold leading-none tracking-tight">{progressPercent}%</span>
                  </div>
                </div>
                <span className="mt-1 font-label-sm text-label-sm text-on-surface-variant text-center font-medium">
                  {t('{done}/{total} topics', { done, total: d.lessons.length })}
                </span>
              </div>
            </div>
          </div>

          {d.subjects.length > 0 ? (
            <div className="flex flex-col space-y-4 animate-[fadeIn_0.6s_ease-out]">
              
              {/* PENDING CLEARANCES */}
              {pending.map((c) => (
                <section key={c.id} aria-label="Action required for missed class" className="bg-error-container/40 rounded-xl p-space-md shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#FFE6BA] text-[#A55A06] shrink-0">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                      </div>
                      <h2 className="font-headline-sm text-headline-sm font-bold text-[#A55A06] truncate">
                        {t('Pending clearance')}
                      </h2>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-semibold uppercase tracking-wider bg-[#FDE5BE] text-[#A55A06] shrink-0">
                      Action Required
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-[#523200] leading-relaxed">
                    {tr('You were absent on {date} and missed {topic}. Listen to the lesson and score 4/5 in the quiz to be cleared for class.',
                      { date: <span className="font-semibold text-[#1B2130]">{dayName(c.date, locale)}</span>, topic: <span className="font-semibold text-[#1B2130]">{subj(c.lesson.subject)} {c.lesson.topic} {c.lesson.title}</span> })}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 text-on-surface text-label-sm font-label-sm font-medium">
                      <span className="material-symbols-outlined text-[15px] text-[#A55A06]">history</span>
                      <span>Attempts: <strong className="font-semibold text-[#1B2130]">{c.attempts}</strong></span>
                      <span className="text-on-surface-variant">·</span>
                      <span>Best: <strong className="font-semibold text-[#1B2130]">{c.best ?? 0}/5</strong></span>
                    </div>
                    <span className="font-label-sm text-label-sm text-[#A55A06] font-medium flex items-center gap-0.5">
                      Pass mark: 80%
                    </span>
                  </div>
                  <a href={'#/lesson/' + c.lesson.id} className="w-full h-12 bg-primary-container hover:bg-primary active:scale-[0.99] text-on-primary rounded-xl font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-secondary">
                    <span className="material-symbols-outlined text-[20px]">play_circle</span>
                    <span>{t('Start missed lesson')}</span>
                  </a>
                </section>
              ))}

              {/* CLEARED FOR CLASS VERIFICATION CARD */}
              {cleared.slice(0, 2).map((c) => (
                <div key={c.id} aria-label="Cleared course status" className="bg-[#E3F5EC] rounded-xl p-3.5 shadow-sm flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#C7EED8] text-[#047857] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-headline-sm text-[15px] leading-tight font-bold text-[#047857]">{t('Cleared for class')}</span>
                      <span className="inline-flex items-center gap-1 bg-[#D3F1E2] px-2 py-0.5 rounded text-[11px] font-semibold text-[#047857]">
                        {c.clearedBy === 'teacher' ? 'By Teacher' : `Score: ${c.best ?? 0}/5`}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-[#14532D] mt-0.5 truncate">
                      {c.lesson.topic} {c.lesson.title}
                    </p>
                  </div>
                </div>
              ))}

              {/* MY SUBJECTS SECTION */}
              <section aria-labelledby="subjectsHeading" className="space-y-2.5 pt-1 animate-[fadeIn_0.8s_ease-out]">
                <div className="flex items-center justify-between">
                  <span className="font-label-lg text-[13px] font-bold tracking-wider text-on-surface-variant uppercase" id="subjectsHeading">
                    {t('My subjects')}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{d.subjects.length} Active {d.subjects.length === 1 ? 'Course' : 'Courses'}</span>
                </div>
                
                {d.subjects.map(s => (
                  <a key={s.code} href={'#/subject/' + s.code} className="block bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-space-sm mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-secondary-container/30 flex items-center justify-center shrink-0 text-secondary">
                          <span className="material-symbols-outlined text-[24px]">menu_book</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline-sm text-[17px] font-bold text-on-surface truncate">{subj(s.code)}</h3>
                          </div>
                          <p className="font-body-md text-body-md text-on-surface-variant">Ongoing</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant mt-1 text-[22px]">chevron_right</span>
                    </div>
                  </a>
                ))}
              </section>

            </div>
          ) : (
            <div className="flex flex-col space-y-4 animate-[fadeIn_0.5s_ease-out]">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <div>
                  <p className="font-label-lg text-label-lg font-bold text-on-surface">Registration</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Margalla Heights Academic Registry Synchronized</p>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant shadow-inner">
                  <span className="material-symbols-outlined text-[30px]">hourglass_empty</span>
                </div>
                <div className="space-y-1 max-w-[280px]">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">No Subjects Enrolled</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Your college has not added any subjects yet. Ask your teacher or college admin.
                  </p>
                </div>
                <div className="pt-2 w-full">
                  <button onClick={reload} className="w-full h-11 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors" type="button">
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Check for updates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FBISE REGULATORY FOOTER NOTE */}
          <div className="px-2 py-3 text-center mt-auto animate-[fadeIn_1s_ease-out]">
            <p className="font-label-sm text-[11px] text-on-surface-variant flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">verified</span>
              Authorized FBISE Institutional Portal · Margalla Heights College
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
