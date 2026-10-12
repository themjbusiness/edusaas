import { useSession } from '../App';
import { get, type Message } from '../lib/api';
import { useLoad } from '../lib/useLoad';
import { ErrorCard, Skeleton } from '../ui';
import { TeacherAlertsLog } from './stitch/TeacherAlertsLog';
import { ParentMessagesMrsFatimaRaza } from './stitch/ParentMessagesMrsFatimaRaza';

export default function Messages() {
  const { me } = useSession();
  const teacher = me.role === 'teacher';
  const { data, error, reload } = useLoad(() => get<Message[]>('messages'));
  
  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!data) return <Skeleton rows={5} />;
  
  if (teacher) {
    return <TeacherAlertsLog list={data} />;
  } else {
    return <ParentMessagesMrsFatimaRaza list={data} />;
  }
}
