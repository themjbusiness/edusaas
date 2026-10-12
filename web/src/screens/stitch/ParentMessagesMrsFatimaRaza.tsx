import { useMemo, useState } from 'react';
import type { Message } from '../../lib/api';
import { when } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { useSession } from '../../App';

export function ParentMessagesMrsFatimaRaza({ list }: { list: Message[] }) {
  const { me } = useSession();
  const { locale } = useI18n();
  const [filter, setFilter] = useState('all');

  const messages = useMemo(() => {
    let sorted = list.sort((a, b) => b.at.localeCompare(a.at));
    if (filter !== 'all') {
      // Very basic filtering based on mock data patterns since there isn't a strict category in the backend
      sorted = sorted.filter(m => m.body.toLowerCase().includes('absent'));
    }
    return sorted;
  }, [list, filter]);

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-20 bg-surface px-margin-mobile min-h-screen">
      <div className="flex flex-col w-full pb-6 space-y-space-md">
        
        {/* Institutional Channel Banner */}
        <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-md flex flex-col gap-space-sm relative overflow-hidden border border-outline-variant/30">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">account_balance</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-space-xs">
                <h2 className="font-headline-sm text-[18px] text-on-surface truncate font-bold">{me.college || 'Your College'}</h2>
                <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
              </div>
              <p className="font-body-sm text-[13px] text-on-surface-variant truncate">Official Guardian Communications · Portal Feed</p>
            </div>
          </div>
          <div className="rounded-lg bg-surface-container-low px-space-sm py-space-xs flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[16px]">sync_saved_locally</span>
            <p className="font-label-sm text-[11px] text-on-surface-variant">Synchronized alert feed · Free via In-App, SMS & WhatsApp</p>
          </div>
        </div>

        {/* Filter Pill Bar */}
        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full font-label-md text-[14px] whitespace-nowrap active:scale-95 transition-transform ${filter === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant'}`}>
            All Messages ({list.length})
          </button>
          <button onClick={() => setFilter('absence')} className={`px-3 py-1.5 rounded-full font-label-md text-[14px] whitespace-nowrap active:scale-95 transition-transform ${filter === 'absence' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant'}`}>
            Absence Alerts
          </button>
        </div>

        {/* Messages Timeline Feed */}
        <div className="flex flex-col space-y-space-md">
          {messages.length === 0 ? (
            <p className="text-center text-on-surface-variant text-[14px] py-10">No messages found.</p>
          ) : (
            messages.map(m => {
              const isWa = m.manual;
              const isFailed = m.status === 'failed' || m.status === 'skipped';
              
              if (isWa) {
                return (
                  <article key={m.id} className={`message-card rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col border border-outline-variant/30 ${isFailed ? 'opacity-70' : ''}`}>
                    <div className="bg-secondary-container px-space-md py-space-xs flex items-center justify-between">
                      <div className="flex items-center gap-space-xs text-on-secondary-container">
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold">WhatsApp Delivery · Direct from Faculty</span>
                      </div>
                      <span className="font-label-sm text-[11px] text-on-secondary-container">{when(m.at, locale)}</span>
                    </div>
                    <div className="p-space-md flex flex-col space-y-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md text-[14px] font-bold flex-shrink-0">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-label-lg text-[14px] font-bold text-on-surface truncate">Teacher Message</h3>
                          <p className="font-body-sm text-[12px] text-on-surface-variant truncate">To {m.toRole}: {m.to}</p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-surface-container-low p-space-md text-on-surface flex flex-col space-y-space-xs">
                        <p className="font-body-md text-[14px] leading-relaxed" dir="auto">{m.body}</p>
                      </div>
                      <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-[11px]">
                        <span className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-[15px] text-secondary">forum</span>
                          WhatsApp, sent by the teacher
                        </span>
                        <span className={`flex items-center gap-1 font-semibold ${isFailed ? 'text-error' : 'text-secondary'}`}>
                          {isFailed ? m.error || 'Failed' : 'Delivered'}
                          {!isFailed && <span className="material-symbols-outlined text-[14px]">done_all</span>}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              }

              // System message
              const deliveredBy = m.channel === 'inbox' ? 'In app' + (m.pushed?.ok ? ` · sent to ${m.pushed.ok} phone(s)` : '') : m.channel.toUpperCase();
              
              return (
                <article key={m.id} className={`message-card rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col border border-outline-variant/30 ${isFailed ? 'opacity-70' : ''}`}>
                  <div className="bg-error-container px-space-md py-space-xs flex items-center justify-between">
                    <div className="flex items-center gap-space-xs text-on-error-container">
                      <span className="material-symbols-outlined text-[16px]">notification_important</span>
                      <span className="font-label-sm text-[11px] uppercase tracking-wide font-bold">Automated Notice</span>
                    </div>
                    <span className="font-label-sm text-[11px] text-on-error-container font-bold">{when(m.at, locale)}</span>
                  </div>
                  <div className="p-space-md flex flex-col space-y-space-sm">
                    <div className="rounded-lg bg-surface-container-low px-space-sm py-space-xs flex flex-col gap-0.5">
                      <span className="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Recipient Reference</span>
                      <p className="font-label-md text-[13px] text-on-surface truncate">
                        To: <span className="font-normal text-on-surface-variant">{m.to}</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-container p-space-md text-on-surface space-y-space-xs border border-outline-variant/50">
                      <p className="font-body-md text-[14px] leading-relaxed" dir="auto">{m.body}</p>
                    </div>
                    <div className="flex items-center justify-between pt-space-xs font-label-sm text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[15px] text-primary">{m.channel === 'sms' ? 'sms' : 'smartphone'}</span>
                        {deliveredBy}
                      </span>
                      <span className={`font-medium ${isFailed ? 'text-error' : 'text-on-surface'}`}>
                        {isFailed ? m.error || 'Failed' : 'Received'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Institutional Assurance Footnote */}
        <aside className="rounded-xl bg-surface-container-high p-space-md flex items-start gap-space-sm shadow-sm mt-space-sm">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">info</span>
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            <h4 className="font-label-md text-[14px] text-primary font-bold">Official College Assurance</h4>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
              All parent alerts, WhatsApp notifications, and remedial tracking messages are completely free of charge, subsidized under the {me.college || 'College'} digital modernization initiative.
            </p>
          </div>
        </aside>

      </div>
    </main>
  );
}
