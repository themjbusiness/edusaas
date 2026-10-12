import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { media, post, type LessonFull, type Progress } from '../../lib/api';
import { mmss } from '../../lib/format';
import { loadUrduFont, useI18n } from '../../lib/i18n';
import { go } from '../../lib/router';
import { take } from '../../lib/prefetch';
import { useLoad } from '../../lib/useLoad';
import { ErrorCard, Skeleton, useToast } from '../../ui';

type Track = 'mix' | 'ur';
const trackPref = (): Track => { try { return localStorage.getItem('edusaas_track') === 'ur' ? 'ur' : 'mix'; } catch { return 'mix'; } };

export function LessonPlayerPhysics12({ args }: { args?: string[] }) {
  const id = args?.[0] || '';
  const [pref, setPref] = useState<Track>(trackPref);
  const { data, error, reload, setData } = useLoad(() => take<LessonFull>('lessons/' + encodeURIComponent(id)), [id]);
  
  if (error) return (
    <main className="flex flex-col relative w-full pt-16 bg-surface px-margin-mobile">
      <a className="flex items-center gap-1 text-primary font-label-md text-[14px] mb-4" href="#/home">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Home
      </a>
      <ErrorCard error={error} onRetry={reload} />
    </main>
  );
  if (!data) return <Skeleton rows={6} />;
  
  const track: Track = data.urdu && pref === 'ur' ? 'ur' : 'mix';
  function switchTrack(next: Track) {
    try { localStorage.setItem('edusaas_track', next); } catch { /* ignore */ }
    setData(null); setPref(next); reload();
  }
  
  return <Player key={track} l0={data} track={track} onTrack={switchTrack} />;
}

function Player({ l0, track, onTrack }: { l0: LessonFull; track: Track; onTrack: (t: Track) => void }) {
  const { t, subj } = useI18n();
  const toast = useToast();
  const l = useMemo(() => (track === 'ur' && l0.urdu
    ? { ...l0, audio: l0.urdu.audio, script: l0.urdu.script, duration: l0.urdu.duration, progress: { ...l0.progress, heardSecs: l0.progress.heardSecsUr || [] } }
    : l0), [l0, track]);
    
  const total = Math.max(1, Math.ceil(l.duration));
  const [playerExpanded, setPlayerExpanded] = useState(true);
  const heard = useRef(new Set<number>(l.progress.heardSecs));
  const unsent = useRef(new Set<number>());
  const audio = useRef<HTMLAudioElement | null>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [unlocked, setUnlocked] = useState(l.progress.unlocked);
  const [ended, setEnded] = useState(false);
  const [follow, setFollow] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  
  const playingRef = useRef(false), rateRef = useRef(1), unlockedRef = useRef(unlocked), sending = useRef(false);
  playingRef.current = playing; rateRef.current = rate; unlockedRef.current = unlocked;

  const span = (k: number) => [l.script[k].t, k + 1 < l.script.length ? l.script[k + 1].t : l.duration];
  const isHeard = (k: number) => {
    const [a0, b0] = span(k), a = Math.floor(a0), b = Math.ceil(b0);
    let n = 0;
    for (let s = a; s < b; s++) if (heard.current.has(s)) n++;
    return b <= a || n / (b - a) >= 0.8;
  };
  
  const sectionAt = (time: number) => { let k = 0; while (k + 1 < l.script.length && l.script[k + 1].t <= time + 0.05) k++; return k; };
  const firstUnheard = () => { let k = 0; while (k < l.script.length && isHeard(k)) k++; return k >= l.script.length ? 0 : k; };
  const [idx, setIdx] = useState(firstUnheard);
  const [page, setPage] = useState(() => l.script[firstUnheard()]?.pg ?? 0);

  const flush = useCallback((keepalive = false) => {
    const secs = [...unsent.current];
    if (!secs.length || (sending.current && !keepalive)) return;
    unsent.current = new Set(); sending.current = true;
    post<Progress>('lessons/' + encodeURIComponent(l.id) + '/progress', { secs, track }, { keepalive }).then((p) => {
      sending.current = false;
      if (p.unlocked && !unlockedRef.current) { setUnlocked(true); toast(t('Quiz unlocked')); }
    }, () => { sending.current = false; secs.forEach((s) => unsent.current.add(s)); });
  }, [l.id, track, t, toast]);

  useEffect(() => {
    if (track === 'ur') loadUrduFont();
    const A = new Audio(media(l.audio));
    A.preload = 'metadata';
    audio.current = A;
    let last: number | null = null, wake: { release: () => void } | null = null;
    if (idx) A.currentTime = l.script[idx].t;
    const onTime = () => {
      const now = A.currentTime;
      if (playingRef.current && last !== null && now >= last && now - last < 1.5 * rateRef.current + 0.5) {
        for (let s = Math.floor(last); s <= Math.floor(now); s++) if (!heard.current.has(s)) { heard.current.add(s); unsent.current.add(s); }
      }
      last = now; setIdx(sectionAt(now)); bump();
    };
    const onSeek = () => { last = null; };
    const onEnd = () => { setPlaying(false); setEnded(true); flush(); };
    const onErr = () => { if (!A.getAttribute('src')) return; setPlaying(false); toast(t('Could not load the audio. Check your connection.')); };
    const onPlay = () => {
      setEnded(false);
      (navigator as unknown as { wakeLock?: { request: (k: string) => Promise<{ release: () => void }> } }).wakeLock?.request('screen').then((w) => { wake = w; }, () => {});
    };
    A.addEventListener('timeupdate', onTime); A.addEventListener('seeking', onSeek); A.addEventListener('ended', onEnd);
    A.addEventListener('error', onErr); A.addEventListener('play', onPlay);
    const timer = window.setInterval(() => flush(), 5000);
    return () => {
      window.clearInterval(timer); flush(true);
      A.removeEventListener('timeupdate', onTime); A.removeEventListener('seeking', onSeek); A.removeEventListener('ended', onEnd);
      A.removeEventListener('error', onErr); A.removeEventListener('play', onPlay);
      try { A.pause(); A.removeAttribute('src'); A.load(); } catch { /* ignore */ }
      try { wake?.release(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => { if (follow && !ended && l.script[idx] && l.script[idx].pg !== page) setPage(l.script[idx].pg); }, [idx, follow, ended]);

  const A = () => audio.current!;
  function play() {
    if (A().ended) A().currentTime = 0;
    A().playbackRate = rate; setPlaying(true);
    A().play()?.catch(() => setPlaying(false));
  }
  function halt() { setPlaying(false); A().pause(); flush(); }
  function jumpTo(k: number) { k = Math.max(0, Math.min(l.script.length - 1, k)); A().currentTime = l.script[k].t + 0.01; setIdx(k); }
  function cycleRate() { const r = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1; setRate(r); A().playbackRate = r; }

  const share = Math.min(1, heard.current.size / total);
  const cur = l.script[idx];
  const currentTime = audio.current?.currentTime || 0;
  const urdu = track === 'ur' ? { lang: 'ur' } : {};
  const isUrdu = track === 'ur';

  return (
    <main className="flex flex-col relative w-full pt-16 bg-surface min-h-screen">
      <div className="flex flex-col w-full pb-40">
        
        {/* Top Meta & Title Section */}
        <section className="px-margin-mobile pt-space-sm flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs flex-wrap">
            <a className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer mr-1" href={`#/library/${l.subjectCode}`}>
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </a>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary-container text-on-primary font-label-md text-[14px] font-bold">
              {l.topic}
            </span>
            <h1 className="font-headline-sm text-[18px] font-bold text-primary">
              {l.title}
            </h1>
          </div>
          
          <div className="flex items-center justify-between gap-space-xs flex-wrap mt-0.5 ml-10">
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-[13px]">
              <span className="material-symbols-outlined text-[15px] text-secondary">schedule</span>
              <span>{mmss(l.duration)}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="material-symbols-outlined text-[15px] text-secondary">menu_book</span>
              <span>Textbook pages {l.pages.join(', ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {l.missed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span> Missed lecture
                </span>
              )}
              {l.review === 'draft' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] font-bold">
                  Draft, not reviewed
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Two Column Layout on Desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:px-8 mt-2 w-full">
          
          {/* Right Column (Mobile Top): Textbook Viewer */}
          <div className="lg:col-span-7 lg:order-2 flex flex-col order-1">
            <section className="px-margin-mobile lg:px-0 mt-space-md flex flex-col h-full">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg">
                  {l.pages.map((p, k) => (
                    <button key={p} className={`px-3 py-1 rounded-md font-label-md text-[14px] font-bold transition-all ${k === page ? 'bg-primary-container text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`} onClick={() => { setFollow(false); setPage(k); }}>
                      p. {p}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary" />
                  <span className="font-label-sm text-[12px] font-bold text-on-surface-variant">Follow audio</span>
                </label>
              </div>

              {/* Scanned Textbook Container */}
              <div className="relative w-full rounded-xl bg-white shadow-md overflow-hidden flex-1 flex flex-col border border-outline-variant cursor-zoom-in lg:sticky lg:top-24 min-h-[400px]" onClick={() => setZoom(true)}>
                <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-md text-on-primary font-label-sm text-[11px] shadow-sm font-bold" type="button">
                    <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                    <span>Tap to zoom</span>
                  </button>
                </div>
                <picture className="w-full h-full object-contain bg-surface-container-lowest">
                  <source media="(min-width: 960px)" srcSet={media(l.images[page])} />
                  <img src={media((l.imagesSmall || l.images)[page])} alt={'Textbook page ' + l.pages[page]} className="w-full h-full object-contain" fetchPriority="high" decoding="async" />
                </picture>
              </div>
              
              <p className="text-center font-body-sm text-[11px] text-outline mt-1.5 font-bold uppercase tracking-wider">
                Intermediate {subj(l.subject)} • FBISE Approved
              </p>
            </section>
          </div>

          {/* Left Column (Mobile Bottom): Captions & Transcript */}
          <div className="lg:col-span-5 lg:order-1 flex flex-col order-2">
            {/* Synchronized Audio Caption Card */}
            <section className="px-margin-mobile lg:px-0 mt-space-md">
              <div className="relative bg-surface-container-low rounded-xl p-space-md shadow-sm overflow-hidden border border-outline-variant/30">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                    <span className="font-label-sm text-[10px] font-bold tracking-widest text-secondary uppercase">
                      NOW EXPLAINING
                    </span>
                  </div>
                  
                  {l0.urdu && (
                    <div className="flex items-center bg-surface-container-highest p-0.5 rounded-lg text-[11px] font-bold shadow-inner">
                      <button onClick={() => track !== 'mix' && onTrack('mix')} className={`px-2 py-0.5 rounded-md transition-all ${!isUrdu ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                        English mix
                      </button>
                      <button onClick={() => track !== 'ur' && onTrack('ur')} className={`px-2 py-0.5 rounded-md transition-all font-['Noto_Nastaliq_Urdu'] pt-0.5 ${isUrdu ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                        اردو
                      </button>
                    </div>
                  )}
                </div>
                <div className="pl-2 mt-2.5 min-h-[4rem]">
                  <div className={`font-body-md text-[16px] text-on-surface leading-relaxed ${isUrdu ? "font-['Noto_Nastaliq_Urdu']" : ''}`} dir="auto" {...urdu}>
                    {ended ? t('Lesson complete. You can now take the quiz.') : cur?.x}
                  </div>
                </div>
              </div>
            </section>

            {/* Collapsible Full Transcript Accordion */}
            <section className="px-margin-mobile lg:px-0 mt-space-md">
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
                <button onClick={() => setTranscriptOpen(!transcriptOpen)} className="w-full px-space-md py-3 flex items-center justify-between text-left hover:bg-surface-container-low transition-colors" type="button">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">subtitles</span>
                    <span className="font-label-lg text-[15px] font-bold text-primary">Full transcript ({isUrdu ? 'Urdu' : 'English'})</span>
                  </div>
                  <span className={`material-symbols-outlined text-outline text-[20px] transition-transform duration-200 ${transcriptOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                
                {transcriptOpen && (
                  <div className="flex flex-col px-space-md pb-3 pt-1 gap-2 bg-surface-container-lowest max-h-[500px] overflow-y-auto">
                    {l.script.map((s, k) => {
                      const active = k === idx;
                      const heardLine = isHeard(k);
                      
                      return (
                        <div key={k} onClick={() => { jumpTo(k); if (!playing) play(); }} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${active ? 'bg-secondary-container/30' : heardLine ? 'bg-surface-container-lowest hover:bg-surface-container-low opacity-80' : 'hover:bg-surface-container-low'}`}>
                          {active ? (
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-[14px] text-secondary animate-pulse">volume_up</span>
                              <span className="font-mono text-[11px] font-bold text-secondary">{mmss(s.t)}</span>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-outline shrink-0 mt-0.5">{mmss(s.t)}</span>
                          )}
                          <p className={`font-body-sm text-[13px] ${active ? 'font-bold text-on-surface' : 'text-on-surface-variant'} ${isUrdu ? "font-['Noto_Nastaliq_Urdu']" : ''}`} dir="auto" {...urdu}>
                            {s.x}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

      </div>

      {/* Sticky / Docked Bottom Audio Player & Quiz Unlock Bar */}
      <div className={`fixed left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-margin-mobile pt-3 border-t border-outline-variant/30 transition-all duration-300 ${playerExpanded ? 'bottom-[64px] pb-safe' : 'bottom-[64px] pb-2'}`}>
        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
          <button onClick={() => setPlayerExpanded(!playerExpanded)} className="w-14 h-7 bg-surface-container-lowest/95 backdrop-blur-md rounded-t-full flex items-center justify-center border border-b-0 border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors shadow-[0_-4px_8px_rgba(0,0,0,0.05)]">
            <span className="material-symbols-outlined text-[20px] leading-none">{playerExpanded ? 'expand_more' : 'expand_less'}</span>
          </button>
        </div>
        <div className="max-w-md mx-auto flex flex-col gap-2 pb-2">
          
          {/* Segmented Progress Bar */}
          <div className="w-full flex items-center gap-0.5 h-1.5 cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickShare = (e.clientX - rect.left) / rect.width;
            const targetSection = Math.floor(clickShare * l.script.length);
            jumpTo(targetSection);
            if (!playing) play();
          }}>
            {l.script.map((_, k) => {
              const active = k === idx;
              const heardSeg = isHeard(k);
              return (
                <div key={k} className={`flex-1 h-full rounded-full transition-colors relative ${active ? 'bg-primary-container' : heardSeg ? 'bg-secondary' : 'bg-surface-container-highest'}`}>
                  {active && <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface z-10"></span>}
                </div>
              );
            })}
          </div>

          {playerExpanded && (
            <>
              <div className="flex items-center justify-between font-label-sm text-[11px] font-bold text-on-surface-variant">
                <span className="font-bold text-primary">
                  <strong>{Math.round(share * 100)}%</strong> heard • section {idx + 1} of {l.script.length}
                </span>
                <span className="font-mono text-outline">{ended ? 'Finished' : `${mmss(currentTime)} / ${mmss(l.duration)}`}</span>
              </div>

              <div className="flex items-center justify-between px-2 pt-0.5">
                <button onClick={cycleRate} className="min-w-[40px] h-8 px-2 rounded-lg bg-surface-container-low text-primary font-label-sm text-[13px] font-bold flex items-center justify-center hover:bg-surface-container transition-colors shadow-inner" type="button">
                  {rate}x
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => { audio.current!.currentTime = Math.max(0, audio.current!.currentTime - 10); bump(); }} className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 transition-all" aria-label="Rewind 10s">
                    <span className="material-symbols-outlined text-[20px]">replay_10</span>
                  </button>
                  <button onClick={() => jumpTo(currentTime - (cur?.t || 0) > 3 ? idx : idx - 1)} className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 transition-all" aria-label="Previous section">
                    <span className="material-symbols-outlined text-[22px]">skip_previous</span>
                  </button>
                  <button onClick={() => (playing ? halt() : play())} className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-90 transition-transform" aria-label={playing ? 'Pause' : 'Play'}>
                    <span className="material-symbols-outlined text-[32px]">{playing ? 'pause' : 'play_arrow'}</span>
                  </button>
                  <button onClick={() => jumpTo(idx + 1)} className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 transition-all" aria-label="Next section">
                    <span className="material-symbols-outlined text-[22px]">skip_next</span>
                  </button>
                  <button onClick={() => { audio.current!.currentTime = Math.min(l.duration - 0.1, audio.current!.currentTime + 10); bump(); }} className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 transition-all" aria-label="Forward 10s">
                    <span className="material-symbols-outlined text-[20px]">forward_10</span>
                  </button>
                </div>
                <div className="w-8"></div>
              </div>

              <div className="mt-1 pb-1">
                {unlocked ? (
                  <button onClick={() => { halt(); go('#/quiz/' + encodeURIComponent(l.id)); }} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-on-secondary font-label-lg text-[16px] font-bold shadow-md hover:bg-on-secondary-container active:scale-[0.99] transition-all" type="button">
                    <span className="material-symbols-outlined text-[20px]">{l.progress.passed ? 'check_circle' : 'task_alt'}</span>
                    <span>{l.progress.passed ? 'Retake quiz' : 'Start chapter quiz'}</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-label-md text-[14px] font-bold shadow-inner select-none">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-outline">lock</span>
                      <span>Quiz unlocks at 90% heard</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {!playerExpanded && (
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="font-bold text-primary font-label-sm text-[11px]">
                {Math.round(share * 100)}% heard
              </span>
              <button onClick={() => (playing ? halt() : play())} className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-transform" aria-label={playing ? 'Pause' : 'Play'}>
                <span className="material-symbols-outlined text-[24px]">{playing ? 'pause' : 'play_arrow'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {zoom && <Zoom src={media(l.images[page])} alt={'Textbook page ' + l.pages[page]} onClose={() => setZoom(false)} />}
    </main>
  );
}

function Zoom({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [w, setW] = useState(() => Math.min(window.innerWidth * 1.6, 1400));
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  const set = (k: number) => setW((x) => Math.max(window.innerWidth * 0.9, Math.min(2600, x * k)));
  
  return (
    <div className="fixed inset-0 z-[100] bg-scrim flex flex-col backdrop-blur-sm" role="dialog" aria-label="Zoomed page" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="flex items-center justify-center gap-2 p-4 bg-surface-container-lowest/80 shadow-md">
        <button className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform" aria-label="Zoom out" onClick={() => set(1 / 1.3)}><span className="material-symbols-outlined">remove</span></button>
        <button className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform" aria-label="Zoom in" onClick={() => set(1.3)}><span className="material-symbols-outlined">add</span></button>
        <button className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shadow-sm active:scale-95 transition-transform" aria-label="Close" ref={close} onClick={onClose}><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start"><img src={src} alt={alt} style={{ width: w }} className="rounded-xl shadow-2xl max-w-none" /></div>
    </div>
  );
}
