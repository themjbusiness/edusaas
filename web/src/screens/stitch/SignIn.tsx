import { useEffect, useRef, useState } from 'react';
import { ApiError, get, post, setToken, type Me } from '../../lib/api';
import { prettyPhone } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { useToast } from '../../ui';

interface DemoAccount { name: string; role: string; phone: string; note: string }
interface InstitutionInfo { name: string; affiliation: string; isDemo: boolean }
const GROUPS: [string, string][] = [['college_admin', 'College admin'], ['teacher', 'Teachers'], ['student', 'Students'], ['parent', 'Parents']];

export function SignIn({ onSignedIn }: { onSignedIn: (me: Me) => void }) {
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
  const [institution, setInstitution] = useState<InstitutionInfo | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    get<DemoAccount[]>('demo/accounts').then(setAccounts, () => setAccounts('none'));
    get<InstitutionInfo>('institution').then(setInstitution).catch(() => {});
  }, []);

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

  // Icons for demo roles to preserve Stitch UI look
  const roleIcons: Record<string, string> = {
    'student': 'school',
    'teacher': 'psychology',
    'parent': 'family_restroom',
    'college_admin': 'shield_person'
  };

  return (
    <main className="flex flex-col relative w-full px-margin-mobile pt-16 pb-safe bg-surface flex-1">
      <div className="flex flex-col w-full pb-8">
        
        {/* Offline Resilience Notice */}
        <div className="mb-4 rounded-xl bg-[#FFF3DC] p-3 shadow-sm flex items-start gap-2.5 animate-[fadeIn_0.5s_ease-out]">
          <span aria-hidden className="material-symbols-outlined text-[20px] text-[#A55A06] flex-shrink-0 mt-0.5">wifi_off</span>
          <div className="min-w-0 flex-1">
            <p className="font-body-sm text-body-sm font-medium text-[#A55A06] leading-snug">
              Offline cache active: Downloaded textbook audio narrations remain accessible without live 3G/4G connectivity.
            </p>
          </div>
        </div>

        {/* Academic Institution Verification Header */}
        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm mb-4 animate-[slideInDown_0.5s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">account_balance</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-label-lg text-label-lg font-semibold text-primary truncate">
                  {institution?.name || 'EduSaas College'}
                </span>
                {institution?.isDemo !== false && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-medium">Demo</span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                {institution?.affiliation || 'Affiliated with Federal Board (FBISE), Islamabad'}
              </p>
            </div>
          </div>
        </div>

        {/* Screen Identity & Purpose */}
        <div className="mb-5 px-1 animate-[fadeIn_0.7s_ease-out]">
          <h2 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
            {step === 'phone' ? 'Sign in to EduSaas' : 'Verify OTP'}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">
            {step === 'phone' 
              ? 'Access missed class textbook narrations, attendance registers, and official roll slip clearance. Sign in with your college-registered phone number.'
              : tr('We sent a 6-digit code to {phone}.', { phone: <b dir="ltr">{prettyPhone(phone)}</b> })
            }
          </p>
        </div>

        {/* Phone Authentication Form Card */}
        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm mb-5 transition-all duration-300">
          {step === 'phone' ? (
            <form className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]" onSubmit={(e) => { e.preventDefault(); sendCode(digits); }}>
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold mb-1.5" htmlFor="phoneNumber">
                  REGISTERED MOBILE NUMBER
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="h-12 px-3 rounded-lg bg-surface-container-low flex items-center gap-1.5 flex-shrink-0 select-none">
                    <span className="text-[16px] leading-none select-none font-label-md">🇵🇰</span>
                    <span className="font-label-lg text-label-lg font-semibold text-primary">+92</span>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input 
                      aria-describedby="phoneHint" 
                      autoComplete="tel-national" 
                      className="w-full h-12 px-3.5 rounded-lg bg-surface-container-lowest font-body-lg text-body-lg text-on-surface border border-outline-variant focus:border-transparent focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition-all" 
                      id="phoneNumber" 
                      inputMode="numeric" 
                      maxLength={11} 
                      placeholder="300 1234567" 
                      type="tel"
                      autoFocus
                      value={digits}
                      disabled={busy}
                      onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
                {error && <p className="font-body-sm text-body-sm text-error mt-2">{error}</p>}
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 flex items-center gap-1" id="phoneHint">
                  <span className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0">verified_user</span>
                  <span>Access strictly provisioned via college registrar directory.</span>
                </p>
              </div>

              <button disabled={busy} className="w-full min-h-[48px] px-4 rounded-xl bg-primary hover:bg-[#142740] active:scale-[0.99] text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50" type="submit">
                <span aria-hidden className="material-symbols-outlined text-[20px]">sms</span>
                <span>{busy ? t('Sending…') : t('Send 6-Digit OTP via SMS')}</span>
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold" htmlFor="otpCode">
                    ENTER 6-DIGIT CODE
                  </label>
                  <button type="button" className="text-secondary font-label-sm font-semibold hover:underline" onClick={() => { setStep('phone'); setError(''); }}>
                    Change Number
                  </button>
                </div>
                
                <input 
                  id="otpCode" 
                  ref={codeRef} 
                  className="w-full h-12 px-3.5 rounded-lg bg-surface-container-lowest font-body-lg text-body-lg text-on-surface tracking-[0.5em] border border-outline-variant focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary transition-all" 
                  type="text" 
                  inputMode="numeric" 
                  maxLength={6} 
                  autoComplete="one-time-code"
                  disabled={busy} 
                  value={code} 
                  onChange={(e) => verify(e.target.value.replace(/\D/g, ''))} 
                  placeholder="------"
                />
                {error && <p className="font-body-sm text-body-sm text-error mt-2">{error}</p>}
              </div>
              
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-2">
                {countdown > 0 ? tr('Resend code in {s}s', { s: <span>{countdown}</span> })
                  : countdown === 0
                    ? <button type="button" className="text-secondary font-semibold hover:underline" onClick={async () => { await sendCode(phone); toast(t('New code sent')); }}>{t('Resend code')}</button>
                    : <button type="button" className="text-secondary font-semibold hover:underline" onClick={() => { setStep('phone'); setError(''); }}>{t('Send a new code')}</button>}
              </p>
            </div>
          )}

          {sms && (
             <div className="mt-4 p-3 rounded-lg bg-[#E3F5EC] text-[#047857] flex flex-col gap-1 animate-[fadeIn_0.4s_ease-out]">
               <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-[20px] flex-shrink-0">check_circle</span>
                 <span className="font-body-sm text-body-sm font-medium">OTP dispatched. Valid for 10 minutes.</span>
               </div>
               <p className="font-body-sm text-[12px] opacity-80 pl-7">
                 Demo mode SMS preview: {sms}
               </p>
             </div>
          )}
        </div>

        {/* Role Test Switcher Section */}
        {step === 'phone' && (
          <div className="mb-5 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between px-1 mb-2.5">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                QUICK TEST WITH DEMO PROFILES
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-medium">Single-tap autofill</span>
            </div>
            <div className="flex flex-col gap-2">
              {accounts === null ? (
                <div className="w-full text-center text-on-surface-variant p-4 text-body-sm">Loading demo accounts...</div>
              ) : accounts === 'none' ? (
                <div className="w-full text-center text-on-surface-variant p-4 text-body-sm">Demo accounts are not available.</div>
              ) : (
                GROUPS.map(([role, label]) => {
                  const roleAccounts = accounts.filter(a => a.role === role);
                  if (roleAccounts.length === 0) return null;
                  return roleAccounts.map(a => (
                    <button 
                      key={a.phone}
                      className="w-full min-h-[60px] p-3 text-left rounded-xl bg-surface-container-lowest hover:bg-surface-container-low active:bg-surface-container flex items-center justify-between gap-3 shadow-sm transition-colors group transform hover:-translate-y-0.5 active:translate-y-0"
                      type="button"
                      onClick={() => { setStep('phone'); setDigits(a.phone.slice(3)); }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                          <span className="material-symbols-outlined text-[20px]">{roleIcons[role] || 'person'}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-label-md text-label-md font-semibold text-primary truncate">{a.name}</span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                            {label} • {prettyPhone(a.phone)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                          Tap to fill
                        </span>
                      </div>
                    </button>
                  ));
                })
              )}
            </div>
          </div>
        )}

        {/* Institutional Support & Administrative Help Footer */}
        <div className="rounded-xl bg-surface-container p-4 mt-auto">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant flex-shrink-0 mt-0.5">contact_support</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-label-md text-label-md font-semibold text-primary">Need phone registration update?</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                Unregistered numbers cannot create independent accounts. Visit the Academic Records Directorate or call the {institution?.name || 'college'} helpline to bind your current SIM to your FBISE student identifier.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
