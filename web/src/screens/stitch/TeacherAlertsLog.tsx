import { useMemo } from 'react';
import type { Message } from '../../lib/api';
import { prettyPhone, when } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { useSession } from '../../App';

export function TeacherAlertsLog({ list }: { list: Message[] }) {
  const { me } = useSession();
  const { locale } = useI18n();
  const messages = useMemo(() => {
    return list.sort((a, b) => b.at.localeCompare(a.at));
  }, [list]);

  return (
    <main className="flex flex-col relative w-full pt-16 pb-24 px-margin-mobile bg-surface min-h-screen">
      <div className="flex flex-col w-full">
        {/* Faculty / Context Sub-Header Badge */}
        <div className="flex flex-col gap-space-xs mb-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
              <span className="font-label-md text-[14px] text-secondary">{me.college || 'Your College'}</span>
            </div>
            <span className="bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full font-label-sm text-[11px]">Live Portal</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="font-body-sm text-[13px] text-on-surface-variant">
              {me.name} <span className="font-label-md text-[14px] text-on-surface ml-1">· Faculty</span>
            </p>
          </div>
        </div>

        {/* Intro Text / Notification Banner */}
        <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm mb-space-md shadow-sm">
          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="font-label-md text-[14px] text-on-surface font-semibold">Central Regulatory Stream</h2>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-tight">
              Every alert about students in your classes: in-app alerts, phone notifications, and the WhatsApp messages you sent.
            </p>
          </div>
        </div>

        {/* Container 1: Active Feed State */}
        {messages.length > 0 ? (
          <div className="flex flex-col w-full">
            <div className="rounded-2xl overflow-hidden shadow-md bg-surface-container-lowest">
              <div className="bg-tertiary-container px-space-md py-3 flex items-center justify-between text-on-primary">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-white text-[18px]">mark_chat_read</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-md text-[14px] text-white font-bold">{me.college || 'Your College'}</span>
                      <span className="material-symbols-outlined text-secondary-container text-[14px]">verified</span>
                    </div>
                    <span className="font-label-sm text-[11px] text-on-tertiary-container">Parent & Faculty Synchronized Log</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                  <span className="font-label-sm text-[11px] text-secondary-fixed font-bold">LIVE</span>
                </div>
              </div>

              <div className="p-space-md bg-[#EEF2F0] flex flex-col gap-space-md min-h-[300px]">
                {messages.map(m => {
                  const isWa = m.manual;
                  const isFailed = m.status === 'failed' || m.status === 'skipped';
                  const bgClass = isWa ? 'bg-[#DCF8C6] rounded-tr-sm self-end' : 'bg-[#E6F4EA] rounded-tl-sm self-start';
                  const deliveredBy = isWa ? 'WhatsApp, sent by the teacher' : m.channel === 'inbox' ? 'In app' + (m.pushed?.ok ? ` · sent to ${m.pushed.ok} phone(s)` : '') : m.channel.toUpperCase();

                  return (
                    <div key={m.id} className={`flex flex-col rounded-2xl p-3.5 shadow-sm max-w-[94%] ${bgClass} ${isFailed ? 'opacity-80' : ''}`}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`font-label-sm text-[11px] font-semibold ${isWa ? 'text-[#0B6E63]' : 'text-secondary'}`}>
                          {isWa ? `WhatsApp to ${m.toRole}: ${m.to}` : `To ${m.toRole}: ${m.to}`}
                        </span>
                        <span className="font-label-sm text-[11px] text-outline font-mono">{prettyPhone(m.phone)}</span>
                      </div>
                      <p className="font-body-sm text-[13px] text-on-surface mb-2 leading-relaxed" dir="auto">
                        {m.body}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-[11px]">
                          <span className="material-symbols-outlined text-[14px]">{isWa ? 'chat' : 'phonelink_ring'}</span>
                          <span>{deliveredBy}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <span className="font-label-sm text-[11px] text-outline">{when(m.at, locale)}</span>
                          {!isFailed && <span className={`material-symbols-outlined text-[14px] ${isWa ? 'text-[#006A61]' : 'text-outline'} leading-none`}>done_all</span>}
                          {isFailed && <span className="text-error text-[11px] font-bold ml-1">Failed</span>}
                        </div>
                      </div>
                      {isFailed && (
                        <div className="mt-1 text-[11px] text-error font-mono">{m.error}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-surface-container-low px-space-md py-2.5 flex items-center justify-between">
                <span className="font-label-sm text-[11px] text-on-surface-variant">Automated SMS gateway fallback active</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-space-xl bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-outline">
              <span className="material-symbols-outlined text-[32px]">notifications_paused</span>
            </div>
            <h3 className="font-headline-sm text-[18px] text-on-surface mb-1 font-bold">No alerts yet</h3>
            <p className="font-body-sm text-[13px] text-on-surface-variant max-w-[260px] leading-relaxed">
              Alerts appear here after you take attendance and students are marked absent.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
