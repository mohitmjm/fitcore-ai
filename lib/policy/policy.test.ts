import { describe, it, expect } from 'vitest';
import { detectMode } from './mode';
import { decideTodayShape } from './today';
import { shouldTriggerComeback } from './comeback';
import { adjustWeeklyPlan } from './plan';
import type { CoachMemory } from '@/lib/services/memory/types';
import type { WorkoutPlanDoc } from '@/lib/services/plan/types';

const baseMemory: CoachMemory = {
  clerkUserId: 'u1',
  schemaVersion: 1,
  derived: { consistencyTrend: 'up' },
};

const examMemory: CoachMemory = {
  ...baseMemory,
  context: { lifeContext: { academicEvents: [{ type: 'exam', from: '2026-06-15', to: '2026-06-20' }] } },
};

const plan: WorkoutPlanDoc = {
  clerkUserId: 'u1',
  weekOf: '2026-06-14',
  mode: 'normal',
  generatedBy: 'ai',
  version: 1,
  days: [
    {
      day: 'Day 1',
      focus: 'Upper',
      exercises: [
        { name: 'Bench Press', sets: 3, reps: '8-12', restSeconds: 90, muscleGroup: 'Chest', tip: '' },
        { name: 'Row', sets: 3, reps: '8-12', restSeconds: 90, muscleGroup: 'Back', tip: '' },
        { name: 'Overhead Press', sets: 3, reps: '8-12', restSeconds: 90, muscleGroup: 'Shoulders', tip: '' },
        { name: 'Curl', sets: 3, reps: 10, restSeconds: 60, muscleGroup: 'Biceps', tip: '' },
      ],
    },
  ],
};

const date = '2026-06-17';

describe('detectMode', () => {
  it('detects exam mode when an academic event covers today', () => {
    expect(detectMode(examMemory, { date, daysSinceLastActivity: 0 })).toBe('exam');
  });
  it('detects busy mode when available time is short', () => {
    expect(detectMode(baseMemory, { date, daysSinceLastActivity: 0, checkin: { timeMinutes: 10 } })).toBe('busy');
  });
  it('detects comeback after a 4+ day lapse', () => {
    expect(detectMode(baseMemory, { date, daysSinceLastActivity: 5 })).toBe('comeback');
  });
  it('detects deload on low energy', () => {
    expect(detectMode(baseMemory, { date, daysSinceLastActivity: 0, checkin: { energy: 2 } })).toBe('deload');
  });
  it('defaults to normal', () => {
    expect(detectMode(baseMemory, { date, daysSinceLastActivity: 1 })).toBe('normal');
  });
});

describe('decideTodayShape', () => {
  it('caps exam-mode to 10 minutes and trims exercises', () => {
    const card = decideTodayShape(examMemory, plan, { date, daysSinceLastActivity: 0 });
    expect(card.mode).toBe('exam');
    expect(card.primaryAction.durationMin).toBe(10);
    expect(card.primaryAction.exercises.length).toBeLessThanOrEqual(3);
  });
  it('uses the comeback action after a lapse', () => {
    const card = decideTodayShape(baseMemory, plan, { date, daysSinceLastActivity: 6 });
    expect(card.mode).toBe('comeback');
    expect(card.primaryAction.kind).toBe('comeback');
  });
  it('gives the full session on a normal day', () => {
    const card = decideTodayShape(baseMemory, plan, { date, daysSinceLastActivity: 1 });
    expect(card.mode).toBe('normal');
    expect(card.primaryAction.exercises.length).toBe(4);
  });
});

describe('shouldTriggerComeback', () => {
  it('triggers at 4+ days', () => {
    expect(shouldTriggerComeback(4).trigger).toBe(true);
  });
  it('does not trigger under 4 days', () => {
    expect(shouldTriggerComeback(2).trigger).toBe(false);
  });
});

describe('adjustWeeklyPlan', () => {
  it('adds reps when trending up and bumps version', () => {
    const adjusted = adjustWeeklyPlan(plan, 'up');
    expect(adjusted.days[0].exercises[0].reps).toBe('10-14');
    expect(adjusted.days[0].exercises[3].reps).toBe(12);
    expect(adjusted.version).toBe(2);
    expect(adjusted.generatedBy).toBe('adjusted');
  });
  it('reduces reps when trending down', () => {
    const adjusted = adjustWeeklyPlan(plan, 'down');
    expect(adjusted.days[0].exercises[0].reps).toBe('6-10');
  });
  it('keeps reps when flat', () => {
    const adjusted = adjustWeeklyPlan(plan, 'flat');
    expect(adjusted.days[0].exercises[0].reps).toBe('8-12');
  });
});
