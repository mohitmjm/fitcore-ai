import { describe, expect, it } from 'vitest';
import { calculateReadiness } from './readiness';

const date = '2026-07-17';

describe('calculateReadiness', () => {
  it('suggests a push day for strong recovery signals', () => {
    const readiness = calculateReadiness(date, { energy: 5, sleepHours: 8, soreness: 1, stress: 1, timeMinutes: 60 });
    expect(readiness.band).toBe('push');
    expect(readiness.score).toBeGreaterThan(75);
  });

  it('suggests a recovery day for depleted signals', () => {
    const readiness = calculateReadiness(date, { energy: 1, sleepHours: 3, soreness: 5, stress: 5, timeMinutes: 15 });
    expect(readiness.band).toBe('recover');
    expect(readiness.score).toBeLessThanOrEqual(35);
  });

  it('always prioritizes recovery when a member says they are sick', () => {
    const readiness = calculateReadiness(date, { energy: 5, sleepHours: 9, soreness: 1, stress: 1, timeMinutes: 60, sick: true });
    expect(readiness.band).toBe('recover');
  });
});
