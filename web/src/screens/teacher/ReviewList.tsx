import { useEffect, useState } from 'react';
import { get, type ApiError } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { go } from '../../lib/router';
import { ErrorCard, Skeleton, SubjectIcon, useOnline } from '../../ui';

export interface ReviewLessonItem {
  id: string;
  title: string;
  topic: string;
  unitNumber: number;
  unitTitle: string;
  subject: string;
  subjectCode: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  duration: number;
  sectionCount: number;
  questionCount: number;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string;
}

export function ReviewList() {
  const { t } = useI18n();
  const online = useOnline();
  const [lessons, setLessons] = useState<ReviewLessonItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    setLoading(true);
    setError(null);
    try {
      const data = await get<ReviewLessonItem[]>('review/lessons');
      setLessons(data);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  const subjects = Array.from(new Set(lessons?.map((l) => l.subjectCode) || []));

  const filtered = lessons?.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (selectedSubject !== 'all' && l.subjectCode !== selectedSubject) return false;
    return true;
  }) || [];

  const pendingCount = lessons?.filter((l) => l.status === 'in_review' || l.status === 'draft').length || 0;
  const approvedCount = lessons?.filter((l) => l.status === 'approved').length || 0;

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">rate_review</span>
            {t('Lesson Content Review')}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {t('Listen to AI narration, verify textbook excerpts, curate MCQs, and approve lessons before student release.')}
          </p>
        </div>
        <button
          onClick={loadLessons}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-[14px] font-medium cursor-pointer self-start sm:self-auto"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
          {t('Refresh')}
        </button>
      </div>

      {!online && (
        <div className="flex gap-2.5 items-center p-3 rounded-xl mb-4 text-[14px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span className="material-symbols-outlined text-[20px]">wifi_off</span>
          <span>{t('Content review requires an internet connection to stream textbook audio and sync edits.')}</span>
        </div>
      )}

      {error ? (
        <ErrorCard error={error} onRetry={loadLessons} />
      ) : loading && !lessons ? (
        <Skeleton rows={4} />
      ) : (
        <>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
              <span className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider block mb-1">
                {t('Pending Review')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-amber-600 dark:text-amber-400 font-bold">
                  {pendingCount}
                </span>
                <span className="text-on-surface-variant text-[13px]">{t('lessons')}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
              <span className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider block mb-1">
                {t('Approved & Live')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-emerald-600 dark:text-emerald-400 font-bold">
                  {approvedCount}
                </span>
                <span className="text-on-surface-variant text-[13px]">{t('lessons')}</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
              <span className="text-[12px] font-medium text-on-surface-variant uppercase tracking-wider block mb-1">
                {t('Total Assigned')}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-on-surface font-bold">
                  {lessons?.length || 0}
                </span>
                <span className="text-on-surface-variant text-[13px]">{t('lessons')}</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/60">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'in_review', label: 'In Review' },
                { id: 'draft', label: 'Draft' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-primary text-on-primary font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>

            {/* Subject Selector (if multiple) */}
            {subjects.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-on-surface-variant font-medium">{t('Subject:')}</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-[13px] cursor-pointer"
                >
                  <option value="all">{t('All Subjects')}</option>
                  {subjects.map((code) => (
                    <option key={code} value={code}>
                      {code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Lessons List */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/40">
              <span className="material-symbols-outlined text-outline-variant text-[48px] mb-2 block">
                fact_check
              </span>
              <p className="font-headline-sm text-headline-sm text-on-surface">{t('No lessons found')}</p>
              <p className="text-on-surface-variant text-[14px] mt-1 max-w-[420px] mx-auto">
                {t('No lessons match your current filter selection. Select another status or refresh.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((lesson) => {
                const isApproved = lesson.status === 'approved';
                const isInReview = lesson.status === 'in_review';
                const isRejected = lesson.status === 'rejected';

                let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300/40';
                let statusLabel = 'Draft';

                if (isApproved) {
                  badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-500/30';
                  statusLabel = 'Approved';
                } else if (isInReview) {
                  badgeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-500/30';
                  statusLabel = 'In Review';
                } else if (isRejected) {
                  badgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-500/30';
                  statusLabel = 'Rejected';
                }

                return (
                  <div
                    key={lesson.id}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Top Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <SubjectIcon code={lesson.subjectCode} sm />
                          </span>
                          <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
                            {lesson.subject}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Title & Topic */}
                      <h2 className="font-headline-sm text-[17px] text-on-surface font-semibold leading-snug">
                        <span className="text-primary font-bold mr-1.5">{lesson.topic}</span>
                        {lesson.title}
                      </h2>
                      <p className="text-[13px] text-on-surface-variant mt-1 line-clamp-1">
                        Unit {lesson.unitNumber}: {lesson.unitTitle}
                      </p>

                      {/* Content details pills */}
                      <div className="flex flex-wrap items-center gap-3 mt-4 text-[12px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-outline-variant">schedule</span>
                          {Math.ceil(lesson.duration / 60)} min
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-outline-variant">segment</span>
                          {lesson.sectionCount} {t('sections')}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-outline-variant">quiz</span>
                          {lesson.questionCount} {t('MCQs')}
                        </span>
                      </div>

                      {/* Review attribution if reviewed */}
                      {lesson.reviewedBy && (
                        <div className="mt-3 p-2.5 rounded-xl bg-surface-container/60 text-[12px] text-on-surface-variant border border-outline-variant/40">
                          <div className="flex items-center gap-1 font-medium text-on-surface">
                            <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
                            <span>{lesson.reviewedBy}</span>
                          </div>
                          {lesson.reviewNotes && (
                            <p className="mt-1 text-[11px] italic text-on-surface-variant line-clamp-2">
                              "{lesson.reviewNotes}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-[11px] text-on-surface-variant">
                        ID: <code className="font-mono text-[11px]">{lesson.id}</code>
                      </span>
                      <button
                        onClick={() => go(`#/reviewLesson/${lesson.id}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-[13px] hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                      >
                        <span>{isApproved ? t('View & Edit') : t('Review & Curate')}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default ReviewList;
