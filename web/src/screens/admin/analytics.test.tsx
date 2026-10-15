import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../lib/i18n';
import { ToastProvider } from '../../ui';
import { PrincipalAnalytics } from './PrincipalAnalytics';
import type { ClassBreakdownRow, PrincipalOverview, TeacherBreakdownRow } from '../../lib/api';

const wrap = (ui: React.ReactNode) =>
  render(
    <I18nProvider>
      <ToastProvider>{ui}</ToastProvider>
    </I18nProvider>
  );

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_OVERVIEW: PrincipalOverview = {
  totalAbsences: 25,
  clearedCount: 20,
  clearanceRate: 80.0,
  medianHoursToClear: 4.5,
  atRiskCount: 3,
  dailyTrend: [
    { date: '2026-10-12', absences: 5, clearances: 4 },
    { date: '2026-10-13', absences: 3, clearances: 3 },
  ],
  days: 30,
  college: 'Margalla Heights College',
};

const MOCK_CLASSES: ClassBreakdownRow[] = [
  {
    id: 'c1',
    name: '11th Pre-Medical A',
    grade: '11th',
    stream: 'Pre-Medical',
    section: 'A',
    teacherName: 'Mr. Tariq Mehmood',
    studentCount: 35,
    absences: 12,
    clearances: 10,
    rate: 83.3,
    medianHours: 3.5,
  },
];

const MOCK_TEACHERS: TeacherBreakdownRow[] = [
  {
    id: 't1',
    name: 'Mr. Tariq Mehmood',
    subject: 'Physics',
    absences: 12,
    clearances: 10,
    rate: 83.3,
    medianHours: 3.5,
  },
];

describe('PrincipalAnalytics Screen', () => {
  it('renders executive KPI cards and college title correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('principal/overview')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_OVERVIEW), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(MOCK_CLASSES), { status: 200 }));
    });

    wrap(<PrincipalAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Margalla Heights College')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('4.5h')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('11th Pre-Medical A')).toBeInTheDocument();
    });
  });

  it('switches breakdown between class and teacher', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('principal/overview')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_OVERVIEW), { status: 200 }));
      }
      if (u.includes('by=teacher')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_TEACHERS), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(MOCK_CLASSES), { status: 200 }));
    });

    wrap(<PrincipalAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('11th Pre-Medical A')).toBeInTheDocument();
    });

    const teacherBtn = screen.getByRole('button', { name: /By Teacher/i });
    fireEvent.click(teacherBtn);

    await waitFor(() => {
      expect(screen.getByText('Mr. Tariq Mehmood')).toBeInTheDocument();
      expect(screen.getByText('Physics')).toBeInTheDocument();
    });
  });
});
