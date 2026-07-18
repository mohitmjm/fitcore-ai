import { describe, it, expect } from 'vitest';
import { computeGamification, levelForXp, xpForSignals, levelTitle, validatedXpForEvents } from './gamification';

const today = '2026-06-17';

describe('xpForSignals', () => {
  it('sums XP by signal type and ignores unknowns', () => {
    expect(xpForSignals(['workout_logged', 'meal_logged', 'unknown_type'])).toBe(30);
  });
  it('is zero for no signals', () => {
    expect(xpForSignals([])).toBe(0);
  });
});

describe('levelForXp', () => {
  it('level 1 at 0 xp', () => {
    expect(levelForXp(0).level).toBe(1);
  });
  it('level 2 at 100 xp, level 3 at 300 xp', () => {
    expect(levelForXp(100).level).toBe(2);
    expect(levelForXp(299).level).toBe(2);
    expect(levelForXp(300).level).toBe(3);
  });
  it('reports progress within a level', () => {
    const r = levelForXp(150); // level 2 base 100, next 300
    expect(r.level).toBe(2);
    expect(r.xpIntoLevel).toBe(50);
    expect(r.xpForNextLevel).toBe(200);
    expect(r.progressPct).toBe(25);
  });
});

describe('levelTitle', () => {
  it('maps levels to the Fitcore progression tiers', () => {
    expect(levelTitle(1)).toBe('Foundation');
    expect(levelTitle(11)).toBe('Challenger');
    expect(levelTitle(99)).toBe('Master');
    expect(levelTitle(100)).toBe('Fitcore Legend');
  });
});

describe('validatedXpForEvents', () => {
  it('deduplicates repeated logs and caps high-frequency XP events', () => {
    const repeated = Array.from({ length: 10 }, (_, index) => ({
      type: 'workout_logged',
      occurredAt: `2026-06-17T10:${String(index).padStart(2, '0')}:00Z`,
      payload: { exerciseName: index < 2 ? 'Push-up' : `Exercise ${index}` },
    }));
    expect(validatedXpForEvents(repeated)).toBe(120);
  });

  it('awards at most one Momentum Quest per day', () => {
    expect(validatedXpForEvents([
      { type: 'quest_completed', occurredAt: '2026-06-17T08:00:00Z', payload: { date: today, questId: 'one' } },
      { type: 'quest_completed', occurredAt: '2026-06-17T09:00:00Z', payload: { date: today, questId: 'two' } },
    ])).toBe(12);
  });
});

describe('computeGamification', () => {
  it('awards XP, level and the first-workout badge', () => {
    const g = computeGamification({
      signalTypes: ['workout_logged', 'meal_logged', 'water_logged'],
      activityDates: [today],
      today,
    });
    expect(g.xp).toBe(34);
    expect(g.level).toBe(1);
    expect(g.badges.find((b) => b.id === 'first_workout')?.earned).toBe(true);
    expect(g.badges.find((b) => b.id === 'streak_7')?.earned).toBe(false);
  });
});
