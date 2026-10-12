import { useEffect, useRef } from 'react';
import { get, type StudentHome, type SubjectDetail } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { useLoad } from '../../lib/useLoad';
import { Badge, ErrorCard, OfflineBanner, Skeleton, SubjectIcon } from '../../ui';
import { ComingSoon, SubjectCards, Units } from './parts';

export default function Library({ args }: { args: string[] }) {
  const { t, subj } = useI18n();
  const home = useLoad(() => get<StudentHome>('student/home'));
  const subs = home.data?.subjects || [];
  const cur = subs.some((x) => x.code === args[0]) ? args[0] : subs[0]?.code;
  const detail = useLoad(() => (cur ? get<SubjectDetail>('student/subjects/' + encodeURIComponent(cur)) : Promise.resolve(null)), [cur]);
  const tabs = useRef<HTMLDivElement>(null);
  useEffect(() => { tabs.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' }); }, [cur]);

  if (home.error) return <ErrorCard error={home.error} onRetry={home.reload} />;
  const d = home.data;
  if (!d) return <Skeleton />;
  const next = d.nextGrade && d.nextGrade.subjects.length > 0 && (
    <>
      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">{t('Grade {g} · coming soon', { g: d.nextGrade.grade.replace('th', '') })}</h2>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 my-2.5 text-on-surface-variant opacity-80"><div className="chips">{d.nextGrade.subjects.map((n) => <Badge key={n} tone="neutral">{subj(n)}</Badge>)}</div></div>
    </>
  );
  if (!subs.length) return <><h1 className="text-[22px] leading-tight my-1 font-bold">{t('Course library')}</h1><SubjectCards list={subs} />{next}</>;
  return (
    <>
      <OfflineBanner />
      <h1 className="text-[22px] leading-tight my-1 font-bold">{t('Course library')}</h1>
      <p className="text-on-surface-variant text-[14px]">{d.me.class} · {t('{n} subjects', { n: subs.length })}</p>
      <div className="tabs" role="tablist" aria-label="Subjects" ref={tabs}>
        {subs.map((x) => (
          <a key={x.code} role="tab" href={'#/library/' + x.code} aria-selected={x.code === cur}>
            <SubjectIcon code={x.code} sm />{subj(x.name)}{x.status !== 'live' && <small>{t('soon')}</small>}
          </a>
        ))}
      </div>
      {detail.error ? <ErrorCard error={detail.error} /> : !detail.data ? <Skeleton rows={2} /> : (
        <>{detail.data.subject.status !== 'live' && <ComingSoon name={detail.data.subject.name} />}<Units units={detail.data.units} /></>
      )}
      {next}
      <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ textAlign: 'center' }}>{t('Units are added as the Content Factory produces them and teachers approve them.')}</p>
    </>
  );
}
