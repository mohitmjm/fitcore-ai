import { describe, expect, it } from 'vitest';
import { GamificationService } from './gamification.service';

describe('GamificationService.summarizeSignals', () => {
  it('projects preloaded signals without requiring another persistence read', () => {
    const summary = GamificationService.summarizeSignals(
      [
        { type: 'workout_logged', occurredAt: new Date('2026-06-17T08:00:00Z') },
        { type: 'meal_logged', occurredAt: new Date('2026-06-17T12:00:00Z') },
      ],
      '2026-06-17',
    );

    expect(summary.xp).toBe(30);
    expect(summary.level).toBe(1);
    expect(summary.consistency.activeToday).toBe(true);
    expect(summary.badges.find((badge) => badge.id === 'first_workout')?.earned).toBe(true);
  });
});
