import { get, type SubjectDetail } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Icon, OfflineBanner, Skeleton, SubjectIcon } from '../../ui';
import { ComingSoon, Units } from './parts';

export default function Subject({ args }: { args: string[] }) {
  const { t, subj } = useI18n();
  const code = args[0] || '';
  const { data: d, error, reload } = useLoad(() => get<SubjectDetail>('student/subjects/' + encodeURIComponent(code)), [code]);
  const back = <div className="flex gap-1.5 items-center text-on-surface-variant text-[14px]"><a href="#/home"><Icon name="back" sm />{t('Home')}</a></div>;
  if (error) return <>{back}<ErrorCard error={error} onRetry={reload} /></>;
  if (!d) return <Skeleton />;
  const live = d.units.filter((u) => u.status === 'live').length;
  return (
    <>
      <OfflineBanner />{back}
      <div className="flex gap-2.5 items-center" style={{ margin: '6px 0 4px' }}>
        <span className="sicon big"><SubjectIcon code={d.subject.code} /></span>
        <div className="flex-1 min-w-0"><h1 style={{ margin: 0 }}>{subj(d.subject.name)}</h1>
          <p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>{t('Grade {g}', { g: d.subject.grade.replace('th', '') })}
            {d.units.length > 0 && ' · ' + t('{live} of {n} units available', { live, n: d.units.length })}</p></div>
      </div>
      {d.subject.status !== 'live' && <ComingSoon name={d.subject.name} />}
      <Units units={d.units} />
    </>
  );
}
