import { type StudentHome } from '../../lib/api';
import { dayName, todayLong } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { take } from '../../lib/prefetch';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Icon, OfflineBanner, Ring, Skeleton } from '../../ui';
import { SubjectCards } from './parts';

export default function Home() {
  const { t, tr, subj, locale } = useI18n();
  const { data: d, error, reload } = useLoad(() => take<StudentHome>('student/home'));
  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!d) return <><OfflineBanner /><Skeleton /></>;
  const done = d.lessons.filter((l) => l.progress.passed).length;
  const pending = d.clearances.filter((c) => c.status === 'pending');
  const cleared = d.clearances.filter((c) => c.status === 'cleared');
  return (
    <>
      <OfflineBanner />
      <div className="flex items-center gap-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>{todayLong(locale)}</p>
          <h1 className="text-[22px] leading-tight my-1 font-bold">{t('Assalam o alaikum, {name}', { name: d.me.name.split(' ')[0] })}</h1>
          <p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>{d.me.class} · {t('Roll {roll}', { roll: d.me.roll || '' })}</p>
        </div>
        <div className="ring-wrap">
          <Ring value={d.lessons.length ? done / d.lessons.length : 0} label={t('{done} of {total} topics complete', { done, total: d.lessons.length })} />
          <span>{t('{done}/{total} topics', { done, total: d.lessons.length })}</span>
        </div>
      </div>
      {pending.map((c) => (
        <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 alert-card" style={{ marginTop: 16 }}>
          <div className="title"><Icon name="alert" />{t('Pending clearance')}</div>
          <p style={{ margin: '6px 0 12px' }}>
            {tr('You were absent on {date} and missed {topic}. Listen to the lesson and score 4/5 in the quiz to be cleared for class.',
              { date: dayName(c.date, locale), topic: <b>{subj(c.lesson.subject)} {c.lesson.topic} {c.lesson.title}</b> })}
            {c.attempts > 0 && <><br /><span className="text-on-surface-variant text-[14px] text-[13px]">{t('Attempts: {n} · best {best}/5', { n: c.attempts, best: c.best ?? 0 })}</span></>}
          </p>
          <a className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer block" href={'#/lesson/' + c.lesson.id}><Icon name="play" sm />{t('Start missed lesson')}</a>
        </div>
      ))}
      {cleared.slice(0, 2).map((c) => (
        <div key={c.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 ok-card" style={{ marginTop: 12 }}>
          <div className="flex gap-2.5 items-center"><Icon name="check" />
            <div><b>{t('Cleared for class')}</b><div className="text-on-surface-variant text-[14px] text-[13px]">{c.lesson.topic} {c.lesson.title} · {c.clearedBy === 'teacher'
              ? t('cleared by your teacher') : t('passed with {best}/5', { best: c.best ?? 0 })}</div></div></div>
        </div>
      ))}
      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">{t('My subjects')}</h2>
      <SubjectCards list={d.subjects} />
    </>
  );
}
