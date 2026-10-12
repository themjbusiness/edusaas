import { useState } from 'react';
import { ICONS } from '../ui/icons';
import { Badge, Bar, ErrorCard, Icon, PhoneInput, Ring, Sheet, Skeleton, Stat, SubjectIcon, Tabs, useToast } from '../ui';

/** Component gallery (F1): every component in its states, for design review and screenshot tests. Open /app/#/gallery. */
export default function Gallery() {
  const toast = useToast();
  const [sheet, setSheet] = useState(false);
  const [phone, setPhone] = useState('3001234567');
  return (
    <>
      <h1 className="text-[22px] leading-tight my-1 font-bold">Component gallery</h1>
      <p className="text-on-surface-variant text-[14px]">Every component in the EduSaas design system. Use the header buttons to check dark mode and right-to-left Urdu.</p>

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Buttons</h2>
      <div className="flex gap-2.5 items-center flex-wrap">
        <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer">Primary</button><button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer">Secondary</button><button className="accent">Accent</button>
        <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-medium rounded-[10px] border-transparent bg-transparent text-on-surface-variant cursor-pointer hover:bg-surface-container-low">Ghost</button><button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-primary bg-primary text-on-primary cursor-pointer" disabled>Disabled</button><button className="sm">Small</button>
        <a className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 text-[14px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer wa-btn" href="#/gallery"><Icon name="chat" sm />Send on WhatsApp</a>
      </div>

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Badges</h2>
      <div className="flex gap-2.5 items-center flex-wrap">
        <Badge tone="ok" icon="check">Cleared</Badge><Badge tone="pend" icon="cross">Pending</Badge>
        <Badge tone="warn">Waiting for college admin</Badge><Badge tone="neutral">Coming soon</Badge><Badge tone="neutral">Draft, not yet reviewed</Badge>
      </div>

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Chips, rings and bars</h2>
      <div className="flex gap-2.5 items-center"><span className="inline-grid place-items-center min-w-[44px] h-[44px] rounded-[10px] bg-[#e3f4f2] text-[#0b6f66] font-bold text-[15px]">1.2</span><span className="sicon"><SubjectIcon code="phy11" /></span>
        <span className="sicon"><SubjectIcon code="chem11" /></span><span className="sicon"><SubjectIcon code="bio11" /></span>
        <Ring value={0.33} label="33%" /></div>
      <Bar value={0.6} style={{ marginTop: 12 }} />

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Stat tiles</h2>
      <div className="grid grid-cols-3 gap-2 my-3"><Stat value={5} label="Present" tone="ok" /><Stat value={1} label="Absent" /><Stat value={1} label="Pending" tone="warn" /></div>

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Cards</h2>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 alert-card"><div className="title"><Icon name="alert" />Pending clearance</div><p style={{ margin: '6px 0 0' }}>Amber card for things that need action.</p></div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 ok-card"><div className="flex gap-2.5 items-center"><Icon name="check" /><b>Cleared for class</b></div></div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 my-2.5 soon-card"><Icon name="clock" /><div><b>Chemistry is coming soon</b><div className="text-on-surface-variant text-[14px] text-[13px]">Dashed card for empty states.</div></div></div>
      <div className="flex gap-2.5 items-start p-2.5 rounded-[10px] mb-3 text-[14px] bg-surface-container-low text-on-surface-variant border border-dashed border-outline-variant"><Icon name="shield" sm /><span>Info banner.</span></div>
      <div className="flex gap-2.5 items-start p-2.5 rounded-[10px] mb-3 text-[14px] bg-error-container text-error border border-error"><Icon name="wifiOff" sm /><span>Offline banner.</span></div>

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Tabs and segmented control</h2>
      <Tabs label="Demo" current="a" items={[{ key: 'a', href: '#/gallery', label: 'Physics' }, { key: 'b', href: '#/gallery', label: 'Chemistry' }, { key: 'c', href: '#/gallery', label: 'Biology' }]} />
      <div className="tracksw" role="group" aria-label="Narration"><span>Narration</span><button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" aria-pressed="true">English mix</button><button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" lang="ur" aria-pressed="false">اردو</button></div>

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Form fields</h2>
      <PhoneInput id="g-ph" label="Mobile number" value={phone} onChange={setPhone} />
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="g-sel">Select</label><select id="g-sel"><option>11th Pre-Medical A</option></select>
      <label className="block font-semibold text-[14px] mt-3.5 mb-1.5" htmlFor="g-ta">Text area</label><textarea id="g-ta" rows={2} defaultValue="Medical certificate provided" />

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Feedback</h2>
      <div className="flex gap-2.5 items-center flex-wrap"><button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" onClick={() => toast('Attendance saved.')}>Show toast</button><button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" onClick={() => setSheet(true)}>Open dialog</button></div>
      <Skeleton rows={1} />
      <ErrorCard error={{ message: 'Cannot reach the server.' }} onRetry={() => toast('Retry pressed')} />

      <h2 className="text-[15px] my-[22px] mb-2 text-on-surface-variant uppercase tracking-wide font-bold">Icons</h2>
      <div className="flex gap-2.5 items-center flex-wrap">{Object.keys(ICONS).map((k) => <span key={k} title={k} className="inline-grid place-items-center min-w-[44px] h-[44px] rounded-[10px] bg-[#e3f4f2] text-[#0b6f66] font-bold text-[15px]" style={{ background: 'var(--sunk)', color: 'var(--text)' }}><Icon name={k} /></span>)}</div>

      {sheet && (
        <Sheet title="Clear Ali Raza manually" confirm="Clear for class" onClose={() => setSheet(false)} onConfirm={() => toast('Confirmed')}>
          <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ marginTop: 0 }}>Dialog: a bottom sheet on phones, centred on wide screens.</p>
        </Sheet>
      )}
    </>
  );
}
