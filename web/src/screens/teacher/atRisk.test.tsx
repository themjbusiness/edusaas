import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../lib/i18n';
import { ToastProvider } from '../../ui';
import TeacherAtRisk, { WeeklyDigest } from './TeacherAtRisk';

const wrap = (ui: React.ReactNode) =>
  render(
    <I18nProvider>
      <ToastProvider>{ui}</ToastProvider>
    </I18nProvider>
  );

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_DIGEST: WeeklyDigest = {
  weekStart: '2026-10-12',
  weekEnd: '2026-10-18',
  totalAbsences: 6,
  totalCleared: 4,
  atRiskStudents: [
    {
      studentId: 's1',
      name: 'Muhammad Ali',
      rollNumber: 'FA23-001',
      className: '11th Pre-Medical A',
      classId: 101,
      unclearedCount: 2,
      quizFailureCount: 1,
      isEscalated: false,
      parentPhoneMasked: '+92 3** ***0001',
      clearanceIds: [12, 14],
      lastParentContact: '2026-10-13T10:00:00Z',
    },
    {
      studentId: 's2',
      name: 'Hamza Khan',
      rollNumber: 'FA23-002',
      className: '11th Pre-Medical A',
      classId: 101,
      unclearedCount: 1,
      quizFailureCount: 3,
      isEscalated: true,
      parentPhoneMasked: '+92 3** ***0002',
      clearanceIds: [15],
      lastParentContact: null,
    },
  ],
};

describe('TeacherAtRisk Screen', () => {
  it('renders weekly at-risk digest, metrics, and student cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('teacher/weekly-digest')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_DIGEST), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });

    wrap(<TeacherAtRisk />);

    await waitFor(() => {
      expect(screen.getByText('Weekly At-Risk Digest')).toBeInTheDocument();
      expect(screen.getByText('Muhammad Ali')).toBeInTheDocument();
      expect(screen.getByText('Hamza Khan')).toBeInTheDocument();
      expect(screen.getByText('2 Uncleared Absences')).toBeInTheDocument();
      expect(screen.getByText('Locked Out (3 failed attempts)')).toBeInTheDocument();
    });
  });

  it('filters students when filter chips are clicked', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return Promise.resolve(new Response(JSON.stringify(MOCK_DIGEST), { status: 200 }));
    });

    wrap(<TeacherAtRisk />);

    await waitFor(() => {
      expect(screen.getByText('Muhammad Ali')).toBeInTheDocument();
      expect(screen.getByText('Hamza Khan')).toBeInTheDocument();
    });

    // Click Locked Out filter
    const lockedBtn = screen.getByRole('button', { name: /Locked Out/i });
    fireEvent.click(lockedBtn);

    await waitFor(() => {
      expect(screen.queryByText('Muhammad Ali')).not.toBeInTheDocument();
      expect(screen.getByText('Hamza Khan')).toBeInTheDocument();
    });
  });

  it('nudges parent and triggers alert API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('teacher/at-risk/s1/nudge')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, message: 'Alert sent' }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(MOCK_DIGEST), { status: 200 }));
    });

    wrap(<TeacherAtRisk />);

    await waitFor(() => {
      expect(screen.getByText('Muhammad Ali')).toBeInTheDocument();
    });

    const nudgeButtons = screen.getAllByRole('button', { name: /Nudge Parent/i });
    fireEvent.click(nudgeButtons[0]);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('teacher/at-risk/s1/nudge'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('opens override modal and submits clearance', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('teacher/clearances/12/override')) {
        return Promise.resolve(new Response(JSON.stringify({ id: 12, status: 'override' }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(MOCK_DIGEST), { status: 200 }));
    });

    wrap(<TeacherAtRisk />);

    await waitFor(() => {
      expect(screen.getByText('Muhammad Ali')).toBeInTheDocument();
    });

    const overrideButtons = screen.getAllByRole('button', { name: /Review & Override/i });
    fireEvent.click(overrideButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Manual Clearance Override')).toBeInTheDocument();
    });

    const grantBtn = screen.getByRole('button', { name: /Grant Clearance/i });
    fireEvent.click(grantBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('teacher/clearances/12/override'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
