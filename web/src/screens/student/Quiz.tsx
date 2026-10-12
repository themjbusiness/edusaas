import { useEffect, useState } from 'react';
import { ApiError, post, type QuizResult, type QuizStart } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { ErrorCard, Skeleton, useToast } from '../../ui';

export default function Quiz({ args }: { args: string[] }) {
  const { subj, err } = useI18n();
  const id = args[0] || '';
  const [quiz, setQuiz] = useState<QuizStart | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState(0);
  const toast = useToast();

  useEffect(() => {
    setQuiz(null); setError(null); setResult(null); setI(0); setAnswers([]);
    post<QuizStart>('lessons/' + encodeURIComponent(id) + '/quiz').then(setQuiz, setError);
  }, [id, n]);

  if (error) {
    if (error.status === 0) return (
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin-mobile">
        <a className="flex items-center gap-1 text-primary font-label-md text-[14px] mb-4" href={'#/lesson/' + id}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to lesson
        </a>
        <ErrorCard error={error} onRetry={() => setN((x) => x + 1)} />
      </main>
    );
    return (
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin-mobile">
        <a className="flex items-center gap-1 text-primary font-label-md text-[14px] mb-4" href={'#/lesson/' + id}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to lesson
        </a>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 my-2 flex flex-col items-center text-center shadow-sm">
          <span className="material-symbols-outlined text-[32px] text-secondary mb-2">{error.code === 'cooldown' ? 'schedule' : 'lock'}</span>
          <p className="font-headline-sm text-[18px] text-on-surface font-bold mb-4">{err(error)}</p>
          {error.code === 'cooldown' ? (
            <button className="h-12 px-6 bg-primary text-on-primary rounded-xl font-label-lg font-bold shadow-md active:bg-primary-container" onClick={() => setN((x) => x + 1)}>Try again</button>
          ) : (
            <a className="h-12 px-6 bg-primary text-on-primary rounded-xl flex items-center font-label-lg font-bold shadow-md active:bg-primary-container" href={'#/lesson/' + id}>Back to lesson</a>
          )}
        </div>
      </main>
    );
  }

  if (result) return <Result r={result} id={id} />;
  if (!quiz) return <main className="pt-16 px-margin-mobile"><Skeleton rows={6} /></main>;

  const it = quiz.questions[i];
  const last = i === quiz.questions.length - 1;
  const sel = answers[i];

  async function submit() {
    setBusy(true);
    try {
      const r = await post<QuizResult>('quiz/' + quiz!.attempt + '/submit', { answers });
      setResult(r); window.scrollTo(0, 0);
    } catch (e) { toast(err(e as ApiError)); setBusy(false); }
  }

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin-mobile min-h-screen">
      <div className="flex items-center justify-between gap-space-sm mb-4 mt-2">
        <a className="flex items-center gap-1 text-primary hover:text-primary-fixed-variant font-label-md text-[14px]" href={'#/lesson/' + id}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
        </a>
        <span className="font-label-sm text-[11px] text-on-surface-variant font-bold tracking-wider uppercase">
          {subj(quiz.lesson.subject)} · {quiz.lesson.topic}
        </span>
      </div>

      <div className="flex flex-col flex-1 w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between font-label-sm text-[12px] font-bold text-on-surface-variant mb-1">
          <span>Question {i + 1} of {quiz.questions.length}</span>
          <span className="text-secondary">{Math.round(((i + 1) / quiz.questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-6">
          <div className="bg-secondary h-full rounded-r-full transition-all duration-300" style={{ width: `${((i + 1) / quiz.questions.length) * 100}%` }}></div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-md p-6 flex flex-col gap-6 border border-outline-variant/30 flex-1">
          <h2 className="font-headline-sm text-[20px] leading-snug text-on-surface font-bold">
            {it.question}
          </h2>

          <div className="flex flex-col gap-3" role="radiogroup">
            {it.options.map((o, k) => (
              <button key={k} role="radio" aria-checked={sel === k} onClick={() => setAnswers(a => { const b = [...a]; b[i] = k; return b; })} className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${sel === k ? 'border-primary bg-primary-container/20 text-on-surface font-bold' : 'border-surface-container hover:border-outline-variant bg-surface-container-lowest text-on-surface'}`}>
                <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-label-md text-[14px] font-bold ${sel === k ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {String.fromCharCode(65 + k)}
                </span>
                <span className="font-body-lg text-[15px] pt-0.5">{o}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 mb-4">
          {i > 0 && (
            <button onClick={() => setI(i - 1)} className="h-12 px-6 rounded-xl bg-surface-container-low text-on-surface font-label-lg font-bold shadow-sm active:scale-95 transition-transform">
              Back
            </button>
          )}
          <button disabled={sel === undefined || busy} onClick={() => (last ? submit() : setI(i + 1))} className={`h-12 flex-1 rounded-xl font-label-lg font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${sel === undefined ? 'bg-surface-container text-outline cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary-container'}`}>
            {busy ? 'Checking…' : last ? 'Submit answers' : 'Next'}
            {!last && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            {last && !busy && <span className="material-symbols-outlined text-[18px]">done_all</span>}
          </button>
        </div>
        
        <p className="font-body-sm text-[12px] text-on-surface-variant text-center opacity-80 font-bold uppercase tracking-wider">
          You need {quiz.passMark} of {quiz.size} correct to pass.
        </p>
      </div>
    </main>
  );
}

function Result({ r, id }: { r: QuizResult; id: string }) {
  const percent = Math.round((r.score / r.size) * 100);
  
  if (r.passed) {
    return (
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface min-h-screen">
        <div className="flex flex-col w-full pb-12">
          
          <section className="relative overflow-hidden bg-gradient-to-b from-secondary-container/30 via-surface-container-low to-surface px-margin-mobile pt-8 pb-10 flex flex-col items-center text-center shadow-sm">
            <Confetti />
            <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/80 text-on-surface-variant font-label-sm text-[12px] mb-6 shadow-sm font-bold">
              <span className="material-symbols-outlined text-[16px] text-primary">school</span>
              <span>Quiz Complete</span>
            </div>
            
            <div className="relative z-10 w-20 h-20 rounded-full bg-secondary flex items-center justify-center shadow-md mb-6 transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 rounded-full bg-on-secondary/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary text-[42px]">check</span>
              </div>
            </div>
            
            <div className="relative z-10 flex items-baseline gap-1 mb-2">
              <span className="font-headline-lg-mobile text-[36px] text-primary font-bold tracking-tight">{r.score}/{r.size}</span>
              <span className="font-label-lg text-[16px] text-on-surface-variant uppercase tracking-wider font-bold">Marks</span>
            </div>
            
            <h2 className="relative z-10 font-headline-md text-[24px] text-on-surface font-bold tracking-tight mb-3">
              Great job, you passed!
            </h2>
            
            {r.cleared ? (
              <>
                <div className="relative z-10 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[14px] font-bold mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Cleared for class</span>
                </div>
                <div className="relative z-10 flex items-center justify-center gap-2 text-on-surface-variant font-body-sm text-[13px] font-bold max-w-xs mb-8">
                  <span className="material-symbols-outlined text-[20px] text-secondary">mark_chat_read</span>
                  <span>Your parent and your teacher have been told.</span>
                </div>
              </>
            ) : (
              <p className="relative z-10 text-on-surface-variant font-body-sm text-[14px] font-bold mb-8">Topic complete.</p>
            )}
            
            <div className="relative z-10 w-full max-w-sm">
              <a href="#/home" className="w-full h-12 bg-primary text-on-primary rounded-xl font-label-lg text-[16px] font-bold flex items-center justify-center gap-2 shadow-md active:bg-primary-container transition-all">
                <span>Back to home</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </a>
            </div>
          </section>

          <ReviewSection r={r} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface min-h-screen">
      <div className="flex flex-col w-full px-margin-mobile pb-12">
        
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden mt-4 border border-outline-variant/30">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-label-sm text-[12px] font-bold mb-6">
            <span className="material-symbols-outlined text-amber-700 text-[16px]">info</span>
            <span>Passing Threshold: {r.passMark}/{r.size}</span>
          </div>
          
          <div className="relative w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4 shadow-inner">
            <span className="material-symbols-outlined text-amber-700 text-[42px] transition-transform duration-500 hover:rotate-180">replay</span>
          </div>
          
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="font-headline-lg-mobile text-[36px] text-on-surface font-bold tracking-tight">{r.score}</span>
            <span className="text-on-surface-variant font-headline-sm text-[20px] font-bold">/ {r.size}</span>
          </div>
          
          <h2 className="font-headline-md text-[24px] text-on-surface font-bold mt-1">Almost there!</h2>
          
          <p className="font-body-md text-[14px] text-on-surface-variant max-w-xs mt-2 leading-relaxed">
            You need {r.passMark}/{r.size} to pass. Review the lesson, then try again in <span className="font-bold text-amber-800">{r.retryAfter}s</span>.
            {r.attempts >= 3 && <><br/><span className="text-primary font-bold">Tip: listen to the lesson once more.</span></>}
          </p>
          
          <div className="w-full max-w-xs bg-surface-container-high rounded-full h-2 mt-5 mb-2 overflow-hidden flex">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percent}%` }}></div>
          </div>
          
          <div className="w-full max-w-xs flex justify-between font-label-sm text-[11px] font-bold text-on-surface-variant mb-6 uppercase tracking-wider">
            <span>Current: {percent}%</span>
            <span className="text-amber-900">Required: {Math.round((r.passMark / r.size) * 100)}%</span>
          </div>
          
          <div className="w-full flex flex-col sm:flex-row gap-3">
            <a href={`#/quiz/${id}/again-${Date.now()}`} className="flex-1 h-12 bg-primary hover:bg-primary-container active:scale-[0.98] text-on-primary rounded-xl font-label-lg text-[15px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
              <span className="material-symbols-outlined text-[20px]">replay</span>
              <span>Try Again</span>
            </a>
            <a href={`#/lesson/${id}`} className="flex-1 h-12 bg-surface-container-low hover:bg-surface-container active:scale-[0.98] text-on-surface font-label-lg text-[15px] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
              <span>Review Lesson</span>
            </a>
          </div>
        </div>
        
        <div className="-mx-margin-mobile">
          <ReviewSection r={r} />
        </div>
      </div>
    </main>
  );
}

function ReviewSection({ r }: { r: QuizResult }) {
  const percent = Math.round((r.score / r.size) * 100);
  
  return (
    <section className="px-margin-mobile pt-8 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">fact_check</span>
          <h3 className="font-label-lg text-[16px] uppercase tracking-wider text-on-surface-variant font-bold">Review Your Answers</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${r.passed ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-on-surface'} font-label-sm text-[12px] font-bold shadow-sm whitespace-nowrap`}>
          <span className="material-symbols-outlined text-[16px]">{r.passed ? 'check_circle' : 'analytics'}</span>
          <span>{r.score}/{r.size} ({percent}%)</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {r.review.map((it, k) => (
          <article key={k} className="relative bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col pl-4 pr-4 py-4 border border-outline-variant/30">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${it.ok ? 'bg-secondary' : 'bg-amber-500'}`}></div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-bold uppercase tracking-wider">Question {k + 1} of {r.size}</span>
              {it.ok ? (
                <span className="inline-flex items-center gap-1 font-label-sm text-[12px] px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Correct
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-label-sm text-[12px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold shadow-sm">
                  <span className="material-symbols-outlined text-[14px]">cancel</span> Missed
                </span>
              )}
            </div>
            <h4 className="font-body-lg text-[15px] text-on-surface font-bold mb-3 leading-snug">
              {it.question}
            </h4>
            
            <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-1.5 mb-2 border border-outline-variant/30">
              {it.ok ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
                      <span className="font-body-md text-[14px] text-on-surface">You chose: <span className="font-bold text-primary">{it.options[it.correct]}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-6 pt-1 border-t border-surface-container">
                    <span className="font-body-sm text-[13px] text-secondary font-bold">Correct: {it.options[it.correct]}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block ml-1"></span>
                      <span className="font-body-md text-[14px] text-on-surface">You chose: <span className="font-bold text-amber-900">{it.chosen == null ? '(none)' : it.options[it.chosen]}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-6 pt-1 border-t border-surface-container">
                    <span className="font-body-sm text-[13px] text-secondary font-bold">Correct: <span className="flex items-center gap-1 inline-flex"><span className="material-symbols-outlined text-[16px]">check</span>{it.options[it.correct]}</span></span>
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-surface-container rounded-lg p-2.5 flex items-start gap-2 text-on-surface-variant font-body-sm text-[13px] font-medium">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">lightbulb</span>
              <span className="leading-relaxed">{it.explanation}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Confetti() {
  const [show, setShow] = useState(true);
  useEffect(() => { const id = window.setTimeout(() => setShow(false), 2400); return () => window.clearTimeout(id); }, []);
  if (!show) return null;
  const cols = ['#0f8f83', '#1e3a5f', '#f5b94a', '#4ade9b', '#7aa7e8'];
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => (
        <i key={i} className="absolute w-2 h-2 rounded-full" style={{ left: Math.random() * 100 + '%', top: Math.random() * -20 + '%', background: cols[i % 5], animation: `fall ${Math.random() * 2 + 1}s linear forwards`, animationDelay: Math.random() * 0.5 + 's' }} />
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
