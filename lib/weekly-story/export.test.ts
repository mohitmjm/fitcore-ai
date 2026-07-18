import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderStoryCardPng } from './export';

const hidden = {
  showFirstName: false,
  showConsistency: false,
  showWorkoutCount: false,
  showBadge: false,
  showComeback: false,
  showLevel: false,
  showBrandedLine: false,
};

function installCanvas() {
  const drawn: string[] = [];
  const gradient = { addColorStop: vi.fn() };
  const context = {
    beginPath: vi.fn(), roundRect: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
    fillRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    measureText: vi.fn((value: string) => ({ width: value.length * 18 })),
    fillText: vi.fn((value: string) => { drawn.push(String(value)); }),
    globalAlpha: 1, strokeStyle: '', lineWidth: 1, fillStyle: '', font: '',
    letterSpacing: '', textAlign: 'left',
  };
  const canvas = {
    width: 0, height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn((callback: (blob: Blob) => void) => callback(new Blob(['png'], { type: 'image/png' }))),
  };
  vi.stubGlobal('document', {
    fonts: { ready: Promise.resolve() },
    createElement: vi.fn(() => canvas),
  });
  return drawn;
}

const story = {
  shareConfiguration: hidden,
  storyFacts: {
    week: { label: 'Jul 6 – 12, 2026' },
    privacySafeFacts: {
      firstName: 'Mohit',
      dateRange: 'Jul 6 – 12, 2026',
      consistencyPct: 100,
      activeDays: 3,
      workoutCount: 2,
      level: 4,
      badge: 'First Rep',
      comeback: 'Returned after 5 quiet days',
    },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('weekly story export privacy', () => {
  it('redacts disabled fields from non-final cards', async () => {
    const drawn = installCanvas();
    const cover = {
      id: 'cover', type: 'cover', kicker: 'FitCore Weekly Story',
      title: 'Mohit, you kept your commitment.', body: 'A real week.',
      accent: 'lime', shareSafe: true, accessibilitySummary: 'summary',
      data: { firstName: 'Mohit', dateRange: 'Jul 6 – 12, 2026', consistencyPct: 100, level: 4, identity: 'Momentum Builder' },
    };

    await renderStoryCardPng(story as never, cover as never, hidden);
    const output = drawn.join(' | ');
    expect(output).not.toContain('Mohit');
    expect(output).not.toContain('Level 4');
    expect(output).not.toContain('100%');
    expect(output).toContain('3 active days');
  });

  it('refuses cards that are marked private', async () => {
    installCanvas();
    const privateCard = {
      id: 'coach', type: 'coach_insight', kicker: 'Coach',
      title: 'Private insight', body: 'Private pattern', accent: 'mint',
      shareSafe: false, accessibilitySummary: 'private',
      data: { supported: true, evidenceCount: 3 },
    };
    await expect(renderStoryCardPng(story as never, privateCard as never, hidden))
      .rejects.toThrow(/private/i);
  });
});
