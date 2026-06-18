import { describe, it, expect } from 'vitest';
import { computeConsistency, computeTrend, momentumLevel } from './consistency';

const today = '2026-06-17';

function daysBefore(n: number): string {
  const ms = Date.parse(today + 'T00:00:00Z') - n * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

describe('computeConsistency', () => {
  it('returns zeros for no activity', () => {
    const s = computeConsistency([], today);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.activeToday).toBe(false);
    expect(s.weekPct).toBe(0);
  });

  it('counts a current streak ending today', () => {
    const dates = [daysBefore(0), daysBefore(1), daysBefore(2)];
    const s = computeConsistency(dates, today);
    expect(s.currentStreak).toBe(3);
    expect(s.activeToday).toBe(true);
  });

  it('keeps the streak alive with a one-day grace (active yesterday, not today)', () => {
    const dates = [daysBefore(1), daysBefore(2)];
    const s = computeConsistency(dates, today);
    expect(s.currentStreak).toBe(2);
    expect(s.activeToday).toBe(false);
  });

  it('breaks the streak after a 2-day gap', () => {
    const dates = [daysBefore(2), daysBefore(3)];
    const s = computeConsistency(dates, today);
    expect(s.currentStreak).toBe(0);
  });

  it('dedupes multiple activities on the same day', () => {
    const s = computeConsistency([daysBefore(0), daysBefore(0), daysBefore(0)], today);
    expect(s.currentStreak).toBe(1);
    expect(s.totalActiveDays).toBe(1);
  });

  it('computes longest streak independent of current', () => {
    const dates = [daysBefore(10), daysBefore(11), daysBefore(12), daysBefore(13), daysBefore(0)];
    const s = computeConsistency(dates, today);
    expect(s.longestStreak).toBe(4);
    expect(s.currentStreak).toBe(1);
  });

  it('computes 7/28 day windows and percentages', () => {
    const dates = [daysBefore(0), daysBefore(1), daysBefore(2), daysBefore(10)];
    const s = computeConsistency(dates, today);
    expect(s.last7).toBe(3);
    expect(s.last28).toBe(4);
    expect(s.weekPct).toBe(Math.round((3 / 7) * 100));
    expect(s.monthPct).toBe(Math.round((4 / 28) * 100));
  });
});

describe('computeTrend', () => {
  it('is up when recent week beats prior week', () => {
    const dates = [daysBefore(0), daysBefore(1), daysBefore(2), daysBefore(10)];
    expect(computeTrend(dates, today)).toBe('up');
  });
  it('is down when prior week beats recent', () => {
    const dates = [daysBefore(8), daysBefore(9), daysBefore(10)];
    expect(computeTrend(dates, today)).toBe('down');
  });
  it('is flat when equal', () => {
    const dates = [daysBefore(1), daysBefore(8)];
    expect(computeTrend(dates, today)).toBe('flat');
  });
});

describe('momentumLevel', () => {
  it('maps percentages to 1-5', () => {
    expect(momentumLevel(0)).toBe(1);
    expect(momentumLevel(25)).toBe(2);
    expect(momentumLevel(45)).toBe(3);
    expect(momentumLevel(65)).toBe(4);
    expect(momentumLevel(90)).toBe(5);
  });
});
