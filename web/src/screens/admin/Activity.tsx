import { get } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Icon, Skeleton } from '../../ui';
import { ActivityList, type AuditRow } from './AdminHome';

export default function Activity() {
  const { data, error, reload } = useLoad(() => get<AuditRow[]>('admin/audit'));
  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!data) return <Skeleton rows={3} />;
  return (
    <>
      <div className="flex gap-1.5 items-center text-on-surface-variant text-[14px]"><a href="#/admin"><Icon name="back" sm />Home</a></div>
      <h1 className="text-[22px] leading-tight my-1 font-bold">Activity log</h1>
      <p className="text-on-surface-variant text-[14px]">Every change in your college: who did it and when. Phone numbers are partly hidden.</p>
      <ActivityList rows={data} />
    </>
  );
}
