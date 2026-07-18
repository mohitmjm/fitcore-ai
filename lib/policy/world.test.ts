import { describe, expect, it } from 'vitest';
import { buildFitnessWorld } from './world';

const now = new Date('2026-07-17T12:00:00Z');

describe('buildFitnessWorld', () => {
  it('connects completed habits and verified activity to missions and boss damage', () => {
    const state = buildFitnessWorld({
      now,
      signals: [
        { type: 'workout_logged', occurredAt: '2026-07-17T08:00:00Z', payload: { exerciseName: 'Push-up' } },
        { type: 'habit_logged', occurredAt: '2026-07-16T08:00:00Z', payload: { habit: 'stretch' } },
        { type: 'water_logged', occurredAt: '2026-07-15T08:00:00Z', payload: { habit: 'water' } },
      ],
      habits: [
        { habit: 'water', value: 8, goal: 8, unit: 'glasses', done: true },
        { habit: 'stretch', value: 10, goal: 10, unit: 'min', done: true },
        { habit: 'steps', value: 4000, goal: 8000, unit: 'steps', done: false },
      ],
      plannedExerciseCount: 1,
      weeklyCommitmentDays: 3,
    });

    expect(state.dailyMissions.find((item) => item.id === 'daily_training')?.completed).toBe(true);
    expect(state.dailyMissions.find((item) => item.id === 'daily_water')?.completed).toBe(true);
    expect(state.boss.damage).toBe(3);
  });

  it('never creates an unsafe hard-workout requirement on a recovery day', () => {
    const state = buildFitnessWorld({
      now,
      signals: [],
      habits: [],
      readiness: { score: 28, band: 'recover', title: 'Recover', message: 'Keep it gentle.' },
      plannedExerciseCount: 6,
    });
    expect(state.dailyMissions[0].target).toBe(1);
    expect(state.coachMessage).toContain('Recovery');
  });
});
