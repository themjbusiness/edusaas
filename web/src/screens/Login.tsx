import { useEffect, useRef, useState } from 'react';
import { ApiError, get, post, setToken, type Me } from '../lib/api';
import { prettyPhone } from '../lib/format';
import { useI18n } from '../lib/i18n';
import { Icon, useToast } from '../ui';

interface DemoAccount { name: string; role: string; phone: string; note: string }
const GROUPS: [string, string][] = [['college_admin', 'College admin'], ['teacher', 'Teachers'], ['student', 'Students'], ['parent', 'Parents']];

/** Sign in with a registered mobile number and a 6-digit code (only people the college registered). */
export default function Login({ onSignedIn }: { onSignedIn: (me: Me) => void }) {
  const { t, tr, err } = useI18n();
  const toast = useToast();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [digits, setDigits] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [sms, setSms] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<DemoAccount[] | null | 'none'>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 'code' || countdown <= 0) return;
    const id = window.setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [step, countdown]);
  useEffect(() => { if (step === 'code') codeRef.current?.focus(); }, [step]);
  useEffect(() => { if (!sms) return; const id = window.setTimeout(() => setSms(null), 20000); return () => window.clearTimeout(id); }, [sms]);

  async function sendCode(number = phone || digits) {
    const v = number.replace(/^\+92/, '').replace(/^0/, '');
    if (!/^3\d{9}$/.test(v)) { setError(t('Enter a 10-digit mobile number starting with 3.')); return; }
    setBusy(true); setError('');
    try {
      const r = await post<{ phone: string; demoCode?: string }>('auth/otp', { phone: v });
      setPhone(r.phone); setStep('code'); setCountdown(30); setCode('');
      if (r.demoCode) setSms(r.demoCode);
    } catch (e) { setError(err(e as ApiError)); }
    finally { setBusy(false); }
  }

  async function verify(value: string) {
    setCode(value);
    if (value.length < 6) return;
    setBusy(true); setError('');
    try {
      const r = await post<{ token: string; me: Me }>('auth/verify', { phone, code: value });
      setToken(r.token); setSms(null); onSignedIn(r.me);
    } catch (e) {
      const ae = e as ApiError;
      setError(err(ae)); setCode(''); setBusy(false); codeRef.current?.focus();
      if (ae.code === 'otp_locked' || ae.code === 'otp_expired') setCountdown(-1);
    }
  }

  function loadAccounts(open: boolean) {
    if (!open || accounts) return;
    get<DemoAccount[]>('demo/accounts').then(setAccounts, () => setAccounts('none'));
  }

  return (
    <>
      <div style={{ textAlign: 'center', margin: '18px 0 20px' }}>
        <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-primary text-on-primary"><Icon name="book" /></span>
        <h1 style={{ marginTop: 12 }}>{t('Sign in')}</h1>
        <p className="text-on-surface-variant text-[14px]">{t('For students, teachers and parents registered by your college.')}</p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5">
        {step === 'phone' ? (
          <form onSubmit={(e) => { e.preventDefault(); sendCode(digits); }}>
            <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="ph">{t('Mobile number')}</label>
            <div className="flex border border-outline-variant rounded-[10px] bg-surface-container-lowest overflow-hidden"><span>+92</span>
              <input className="w-full min-h-[48px] px-3 py-2 rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface" id="ph" type="tel" inputMode="numeric" maxLength={11} placeholder="3001234567" autoComplete="tel-national"
                autoFocus value={digits} onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))} /></div>
            <p className="text-[13px] text-error min-h-[1.2em] my-2" role="alert">{error}</p>
            <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer w-full" disabled={busy}>{busy ? t('Sending…') : t('Send code')}</button>
          </form>
        ) : (
          <>
            <p className="text-on-surface-variant text-[14px]" style={{ margin: 0 }}>
              {tr('We sent a 6-digit code to {phone}.', { phone: <b dir="ltr">{prettyPhone(phone)}</b> })}{' '}
              <button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low" onClick={() => { setStep('phone'); setError(''); }}>{t('Change')}</button>
            </p>
            <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="otp">{t('Enter the code')}</label>
            <input id="otp" ref={codeRef} className="text-[26px] tracking-[14px] text-center font-bold" type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code"
              disabled={busy} value={code} onChange={(e) => verify(e.target.value.replace(/\D/g, ''))} />
            <p className="text-[13px] text-error min-h-[1.2em] my-2" role="alert">{error}</p>
            <p className="text-on-surface-variant text-[14px] text-[13px]">
              {countdown > 0 ? tr('Resend code in {s}s', { s: <span>{countdown}</span> })
                : countdown === 0
                  ? <button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low" onClick={async () => { await sendCode(phone); toast(t('New code sent')); }}>{t('Resend code')}</button>
                  : <button className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low" onClick={() => { setStep('phone'); setError(''); }}>{t('Send a new code')}</button>}
            </p>
          </>
        )}
      </div>
      <div className="flex gap-2.5 items-start p-2.5 rounded-[10px] mb-3 text-[14px] bg-surface-container-low text-on-surface-variant border border-dashed border-outline-variant"><Icon name="shield" sm />
        <span>{t('Only numbers registered by the college can sign in. Each account sees only its own class, child or record.')}</span></div>
      <details className="bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 my-2.5" onToggle={(e) => loadAccounts((e.target as HTMLDetailsElement).open)}>
        <summary className="text-[13px]"><span><b>{t('Demo accounts')}</b> {t('(for presenters)')}</span></summary>
        <div className="text-[13px] text-on-surface-variant text-[14px]">
          {accounts === null ? 'Loading…' : accounts === 'none' ? 'Demo accounts are not available.' : (
            <>
              {GROUPS.map(([role, label]) => (
                <div key={role}>
                  <p style={{ margin: '10px 0 4px' }}><b>{label}</b></p>
                  {accounts.filter((a) => a.role === role).map((a) => (
                    <button key={a.phone} className="flex w-full justify-between items-center gap-2 text-left font-medium min-h-[48px] px-2.5 py-2 my-1 text-[14px]" onClick={() => { setStep('phone'); setDigits(a.phone.slice(3)); }}>
                      <span>{a.name}<br /><span className="text-on-surface-variant text-[14px]">{a.note}</span></span><code>{prettyPhone(a.phone)}</code>
                    </button>
                  ))}
                </div>
              ))}
              <p>Tap an account to fill in its number. Any other number is refused.</p>
            </>
          )}
        </div>
      </details>
      {sms && (
        <div className="sms-preview" role="status"><Icon name="sms" sm />
          <div><b>SMS · EduSaas</b><br />{tr('Your sign-in code is {code}. It expires in 5 minutes.', { code: <b dir="ltr">{sms}</b> })}
            <br /><span className="text-[13px]">{t('Demo mode: shown here instead of a real SMS.')}</span></div>
        </div>
      )}
    </>
  );
}
