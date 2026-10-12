import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { currentSubscription, disablePush, enablePush, pushSupport } from '../lib/push';
import { Icon, useToast } from '.';

type State = 'insecure' | 'ios' | 'none' | 'denied' | 'off' | 'on' | 'busy';

/** "Alerts on this phone": free web push (F3). */
export default function AlertsCard({ teacher }: { teacher?: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const [state, setState] = useState<State>('busy');
  useEffect(() => {
    const s = pushSupport();
    if (s !== 'ok') { setState(s); return; }
    currentSubscription().then((sub) => setState(sub ? 'on' : 'off'), () => setState('off'));
  }, []);
  const msg: Record<string, string> = {
    insecure: t('Alerts on this phone need the app’s secure (https) address. They will work once EduSaas is hosted; until then every alert is in Messages.'),
    ios: t('On iPhone: tap Share, then <b>Add to Home Screen</b>. Open EduSaas from the Home Screen to turn on alerts.').replace(/<\/?b>/g, ''),
    none: t('This browser can’t show alerts. Open EduSaas in Chrome to get them.'),
    denied: t('Notifications are blocked for this site. Allow them in the browser’s site settings, then come back.'),
    off: t(teacher ? 'Get a notification when a student you teach is cleared. Free, and every alert is also kept in Messages.'
      : 'Get a notification when your child is absent or cleared. Free, and every alert is also kept in Messages.'),
    on: t('Alerts are on for this phone.'), busy: '',
  };
  async function on() {
    setState('busy');
    try { await enablePush(); toast(t('Alerts are on for this phone')); setState('on'); }
    catch (e) { toast(t((e as Error).message || 'Could not turn on alerts')); setState(pushSupport() === 'denied' ? 'denied' : 'off'); }
  }
  async function off() {
    try { await disablePush(); toast(t('Alerts turned off for this phone')); setState('off'); } catch (e) { toast((e as Error).message); }
  }
  return (
    <div className={'card alerts-card' + (state === 'on' ? ' on' : '')} aria-live="polite">
      <div className="flex gap-2.5 items-center"><Icon name={state === 'on' ? 'check' : 'alert'} />
        <div className="flex-1 min-w-0"><b>{t('Alerts on this phone')}</b><div className="text-on-surface-variant text-[14px] text-[13px]">{msg[state]}</div></div>
        {state === 'off' && <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer sm" onClick={on}>{t('Turn on')}</button>}
        {state === 'busy' && <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer sm" disabled>{t('Turning on…')}</button>}
        {state === 'on' && <button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low" onClick={off}>{t('Turn off')}</button>}
      </div>
    </div>
  );
}
