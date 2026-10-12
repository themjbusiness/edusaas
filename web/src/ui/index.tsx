import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ICONS } from './icons';
import { useI18n } from '../lib/i18n';

/* Components for every screen (F1). Styling comes from the design tokens in styles.css, so the Stitch
   designs can be applied by changing tokens and these components, not each screen. */

export function Icon({ name, sm, className }: { name: string; sm?: boolean; className?: string }) {
  return (
    <svg className={`fill-current ${sm ? 'w-4 h-4' : 'w-6 h-6'} ${className || ''}`} viewBox="0 0 24 24" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />
  );
}

const SUBJECT_ICONS: Record<string, string> = { phy: 'atom', chem: 'flask', bio: 'leaf', math: 'sigma', eng: 'text', cs: 'code' };
export function SubjectIcon({ code, sm }: { code?: string; sm?: boolean }) {
  return <Icon name={SUBJECT_ICONS[String(code || '').replace(/\d+$/, '')] || 'book'} sm={sm} />;
}

export type Tone = 'ok' | 'pend' | 'warn' | 'neutral';
export function Badge({ tone, icon, children }: { tone: Tone; icon?: string; children: ReactNode }) {
  return <span className={'badge ' + tone}>{icon && <Icon name={icon} sm />}{children}</span>;
}

export function Ring({ value, label }: { value: number; label: string }) {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 64 64" role="img" aria-label={label}>
      <circle className="t" cx="32" cy="32" r={r} />
      <circle className="v" cx="32" cy="32" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - value)} />
      <text x="32" y="32">{Math.round(value * 100)}%</text>
    </svg>
  );
}

export function Bar({ value, style }: { value: number; style?: React.CSSProperties }) {
  return <div className="bar" aria-hidden="true" style={style}><i style={{ width: Math.round(value * 100) + '%' }} /></div>;
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5" key={i}><div className="skeleton-row"><i style={{ width: '55%' }} /><i /><i style={{ width: '35%' }} /></div></div>
      ))}
    </>
  );
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine !== false);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export function OfflineBanner() {
  const { t } = useI18n();
  if (useOnline()) return null;
  return (
    <div className="flex gap-2.5 items-start p-2.5 rounded-[10px] mb-3 text-[14px] bg-error-container text-error border border-error" role="status"><Icon name="wifiOff" sm />
      <span>{t('You are offline. Reconnect to continue; your progress so far is saved.')}</span></div>
  );
}

export function ErrorCard({ error, onRetry }: { error: { code?: string; message?: string }; onRetry?: () => void }) {
  const { t, err } = useI18n();
  const off = navigator.onLine === false;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5" style={{ textAlign: 'center', padding: '24px 16px' }}>
      <Icon name={off ? 'wifiOff' : 'alert'} />
      <p><b>{t(off ? 'You are offline' : 'Could not load this page')}</b><br /><span className="text-on-surface-variant text-[14px]">{err(error)}</span></p>
      {onRetry && <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer" onClick={onRetry}>{t('Try again')}</button>}
    </div>
  );
}

export function Stat({ value, label, tone, href }: { value: ReactNode; label: ReactNode; tone?: 'ok' | 'warn'; href?: string }) {
  const body = <><b>{value}</b><span>{label}</span></>;
  const cls = 'stat' + (tone ? ' ' + tone : '');
  return href ? <a className={cls} href={href}>{body}</a> : <div className={cls}>{body}</div>;
}

export function Tabs({ items, current, label }: { items: { key: string; href: string; label: ReactNode }[]; current: string; label: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((it) => <a key={it.key} role="tab" href={it.href} aria-selected={it.key === current}>{it.label}</a>)}
    </div>
  );
}

// ---------- toasts ----------
const ToastCtx = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback((m: string) => {
    setMsg(m); window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-60 bg-on-surface text-surface px-4 py-3 rounded-[10px] text-[14px] font-medium pointer-events-none" role="status" hidden={!msg}>{msg}</div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ---------- dialog: bottom sheet on phones, centred on wide screens ----------
export function Sheet({ title, children, confirm, onConfirm, onClose, busy }: {
  title: string; children: ReactNode; confirm: string; onConfirm: () => Promise<unknown> | void; onClose: () => void; busy?: boolean;
}) {
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    document.body.classList.add('sheet-open');
    const first = ref.current?.querySelector<HTMLElement>('input, textarea, select') || ref.current?.querySelector<HTMLElement>('button.primary');
    first?.focus();
    return () => { document.body.classList.remove('sheet-open'); prev?.focus?.(); };
  }, []);
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Tab' && ref.current) { // keep focus inside the dialog
      const f = ref.current.querySelectorAll<HTMLElement>('button, input, textarea, select');
      const a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    }
  }
  async function ok() {
    setError(''); setWorking(true);
    try { await onConfirm(); onClose(); }
    catch (e) { setError((e as Error).message || String(e)); setWorking(false); }
  }
  return (
    <div className="sheet-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={onKey}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" ref={ref}>
        <div className="grab" aria-hidden="true" />
        <h2 id="sh-t">{title}</h2>
        <div className="sheet-body">{children}</div>
        <p className="text-[13px] text-error min-h-[1.2em] my-2" role="alert">{error}</p>
        <div className="flex gap-2.5 items-center">
          <button className="flex-1 min-w-0" onClick={onClose}>{t('Cancel')}</button>
          <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer flex-1 min-w-0" disabled={working || busy} onClick={ok}>{confirm}</button>
        </div>
      </div>
    </div>
  );
}

export function PhoneInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor={id}>{label}</label>
      <div className="flex border border-outline-variant rounded-[10px] bg-surface-container-lowest overflow-hidden"><span>+92</span>
        <input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id={id} type="tel" inputMode="numeric" maxLength={11} autoComplete="off" value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))} /></div>
    </>
  );
}
