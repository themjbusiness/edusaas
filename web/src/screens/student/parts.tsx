import type { LessonSummary, SubjectCard, UnitRow } from '../../lib/api';
import { mmss } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { Badge, Bar, Icon, SubjectIcon } from '../../ui';

export function LessonStatus({ l }: { l: LessonSummary }) {
  const { t } = useI18n();
  const p = l.progress;
  if (p.passed) return <Badge tone="ok" icon="check">{' ' + p.best + '/5'}</Badge>;
  if (p.unlocked) return <Badge tone="warn">{t('Quiz ready')}</Badge>;
  if (p.heardShare > 0) return <Badge tone="neutral">{t('{p}% heard', { p: Math.round(p.heardShare * 100) })}</Badge>;
  return null;
}

export function LessonRow({ l, extra }: { l: LessonSummary; extra?: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <a className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5" href={'#/lesson/' + l.id}>
      <div className="flex gap-3 items-center">
        <span className="inline-grid place-items-center min-w-[44px] h-[44px] rounded-[10px] bg-[#e3f4f2] text-[#0b6f66] font-bold text-[15px]">{l.topic}</span>
        <div className="flex-1 min-w-0"><b>{l.title}</b>
          <div className="flex gap-3 flex-wrap text-on-surface-variant text-[13px] mt-0.5">
            <span><Icon name="clock" sm />{mmss(l.duration)}</span>
            <span><Icon name="pages" sm />{t('Pages {a}–{b}', { a: l.pages[0], b: l.pages[l.pages.length - 1] })}</span>
            {extra}
          </div>
        </div>
        <LessonStatus l={l} />
      </div>
    </a>
  );
}

export function SubjectCards({ list }: { list: SubjectCard[] }) {
  const { t, subj, lang } = useI18n();
  if (!list.length) return <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 text-on-surface-variant text-[14px]">{t('Your college hasn’t added subjects to your class yet.')}</div>;
  const live = list.filter((x) => x.status === 'live'), soon = list.filter((x) => x.status !== 'live');
  return (
    <>
      <div className="subject-grid">
        {live.map((x) => (
          <a key={x.code} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 subject-card" href={'#/subject/' + x.code}>
            <div className="flex gap-2.5 items-center"><span className="sicon"><SubjectIcon code={x.code} /></span>
              <div className="flex-1 min-w-0"><b>{subj(x.name)}</b>
                <div className="flex gap-3 flex-wrap text-on-surface-variant text-[13px] mt-0.5"><span>{t('{done} of {total} topics done', { done: x.done, total: x.total })}</span>
                  {x.pending > 0 && <Badge tone="pend">{t('{n} missed', { n: x.pending })}</Badge>}</div></div></div>
            <Bar value={x.total ? x.done / x.total : 0} style={{ marginTop: 10 }} />
          </a>
        ))}
      </div>
      {soon.length > 0 && (
        <details className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 my-2.5 soon">
          <summary><span><b>{t('Coming soon')}</b> · {soon.map((x) => subj(x.name)).join(lang === 'ur' ? '، ' : ', ')}</span></summary>
          {soon.map((x) => (
            <a key={x.code} className="soon-row" href={'#/subject/' + x.code}><SubjectIcon code={x.code} sm />
              <span className="flex-1 min-w-0">{subj(x.name)}</span><Badge tone="neutral">{t('Coming soon')}</Badge></a>
          ))}
        </details>
      )}
    </>
  );
}

export function ComingSoon({ name }: { name: string }) {
  const { t, subj } = useI18n();
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 soon-card"><Icon name="clock" />
      <div><b>{t('{name} is coming soon', { name: subj(name) })}</b>
        <div className="text-on-surface-variant text-[14px] text-[13px]">{t('Lessons appear here after the EduSaas team produces them and your teacher approves them.')}</div></div>
    </div>
  );
}

export function Units({ units }: { units: UnitRow[] }) {
  const { t } = useI18n();
  let seenLive = false, headShown = false;
  return (
    <>
      {units.map((u) => {
        if (u.status === 'live') {
          seenLive = true;
          return (
            <div key={u.number}>
              <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">{t('Unit {n}', { n: u.number })} · {u.title}</h2>
              <div className="lesson-list">
                {u.lessons.map((l) => <LessonRow key={l.id} l={l} extra={l.missed ? <Badge tone="pend">{t('Missed')}</Badge> : null} />)}
              </div>
            </div>
          );
        }
        const head = seenLive && !headShown;
        headShown = headShown || seenLive;
        return (
          <div key={u.number}>
            {head && <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">{t('More units · coming soon')}</h2>}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 my-2.5 text-on-surface-variant opacity-80"><div className="flex gap-2.5 items-center">
              <span className="inline-grid place-items-center min-w-[44px] h-[44px] rounded-[10px] bg-[#e3f4f2] text-[#0b6f66] font-bold text-[15px]" style={{ background: 'var(--sunk)', color: 'var(--muted)' }}>{u.number}</span>
              <span className="flex-1 min-w-0">{u.title}</span><Badge tone="neutral">{t('Coming soon')}</Badge></div></div>
          </div>
        );
      })}
    </>
  );
}
