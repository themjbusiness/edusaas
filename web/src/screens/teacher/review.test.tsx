import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../lib/i18n';
import { ToastProvider } from '../../ui';
import { ReviewList, type ReviewLessonItem } from './ReviewList';
import { ReviewLesson } from './ReviewLesson';

const wrap = (ui: React.ReactNode) =>
  render(
    <I18nProvider>
      <ToastProvider>{ui}</ToastProvider>
    </I18nProvider>
  );

afterEach(() => {
  vi.restoreAllMocks();
});

const MOCK_LESSONS: ReviewLessonItem[] = [
  {
    id: 'u1-estimation',
    title: 'Estimation and Orders of Magnitude',
    topic: '1.1',
    unitNumber: 1,
    unitTitle: 'Measurement',
    subject: 'Physics',
    subjectCode: 'phy11',
    status: 'draft',
    duration: 340,
    sectionCount: 4,
    questionCount: 5,
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: '',
  },
  {
    id: 'u1-dimensions',
    title: 'Dimensions of Physical Quantities',
    topic: '1.2',
    unitNumber: 1,
    unitTitle: 'Measurement',
    subject: 'Physics',
    subjectCode: 'phy11',
    status: 'approved',
    duration: 410,
    sectionCount: 5,
    questionCount: 6,
    reviewedBy: 'Mr. Tariq Mehmood',
    reviewedAt: '2026-10-14T06:00:00Z',
    reviewNotes: 'Verified with FBISE 2026 book.',
  },
];

describe('ReviewList Screen', () => {
  it('renders lesson cards and statistics correctly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(MOCK_LESSONS), { status: 200 })
    );

    wrap(<ReviewList />);

    // Header
    expect(screen.getByText('Lesson Content Review')).toBeInTheDocument();

    // Lessons displayed
    await waitFor(() => {
      expect(screen.getByText('Estimation and Orders of Magnitude')).toBeInTheDocument();
      expect(screen.getByText('Dimensions of Physical Quantities')).toBeInTheDocument();
    });

    // Counts
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('2')).toBeInTheDocument(); // total count
  });
});

describe('ReviewLesson Screen', () => {
  it('renders the editor with sections and quiz tabs', async () => {
    const detailPayload = {
      ...MOCK_LESSONS[0],
      pages: [8, 9],
      images: ['pages/p8.webp', 'pages/p9.webp'],
      imagesSm: ['pages/p8-sm.webp', 'pages/p9-sm.webp'],
      audio: 'lessons/u1-estimation/audio.mp3',
      sections: [{ page: 8, text: 'This is section one.', start: 0 }],
      quiz: [{ question: 'Unit of mass?', options: ['kg', 'm', 's', 'A'], answer: 0 }],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(detailPayload), { status: 200 })
    );

    wrap(<ReviewLesson args={['u1-estimation']} />);

    await waitFor(() => {
      expect(screen.getByText(/Estimation and Orders of Magnitude/)).toBeInTheDocument();
      expect(screen.getByText('This is section one.')).toBeInTheDocument();
      expect(screen.getByText('Approve & Publish')).toBeInTheDocument();
      expect(screen.getByText('Reject / Request Edits')).toBeInTheDocument();
    });
  });
});
