import { useState, useMemo } from 'react';
import { get, post } from '../../lib/api';
import { useLoad } from '../../lib/useLoad';
import { useToast, Skeleton, ErrorCard } from '../../ui';

export interface AtRiskStudent {
  studentId: string;
  name: string;
  rollNumber: string;
  className: string;
  classId: number;
  unclearedCount: number;
  quizFailureCount: number;
  isEscalated: boolean;
  parentPhoneMasked: string;
  clearanceIds: number[];
  lastParentContact: string | null;
}

export interface WeeklyDigest {
  weekStart: string;
  weekEnd: string;
  totalAbsences: number;
  totalCleared: number;
  atRiskStudents: AtRiskStudent[];
}

export default function TeacherAtRisk() {
  const toast = useToast();
  const { data: digest, error, reload } = useLoad(() => get<WeeklyDigest>('teacher/weekly-digest'));
  
  const [filter, setFilter] = useState<'all' | 'absences' | 'quizzes' | 'locked'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [nudging, setNudging] = useState<Record<string, boolean>>({});
  
  // Override Modal state
  const [overrideStudent, setOverrideStudent] = useState<AtRiskStudent | null>(null);
  const [overrideReason, setOverrideReason] = useState('Oral viva conducted & demonstrated 80%+ mastery');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overriding, setOverriding] = useState(false);

  const students = digest?.atRiskStudents || [];

  const uniqueClasses = useMemo(() => {
    const map = new Map<number, string>();
    students.forEach((s) => map.set(s.classId, s.className));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [students]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (classFilter !== 'all' && String(s.classId) !== classFilter) return false;
      if (filter === 'absences') return s.unclearedCount >= 2;
      if (filter === 'quizzes') return s.quizFailureCount >= 3 || s.isEscalated;
      if (filter === 'locked') return s.isEscalated;
      return true;
    });
  }, [students, classFilter, filter]);

  if (error) return <ErrorCard error={error} onRetry={reload} />;
  if (!digest) return <Skeleton rows={4} />;

  async function handleNudge(student: AtRiskStudent, channel: 'push' | 'whatsapp' = 'push') {
    setNudging((prev) => ({ ...prev, [student.studentId]: true }));
    try {
      await post(`teacher/at-risk/${student.studentId}/nudge`, { channel });
      toast(`Alert sent to ${student.name}'s parent via ${channel === 'whatsapp' ? 'WhatsApp' : 'Push Notification'}.`);
      reload();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setNudging((prev) => ({ ...prev, [student.studentId]: false }));
    }
  }

  async function handleNudgeAll() {
    const targets = filtered.filter((s) => !nudging[s.studentId]);
    if (!targets.length) return;
    toast(`Sending alerts to ${targets.length} parents...`);
    let sent = 0;
    for (const s of targets) {
      try {
        await post(`teacher/at-risk/${s.studentId}/nudge`, { channel: 'push' });
        sent++;
      } catch {
        /* continue */
      }
    }
    toast(`Successfully alerted ${sent} parents.`);
    reload();
  }

  async function handleGrantOverride() {
    if (!overrideStudent || !overrideStudent.clearanceIds.length) return;
    setOverriding(true);
    const clearanceId = overrideStudent.clearanceIds[0];
    const fullReason = overrideNotes.trim() ? `${overrideReason}: ${overrideNotes.trim()}` : overrideReason;
    try {
      await post(`teacher/clearances/${clearanceId}/override`, { reason: fullReason });
      toast(`Clearance override granted for ${overrideStudent.name}. Parent notified.`);
      setOverrideStudent(null);
      setOverrideNotes('');
      reload();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setOverriding(false);
    }
  }

  const chronicCount = students.filter((s) => s.unclearedCount >= 2).length;
  const lockedCount = students.filter((s) => s.isEscalated).length;

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin-mobile min-h-screen">
      <div className="flex flex-col w-full max-w-5xl mx-auto pb-12">
        
        {/* Header Breadcrumb / Meta */}
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center justify-between text-on-surface-variant text-[13px]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-primary">warning</span>
              At-Risk Catch-Up & Intervention
            </span>
            <span className="bg-surface-container-high px-2.5 py-0.5 rounded-full font-semibold text-[12px] text-primary">
              Week: {digest.weekStart} to {digest.weekEnd}
            </span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
            <h1 className="font-headline-lg-mobile text-[24px] text-primary font-bold tracking-tight">
              Weekly At-Risk Digest
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNudgeAll}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold shadow-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                Nudge All Filtered ({filtered.length})
              </button>
            </div>
          </div>
        </div>

        {/* 3 Executive Metric Tiles */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-5">
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-on-surface-variant">Total Flagged</span>
              <span className="w-6 h-6 rounded-full bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">priority_high</span>
              </span>
            </div>
            <span className="text-[26px] font-bold text-error leading-tight">{students.length}</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">Requiring intervention</span>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-on-surface-variant">Chronic Absences</span>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">event_busy</span>
              </span>
            </div>
            <span className="text-[26px] font-bold text-amber-700 dark:text-amber-400 leading-tight">{chronicCount}</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">≥ 2 uncleared classes</span>
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-on-surface-variant">Locked Quizzes</span>
              <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">lock_clock</span>
              </span>
            </div>
            <span className="text-[26px] font-bold text-rose-700 dark:text-rose-400 leading-tight">{lockedCount}</span>
            <span className="text-[11px] text-on-surface-variant mt-0.5">3 failed attempts (80% gate)</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-surface-container-low p-2.5 rounded-2xl border border-outline-variant/30">
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-label-md text-[13px] font-semibold whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All At-Risk ({students.length})
            </button>
            <button
              onClick={() => setFilter('absences')}
              className={`px-3 py-1.5 rounded-xl font-label-md text-[13px] font-semibold whitespace-nowrap transition-colors ${
                filter === 'absences'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Absences ≥2 ({chronicCount})
            </button>
            <button
              onClick={() => setFilter('quizzes')}
              className={`px-3 py-1.5 rounded-xl font-label-md text-[13px] font-semibold whitespace-nowrap transition-colors ${
                filter === 'quizzes'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Quiz Fails ({students.filter((s) => s.quizFailureCount >= 3).length})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-3 py-1.5 rounded-xl font-label-md text-[13px] font-semibold whitespace-nowrap transition-colors ${
                filter === 'locked'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Locked Out ({lockedCount})
            </button>
          </div>

          {/* Class Selector Dropdown */}
          {uniqueClasses.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-semibold text-on-surface-variant">Class:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-surface-container-lowest text-on-surface text-[13px] font-medium py-1.5 px-3 rounded-xl border border-outline-variant focus:outline-none"
              >
                <option value="all">All Assigned Classes</option>
                {uniqueClasses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Student List / Empty State */}
        {filtered.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center my-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <h3 className="font-headline-sm text-[18px] font-bold text-primary mb-1">
              No Students At Risk
            </h3>
            <p className="font-body-md text-[14px] text-on-surface-variant max-w-md">
              All students in the selected view have either cleared their missed lectures or remain under the intervention thresholds.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((s) => (
              <div
                key={s.studentId}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-3.5"
              >
                {/* Student Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-[16px] shrink-0 border border-primary/20">
                    {s.name.slice(0, 1)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[15px] text-on-surface">{s.name}</span>
                      <span className="text-[12px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                        Roll: {s.rollNumber}
                      </span>
                      <span className="text-[12px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                        {s.className}
                      </span>
                    </div>

                    {/* Risk Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {s.unclearedCount >= 2 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          <span className="material-symbols-outlined text-[13px]">event_busy</span>
                          {s.unclearedCount} Uncleared Absences
                        </span>
                      ) : s.unclearedCount === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                          1 Uncleared Absence
                        </span>
                      ) : null}

                      {s.isEscalated ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          Locked Out (3 failed attempts)
                        </span>
                      ) : s.quizFailureCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          Failed Quizzes: {s.quizFailureCount}x
                        </span>
                      ) : null}

                      {s.parentPhoneMasked && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant">
                          <span className="material-symbols-outlined text-[13px]">call</span>
                          Parent: {s.parentPhoneMasked}
                        </span>
                      )}
                    </div>

                    {s.lastParentContact && (
                      <span className="text-[11px] text-on-surface-variant mt-1">
                        Last alerted: {new Date(s.lastParentContact).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleNudge(s, 'push')}
                    disabled={nudging[s.studentId]}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high text-primary hover:bg-surface-variant font-label-md text-[13px] font-bold transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                    <span>{nudging[s.studentId] ? 'Alerting…' : 'Nudge Parent'}</span>
                  </button>

                  {s.clearanceIds.length > 0 && (
                    <button
                      onClick={() => setOverrideStudent(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary font-label-md text-[13px] font-bold shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Review & Override</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Override Modal */}
      {overrideStudent && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-3 border border-outline-variant/60">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
              <h3 className="font-headline-sm text-[18px] font-bold">Manual Clearance Override</h3>
            </div>
            <p className="font-body-md text-[14px] text-on-surface-variant">
              Manually grant clearance to <b>{overrideStudent.name}</b> ({overrideStudent.className}) to restore class entry and update LMS progress.
            </p>

            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-2.5">
              <label className="font-label-sm text-[12px] font-bold text-on-surface-variant">
                Authorized Override Reason
              </label>
              <select
                className="w-full bg-surface-container-lowest font-body-sm text-[14px] p-2.5 rounded-lg text-on-surface focus:outline-none border border-outline-variant"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              >
                <option value="Oral viva conducted & demonstrated 80%+ mastery">
                  Oral viva conducted & demonstrated 80%+ mastery
                </option>
                <option value="Medical certificate provided">Medical certificate provided</option>
                <option value="Attended office hours & completed catch-up">
                  Attended office hours & completed catch-up
                </option>
                <option value="On official college duty">On official college duty</option>
                <option value="Covered the topic with the teacher in person">
                  Covered the topic with the teacher in person
                </option>
                <option value="Extenuating circumstances verified">Extenuating circumstances verified</option>
              </select>

              <label className="font-label-sm text-[12px] font-bold text-on-surface-variant mt-1">
                Teacher Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                placeholder="Optional notes or context for audit trail..."
                className="w-full bg-surface-container-lowest font-body-sm text-[13px] p-2.5 rounded-lg text-on-surface focus:outline-none border border-outline-variant resize-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                disabled={overriding}
                onClick={() => setOverrideStudent(null)}
                className="flex-1 min-h-[42px] rounded-xl bg-surface-container-high text-primary font-label-md text-[14px] font-bold hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={overriding || !overrideReason}
                onClick={handleGrantOverride}
                className="flex-1 min-h-[42px] rounded-xl bg-primary text-on-primary font-label-md text-[14px] font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {overriding ? 'Granting…' : 'Grant Clearance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
