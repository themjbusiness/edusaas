import { useEffect, useRef, useState } from 'react';
import { get, put, post, media, type ApiError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { go } from '../../lib/router';
import { ErrorCard, Sheet, Skeleton, useOnline, useToast } from '../../ui';

interface Section {
  page: number;
  text: string;
  start: number;
}

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface LessonDetail {
  id: string;
  title: string;
  topic: string;
  unitNumber: number;
  unitTitle: string;
  subject: string;
  subjectCode: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  duration: number;
  pages: number[];
  images: string[];
  imagesSm: string[];
  audio: string;
  sections: Section[];
  quiz: Question[];
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string;
}

export function ReviewLesson({ args }: { args: string[] }) {
  const lessonId = args[0];
  const { t } = useI18n();
  const toast = useToast();
  const online = useOnline();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Editable states
  const [sections, setSections] = useState<Section[]>([]);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'script' | 'quiz'>('script');

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [activePageIdx, setActivePageIdx] = useState(0);

  // Dialog & Saving state
  const [saving, setSaving] = useState(false);
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    if (lessonId) loadDetail(lessonId);
  }, [lessonId]);

  async function loadDetail(id: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await get<LessonDetail>(`review/lessons/${id}`);
      setLesson(data);
      setSections(data.sections || []);
      setQuiz(data.quiz || []);
      setNotes(data.reviewNotes || '');
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  // Audio handlers
  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  function seekRelative(delta: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(lesson?.duration || 0, audioRef.current.currentTime + delta));
  }

  function seekTo(sec: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = sec;
    setCurrentTime(sec);
    if (!playing) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  function changeSpeed() {
    const next = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function onTimeUpdate() {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    // Sync active section & textbook page
    if (sections.length > 0) {
      for (let i = sections.length - 1; i >= 0; i--) {
        if (time >= sections[i].start) {
          const pg = sections[i].page;
          const pIdx = lesson?.pages.indexOf(pg) ?? 0;
          if (pIdx >= 0 && pIdx !== activePageIdx) {
            setActivePageIdx(pIdx);
          }
          break;
        }
      }
    }
  }

  // Formatting helpers
  function fmtTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Edits persistence
  async function handleSaveDraft() {
    if (!lessonId) return;
    setSaving(true);
    try {
      const updated = await put<LessonDetail>(`review/lessons/${lessonId}`, {
        sections,
        quiz,
        review_notes: notes,
      });
      setLesson(updated);
      toast(t('Draft edits saved successfully.'));
    } catch (e) {
      toast(t('Failed to save draft: ') + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDecide(action: 'approve' | 'reject', decisionNotes: string) {
    if (!lessonId) return;
    setSaving(true);
    try {
      // First save any unsaved transcript/quiz edits
      await put<LessonDetail>(`review/lessons/${lessonId}`, {
        sections,
        quiz,
        review_notes: decisionNotes || notes,
      });

      const res = await post<{ status: string; reviewedBy: string; reviewNotes: string }>(
        `review/lessons/${lessonId}/decide`,
        { action, notes: decisionNotes || notes }
      );

      toast(action === 'approve' ? t('Lesson approved & published to students!') : t('Lesson rejected. Feedback saved.'));
      setLesson((prev) => (prev ? { ...prev, status: res.status as LessonDetail['status'], reviewedBy: res.reviewedBy, reviewNotes: res.reviewNotes } : null));
    } catch (e) {
      toast(t('Decision failed: ') + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // MCQ editing helpers
  function updateQuestionText(qIdx: number, val: string) {
    const updated = [...quiz];
    updated[qIdx] = { ...updated[qIdx], question: val };
    setQuiz(updated);
  }

  function updateOptionText(qIdx: number, optIdx: number, val: string) {
    const updated = [...quiz];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = val;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuiz(updated);
  }

  function setCorrectAnswer(qIdx: number, optIdx: number) {
    const updated = [...quiz];
    updated[qIdx] = { ...updated[qIdx], answer: optIdx };
    setQuiz(updated);
  }

  function removeQuestion(qIdx: number) {
    if (quiz.length <= 1) {
      toast(t('A lesson must have at least one quiz question.'));
      return;
    }
    const updated = quiz.filter((_, i) => i !== qIdx);
    setQuiz(updated);
  }

  function addQuestion() {
    setQuiz([
      ...quiz,
      {
        question: 'New question text...',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 0,
      },
    ]);
  }

  if (loading || !lesson) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <Skeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-8">
        <ErrorCard error={error} onRetry={() => loadDetail(lessonId)} />
      </div>
    );
  }

  const isApproved = lesson.status === 'approved';

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Top Header Bar */}
      <div className="bg-surface-container-lowest border-b border-outline-variant/60 sticky top-16 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => go('#/review')}
              className="w-9 h-9 rounded-xl border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              title={t('Back to review list')}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-primary uppercase tracking-wide">
                  {lesson.subject} • Unit {lesson.unitNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isApproved
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/30'
                      : lesson.status === 'in_review'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-500/30'
                      : lesson.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-500/30'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300/40'
                  }`}
                >
                  {lesson.status.toUpperCase()}
                </span>
              </div>
              <h1 className="font-headline-sm text-[18px] text-on-surface font-semibold truncate leading-tight">
                {lesson.topic} {lesson.title}
              </h1>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-[13px] font-medium hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{saving ? t('Saving...') : t('Save Draft')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        {!online && (
          <div className="flex gap-2.5 items-center p-3 rounded-xl mb-4 text-[14px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="material-symbols-outlined text-[20px]">wifi_off</span>
            <span>{t('Content review requires an internet connection. Draft changes are stored locally.')}</span>
          </div>
        )}

        {/* Sticky Audio Control Strip */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 mb-6 shadow-sm sticky top-[132px] z-20">
          <audio
            ref={audioRef}
            src={media(lesson.audio)}
            onTimeUpdate={onTimeUpdate}
            onEnded={() => setPlaying(false)}
            preload="metadata"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Play controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => seekRelative(-10)}
                className="w-10 h-10 rounded-full border border-outline-variant/60 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title={t('Rewind 10s')}
              >
                <span className="material-symbols-outlined text-[20px]">replay_10</span>
              </button>
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                title={playing ? t('Pause') : t('Play')}
              >
                <span className="material-symbols-outlined text-[26px]">
                  {playing ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button
                onClick={() => seekRelative(10)}
                className="w-10 h-10 rounded-full border border-outline-variant/60 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title={t('Forward 10s')}
              >
                <span className="material-symbols-outlined text-[20px]">forward_10</span>
              </button>

              <div className="text-[13px] font-mono font-medium text-on-surface ml-2">
                <span>{fmtTime(currentTime)}</span>
                <span className="text-on-surface-variant mx-1">/</span>
                <span className="text-on-surface-variant">{fmtTime(lesson.duration)}</span>
              </div>
            </div>

            {/* Scrub slider */}
            <div className="flex-1 max-w-[500px] flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={lesson.duration}
                step={0.5}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Speed toggle */}
            <button
              onClick={changeSpeed}
              className="px-3 py-1.5 rounded-lg border border-outline-variant text-[12px] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer self-start sm:self-auto"
            >
              {playbackRate}x
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: FBISE Textbook Page View (Desktop 5 cols, Mobile full width) */}
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sticky top-[240px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-label-lg text-label-lg font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                {t('Textbook Page')} {lesson.pages[activePageIdx]}
              </h2>

              {/* Page Selector Tabs */}
              {lesson.pages.length > 1 && (
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
                  {lesson.pages.map((pg, idx) => (
                    <button
                      key={pg}
                      onClick={() => setActivePageIdx(idx)}
                      className={`px-2.5 py-1 rounded text-[12px] font-semibold transition-colors cursor-pointer ${
                        activePageIdx === idx
                          ? 'bg-surface text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      p. {pg}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* High-res page render */}
            <div className="relative rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container aspect-[3/4] flex items-center justify-center">
              {lesson.images[activePageIdx] ? (
                <img
                  src={media(lesson.images[activePageIdx])}
                  alt={`FBISE Textbook page ${lesson.pages[activePageIdx]}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-4 text-on-surface-variant text-[13px]">
                  <span className="material-symbols-outlined text-[32px] block mb-1">image_not_supported</span>
                  {t('Page image unavailable')}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tabbed Transcript & Quiz MCQ Curators (Desktop 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Tab Selector */}
            <div className="flex items-center gap-2 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/60">
              <button
                onClick={() => setActiveTab('script')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'script'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">format_align_left</span>
                <span>{t('Transcript Sections')} ({sections.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'quiz'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                <span>{t('Quiz MCQs')} ({quiz.length})</span>
              </button>
            </div>

            {/* TAB 1: Script Sections Editor */}
            {activeTab === 'script' && (
              <div className="flex flex-col gap-4">
                <p className="text-[13px] text-on-surface-variant">
                  {t('Review the spoken narration transcript. Click "Play" next to any section to preview its audio timing. Edits will be updated in the lesson manifest.')}
                </p>

                {sections.map((section, idx) => {
                  const isCurrent =
                    currentTime >= section.start &&
                    (idx === sections.length - 1 || currentTime < sections[idx + 1].start);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-primary/5 border-primary/50 shadow-sm'
                          : 'bg-surface-container-lowest border-outline-variant/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-[12px] font-mono text-on-surface-variant">
                            {fmtTime(section.start)} • p. {section.page}
                          </span>
                        </div>

                        <button
                          onClick={() => seekTo(section.start)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                          <span>{t('Play')}</span>
                        </button>
                      </div>

                      <textarea
                        value={section.text}
                        rows={3}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx] = { ...updated[idx], text: e.target.value };
                          setSections(updated);
                        }}
                        className="w-full p-3 rounded-xl border border-outline-variant/60 bg-surface text-on-surface text-[14px] leading-relaxed resize-y focus:outline-none focus:border-primary"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: Quiz MCQs Editor */}
            {activeTab === 'quiz' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-on-surface-variant">
                    {t('Students must score &ge; 80% on this quiz to receive a Green Tick after missing class. Ensure questions directly test textbook concepts.')}
                  </p>
                  <button
                    onClick={addQuestion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-semibold text-[13px] hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>{t('Add Question')}</span>
                  </button>
                </div>

                {quiz.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-[14px] text-primary">
                        {t('Question')} {qIdx + 1}
                      </span>
                      <button
                        onClick={() => removeQuestion(qIdx)}
                        className="text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title={t('Delete question')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    {/* Question Prompt */}
                    <div className="mb-4">
                      <label className="block text-[12px] font-semibold text-on-surface-variant mb-1">
                        {t('Question Text')}
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 bg-surface text-on-surface text-[14px] font-medium"
                      />
                    </div>

                    {/* Options list */}
                    <div className="flex flex-col gap-2.5">
                      <label className="block text-[12px] font-semibold text-on-surface-variant">
                        {t('Options (Select radio for correct answer)')}
                      </label>
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.answer === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/50'
                                : 'bg-surface border-outline-variant/40'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={isCorrect}
                              onChange={() => setCorrectAnswer(qIdx, optIdx)}
                              className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                              title={t('Mark as correct answer')}
                            />
                            <span className="text-[12px] font-bold text-on-surface-variant w-4">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                              className="flex-1 bg-transparent text-[13px] text-on-surface focus:outline-none"
                            />
                            {isCorrect && (
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                {t('Correct')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Review Notes Box */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
              <label className="block font-bold text-[14px] text-on-surface mb-1">
                {t('Teacher Review Notes & Curation Log')}
              </label>
              <p className="text-[12px] text-on-surface-variant mb-3">
                {t('Record any textbook discrepancies, FBISE edition references, or adjustments made before approving.')}
              </p>
              <textarea
                value={notes}
                rows={3}
                placeholder={t('e.g., Verified against FBISE 2026 textbook edition. Corrected equation in Section 2.')}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/60 bg-surface text-on-surface text-[14px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Decision Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/60 py-3.5 px-4 sm:px-8 z-40 shadow-lg">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline-variant text-[20px]">info</span>
            <span className="text-[13px] text-on-surface-variant">
              {lesson.reviewedBy ? (
                <>
                  {t('Last reviewed by')}{' '}
                  <strong className="text-on-surface">{lesson.reviewedBy}</strong>
                </>
              ) : (
                t('Awaiting teacher approval before student release')
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRejectSheetOpen(true)}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold text-[13px] transition-colors cursor-pointer"
            >
              {t('Reject / Request Edits')}
            </button>

            <button
              onClick={() => handleDecide('approve', notes)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[14px] shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{saving ? t('Saving...') : t('Approve & Publish')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reject Reason Bottom Sheet */}
      {rejectSheetOpen && (
        <Sheet
          title={t('Reject Lesson & Provide Notes')}
          confirm={t('Confirm Rejection')}
          onClose={() => setRejectSheetOpen(false)}
          onConfirm={() => handleDecide('reject', rejectNotes || notes)}
        >
          <p className="text-[13px] text-on-surface-variant mb-3">
            {t('Specify why this lesson cannot be published yet (e.g., misaligned formula, wrong audio narration, or incorrect MCQ choices).')}
          </p>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={4}
            placeholder={t('Enter rejection reason or requested revisions...')}
            className="w-full p-3 rounded-xl border border-outline-variant/60 bg-surface text-on-surface text-[14px]"
          />
        </Sheet>
      )}
    </div>
  );
}
export default ReviewLesson;
