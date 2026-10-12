import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { media, post, type LessonFull, type Progress } from '../../lib/api';
import { mmss } from '../../lib/format';
import { loadUrduFont, useI18n } from '../../lib/i18n';
import { go } from '../../lib/router';
import { take } from '../../lib/prefetch';
import { useLoad } from '../../lib/useLoad';
import { Badge, ErrorCard, Icon, OfflineBanner, Skeleton, useToast } from '../../ui';

type Track = 'mix' | 'ur';
const trackPref = (): Track => { try { return localStorage.getItem('edusaas_track') === 'ur' ? 'ur' : 'mix'; } catch { return 'mix'; } };

export default function Lesson({ args }: { args: string[] }) {
  const { t } = useI18n();
  const id = args[0] || '';
  const [pref, setPref] = useState<Track>(trackPref);
  const { data, error, reload, setData } = useLoad(() => take<LessonFull>('lessons/' + encodeURIComponent(id)), [id]);
  const back = <div className="flex gap-1.5 items-center text-on-surface-variant text-[14px]"><a href="#/home"><Icon name="back" sm />{t('Home')}</a></div>;
  if (error) return <>{back}<ErrorCard error={error} onRetry={reload} /></>;
  if (!data) return <><OfflineBanner /><Skeleton rows={2} /></>;
  const track: Track = data.urdu && pref === 'ur' ? 'ur' : 'mix';
  function switchTrack(next: Track) {
    try { localStorage.setItem('edusaas_track', next); } catch { /* ignore */ }
    setData(null); setPref(next); reload(); // fresh progress for the other track
  }
  return <Player key={track} l0={data} track={track} onTrack={switchTrack} />;
}

function Player({ l0, track, onTrack }: { l0: LessonFull; track: Track; onTrack: (t: Track) => void }) {
  const { t, subj } = useI18n();
  const toast = useToast();
  const l = useMemo(() => (track === 'ur' && l0.urdu
    ? { ...l0, audio: l0.urdu.audio, script: l0.urdu.script, duration: l0.urdu.duration,
      progress: { ...l0.progress, heardSecs: l0.progress.heardSecsUr || [] } }
    : l0), [l0, track]);
  const total = Math.max(1, Math.ceil(l.duration));
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

  // Report played seconds to the server; the server decides when the quiz unlocks.
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
      // Only natural playback counts: a small forward step while playing, never a seek.
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
      (navigator as unknown as { wakeLock?: { request: (k: string) => Promise<{ release: () => void }> } }).wakeLock?.request('screen')
        .then((w) => { wake = w; }, () => {});
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (follow && !ended && l.script[idx] && l.script[idx].pg !== page) setPage(l.script[idx].pg); }, [idx, follow, ended]); // eslint-disable-line react-hooks/exhaustive-deps

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
  return (
    <>
      <OfflineBanner />
      <div className="flex gap-1.5 items-center text-on-surface-variant text-[14px]"><a href="#/home"><Icon name="back" sm />{t('Home')}</a><span>/</span>
        <a href={'#/subject/' + l.subjectCode}>{subj(l.subject)}</a><span>/</span><span>{t('Unit {n}', { n: l.unit })}</span></div>
      <div className="flex gap-2.5 items-center" style={{ alignItems: 'flex-start', marginTop: 4 }}>
        <span className="inline-grid place-items-center min-w-[44px] h-[44px] rounded-[10px] bg-[#e3f4f2] text-[#0b6f66] font-bold text-[15px]">{l.topic}</span>
        <div className="flex-1 min-w-0"><h1 style={{ margin: 0 }}>{l.title}</h1>
          <div className="flex gap-3 flex-wrap text-on-surface-variant text-[13px] mt-0.5">
            <span><Icon name="clock" sm />{mmss(l.duration)}</span>
            <span><Icon name="pages" sm />{t('Textbook pages {p}', { p: l.pages.join(', ') })}</span>
            {l.missed && <Badge tone="pend">{t('Missed lecture')}</Badge>}
            {l.review === 'draft' && <Badge tone="neutral">{t('Draft, not yet reviewed')}</Badge>}
          </div></div>
      </div>
      <div className="lesson-grid">
        <div className="lesson-page">
          <div className="flex gap-1.5 items-center flex-wrap my-3" role="group" aria-label="Textbook pages">
            {l.pages.map((p, k) => (
              <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" key={p} aria-label={'Page ' + p} aria-current={k === page}
                onClick={() => { setFollow(false); setPage(k); }}>p. {p}</button>
            ))}
            <label className="follow"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> {t('Follow audio')}</label>
          </div>
          <PageImage src={media(l.images[page])} small={media((l.imagesSmall || l.images)[page])} alt={'Textbook page ' + l.pages[page]}
            onZoom={() => setZoom(true)} hint={t('Tap to zoom')} />
          <p className="text-on-surface-variant text-[14px] text-[13px]" style={{ margin: '6px 2px 0' }}>{t('Physics Grade 11, National Book Foundation. Shown for internal demo only.')}</p>
        </div>
        <div className="lesson-side">
          {l0.urdu && (
            <div className="tracksw" role="group" aria-label={t('Narration')}><span>{t('Narration')}</span>
              <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" aria-pressed={track === 'mix'} onClick={() => track !== 'mix' && onTrack('mix')}>{t('English mix')}</button>
              <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" lang="ur" aria-pressed={track === 'ur'} onClick={() => track !== 'ur' && onTrack('ur')}>اردو</button>
            </div>
          )}
          <div className="border-l-4 border-secondary bg-surface-container-lowest rounded-r-[10px] p-2.5 my-3 text-[15px]" aria-live="polite"><div className="lbl">{t('Now explaining')}</div>
            <div dir="auto" {...urdu}>{ended ? t('Lesson complete. You can now take the quiz.') : cur?.x}</div></div>
          <div className="fixed inset-x-0 bottom-[64px] z-15 bg-surface-container-lowest border-t border-outline-variant" role="region" aria-label="Lesson audio"><div className="in">
            <div className="segbar">
              {l.script.map((_, k) => (
                <button key={k} aria-label={'Section ' + (k + 1)} className={(isHeard(k) ? 'heard' : '') + (k === idx ? ' on' : '')}
                  onClick={() => { jumpTo(k); if (!playing) play(); }} />
              ))}
            </div>
            <div className="times"><span>{t('{p}% heard · section {i} of {n}', { p: Math.round(share * 100), i: idx + 1, n: l.script.length })}</span>
              <span>{ended ? t('Finished') : mmss(currentTime) + ' / ' + mmss(l.duration)}</span></div>
            <div className="controls">
              <button className="skip" aria-label="Back 10 seconds" onClick={() => { A().currentTime = Math.max(0, A().currentTime - 10); bump(); }}>-10s</button>
              <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" aria-label="Previous section" onClick={() => jumpTo(currentTime - (cur?.t || 0) > 3 ? idx : idx - 1)}><Icon name="prev" /></button>
              <button className="play" aria-label={playing ? 'Pause' : 'Play'} onClick={() => (playing ? halt() : play())}><Icon name={playing ? 'pause' : 'play'} /></button>
              <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" aria-label="Next section" onClick={() => jumpTo(idx + 1)}><Icon name="next" /></button>
              <button className="skip" aria-label="Forward 10 seconds" onClick={() => { A().currentTime = Math.min(l.duration - 0.1, A().currentTime + 10); bump(); }}>+10s</button>
              <button className="rate" aria-label="Playback speed" onClick={cycleRate}>{rate}x</button>
            </div>
            <button className={'block ' + (unlocked ? 'accent' : '')} disabled={!unlocked}
              onClick={() => { halt(); go('#/quiz/' + encodeURIComponent(l.id)); }}>
              {unlocked ? <><Icon name="check" sm />{t(l.progress.passed ? 'Retake quiz' : 'Start quiz')}</> : <><Icon name="lock" sm />{t('Quiz unlocks at 90% heard')}</>}
            </button>
          </div></div>
          <details className="bg-surface-container-lowest border border-outline-variant rounded-[10px] px-3" open={matchMedia('(min-width: 960px)').matches}>
            <summary>{t(track === 'ur' ? 'Full transcript (Urdu)' : 'Full transcript (Roman Urdu)')}</summary>
            <div style={{ paddingBottom: 8 }}>
              {l.script.map((s, k) => (
                <button key={k} dir="auto" {...urdu} className={'seg-line' + (k === idx ? ' on' : '') + (isHeard(k) ? ' heard' : '')}
                  onClick={() => { jumpTo(k); if (!playing) play(); }}>{s.x}</button>
              ))}
            </div>
          </details>
        </div>
      </div>
      {zoom && <Zoom src={media(l.images[page])} alt={'Textbook page ' + l.pages[page]} onClose={() => setZoom(false)} />}
    </>
  );
}

/** Phones get the 600 px page (half the bytes on 3G); wide screens and the zoom view get the full page. */
function PageImage({ src, small, alt, onZoom, hint }: { src: string; small: string; alt: string; onZoom: () => void; hint: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(false), [src]);
  return (
    <div className="relative bg-white border border-outline-variant rounded-[10px] overflow-hidden aspect-[595/759] cursor-zoom-in" role="button" tabIndex={0} aria-label="Open page in zoom view" onClick={onZoom}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onZoom(); } }}>
      <div className="absolute inset-0 p-5 grid gap-2.5 content-start" aria-hidden="true" hidden={ready}>
        {[60, 100, 100, 85, 100, 70, 100, 40].map((w, i) => <i key={i} style={{ width: w + '%' }} />)}
      </div>
      <picture>
        <source media="(min-width: 960px)" srcSet={src} />
        <img src={small} alt={alt} className={ready ? 'ready' : ''} onLoad={() => setReady(true)} fetchPriority="high" decoding="async" />
      </picture>
      <span className="zoomhint"><Icon name="zoom" sm />{hint}</span>
    </div>
  );
}

function Zoom({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [w, setW] = useState(() => Math.min(window.innerWidth * 1.6, 1400));
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  const set = (k: number) => setW((x) => Math.max(window.innerWidth * 0.9, Math.min(2600, x * k)));
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c12f0] flex flex-col" role="dialog" aria-label="Zoomed page" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="zbar">
        <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" aria-label="Zoom out" onClick={() => set(1 / 1.3)}><Icon name="minus" /></button>
        <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" aria-label="Zoom in" onClick={() => set(1.3)}><Icon name="plus" /></button>
        <button className="inline-flex items-center justify-center gap-2 min-h-[48px] px-[18px] font-semibold rounded-[10px] border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer" aria-label="Close" ref={close} onClick={onClose}><Icon name="cross" /></button>
      </div>
      <div className="zbody"><img src={src} alt={alt} style={{ width: w }} /></div>
    </div>
  );
}
