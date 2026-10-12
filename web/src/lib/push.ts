import { get, post } from './api';

/** Free phone alerts (F3): the service worker from the current app (/sw.js) shows them. */
export type PushState = 'insecure' | 'ios' | 'none' | 'denied' | 'ok';

let ready: Promise<ServiceWorkerRegistration | null> | null = null;
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.isSecureContext && !ready) {
    ready = navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => navigator.serviceWorker.ready, () => null);
  }
}

export function pushSupport(): PushState {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
  if (!window.isSecureContext) return 'insecure';
  if (!ready || !('PushManager' in window) || !('Notification' in window)) return ios && !standalone ? 'ios' : 'none';
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}

function keyBytes(b64: string) {
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  s += '==='.slice((s.length + 3) % 4);
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export async function currentSubscription() {
  const r = ready && (await ready);
  return r ? r.pushManager.getSubscription() : null;
}

export async function enablePush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications were not allowed on this phone.');
  const [{ publicKey }, reg] = await Promise.all([get<{ publicKey: string }>('push/key'), ready]);
  if (!reg) throw new Error('Could not turn on alerts');
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  await post('push/subscribe', sub.toJSON());
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await post('push/unsubscribe', { endpoint });
}
