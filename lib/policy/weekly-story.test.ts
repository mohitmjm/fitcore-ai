import { describe, expect, it } from 'vitest';
import { computeGamification } from './gamification';
import {
  buildWeeklyStory,
  type WeeklyStoryPolicyInput,
  type WeeklyStorySignal,
} from './weekly-story';

const WEEK_START = '2026-07-06';
const WEEK_END = '2026-07-12';

function signal(type: string, date: string, payload?: Record<string, unknown>): WeeklyStorySignal {
  return { type, occurredAt: `${date}T12:00:00Z`, activityDate: date, localHour: 18, localWeekday: new Date(`${date}T00:00:00Z`).getUTCDay(), payload };
}

function game(signals: WeeklyStorySignal[], today: string) {
  return computeGamification({
    signalTypes: signals.map((item) => item.type),
    activityDates: signals.map((item) => item.activityDate!),
    today,
    events: signals.map((item) => ({ type: item.type, occurredAt: item.occurredAt, payload: item.payload })),
  });
}

function input(overrides: Partial<WeeklyStoryPolicyInput> = {}): WeeklyStoryPolicyInput {
  const currentSignals = overrides.currentSignals ?? [];
  const previousSignals = overrides.previousSignals ?? [];
  const allSignalsThroughWeek = overrides.allSignalsThroughWeek ?? [...previousSignals, ...currentSignals];
  return {
    weekStart: WEEK_START,
    weekEnd: WEEK_END,
    timezone: 'UTC',
    firstName: 'Mohit',
    goal: 'general fitness',
    commitmentDays: 3,
    currentSignals,
    previousSignals,
    allSignalsThroughWeek,
    gamification: overrides.gamification ?? game(allSignalsThroughWeek, WEEK_END),
    previousGamification: overrides.previousGamification ?? game(previousSignals, '2026-07-05'),
    progressLogs: [],
    habitLogs: [],
    memory: null,
    planDays: 3,
    privacySettings: { includeProgressPhotos: false },
    ...overrides,
  };
}

describe('weekly story policy', () => {
  it('marks an empty week as ineligible without manufacturing a story fact', () => {
    const result = buildWeeklyStory(input());
    expect(result.eligible).toBe(false);
    expect(result.statistics.activeDays).toBe(0);
    expect(result.dataQuality).toContain('No activity signals were recorded in this week.');
  });

  it('frames one active day honestly and without shame', () => {
    const result = buildWeeklyStory(input({ currentSignals: [signal('checkin', '2026-07-08')] }));
    expect(result.eligible).toBe(true);
    expect(result.week.label).toBe('Jul 6 \u2013 Jul 12, 2026');
    expect(result.statistics.consistencyPct).toBe(33);
    expect(result.fallbackNarrative.coverHeadline).toContain('one promise stayed alive');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('you failed');
  });

  it('treats a completed personal commitment as fully consistent', () => {
    const currentSignals = ['2026-07-06', '2026-07-08', '2026-07-11'].map((date) => signal('workout_logged', date));
    const result = buildWeeklyStory(input({ currentSignals, allSignalsThroughWeek: currentSignals }));
    expect(result.statistics.activeDays).toBe(3);
    expect(result.statistics.consistencyPct).toBe(100);
    expect(result.standout?.kind).toBe('badge');
    expect(result.standout?.title).toBe('First Rep');
  });

  it('compares a better week with the previous commitment window', () => {
    const previousSignals = [signal('checkin', '2026-07-01')];
    const currentSignals = [signal('checkin', '2026-07-06'), signal('meal_logged', '2026-07-08'), signal('workout_logged', '2026-07-11')];
    const result = buildWeeklyStory(input({ currentSignals, previousSignals }));
    expect(result.statistics.changePct).toBe(67);
    expect(result.statistics.momentum).toBe('up');
  });

  it('uses continuing language for a lighter week', () => {
    const previousSignals = [signal('checkin', '2026-06-30'), signal('meal_logged', '2026-07-02'), signal('workout_logged', '2026-07-04')];
    const currentSignals = [signal('checkin', '2026-07-08')];
    const result = buildWeeklyStory(input({ currentSignals, previousSignals }));
    const consistency = result.cards.find((card) => card.type === 'consistency');
    expect(result.statistics.momentum).toBe('down');
    expect(consistency?.body).toContain('continuing');
  });

  it('detects a genuine comeback after at least four quiet days', () => {
    const previousSignals = [signal('meal_logged', '2026-06-30')];
    const currentSignals = [signal('workout_logged', '2026-07-06')];
    const result = buildWeeklyStory(input({ currentSignals, previousSignals }));
    expect(result.comeback).toMatchObject({ quietDays: 5, returnDate: '2026-07-06' });
    expect(result.nextFocus.title).toBe('Continue the comeback');
    expect(result.cards.filter((card) => card.type === 'comeback')).toHaveLength(1);
  });

  it('derives badge unlocks and level progress from the shared gamification policy', () => {
    const currentSignals = Array.from({ length: 6 }, (_, index) => signal('workout_logged', '2026-07-06', { exerciseName: `Movement ${index}` }));
    const result = buildWeeklyStory(input({ currentSignals, allSignalsThroughWeek: currentSignals }));
    expect(result.achievement.level).toBeGreaterThan(1);
    expect(result.achievement.badgesUnlocked.map((badge) => badge.id)).toContain('first_workout');
    expect(result.achievement.totalXp).toBe(game(currentSignals, WEEK_END).xp);
  });

  it('does not present missing or single progress points as a reliable trend', () => {
    const previousSignals = [signal('checkin', '2026-07-01')];
    expect(buildWeeklyStory(input({ currentSignals: [signal('checkin', '2026-07-08')], previousSignals })).progressTrend).toBeUndefined();
    const one = buildWeeklyStory(input({ currentSignals: [signal('checkin', '2026-07-08')], previousSignals, progressLogs: [{ recordedDate: '2026-07-08', weightKg: 80 }] }));
    expect(one.progressTrend).toBeUndefined();
    expect(one.dataQuality).toContain('A single progress entry is not presented as a trend.');
  });

  it('creates a range-based trend only from sufficiently separated progress points', () => {
    const result = buildWeeklyStory(input({
      currentSignals: [signal('weight_logged', '2026-07-08')],
      progressLogs: [
        { recordedDate: '2026-06-20', weightKg: 82 },
        { recordedDate: '2026-07-08', weightKg: 81.2 },
      ],
    }));
    expect(result.progressTrend).toMatchObject({ kind: 'weight', direction: 'down', private: true });
    expect(result.progressTrend?.summary).toContain('about 0.8 kg');
  });

  it('falls back explicitly when coach memory evidence is insufficient', () => {
    const result = buildWeeklyStory(input({ currentSignals: [signal('checkin', '2026-07-08')] }));
    expect(result.coachInsight.supported).toBe(false);
    expect(result.coachInsight.text).toContain('needs a little more repeated data');
  });

  it('only exposes privacy-safe facts to the share card', () => {
    const result = buildWeeklyStory(input({
      currentSignals: [signal('weight_logged', '2026-07-08', { weightKg: 81.2 })],
      progressLogs: [{ recordedDate: '2026-06-20', weightKg: 82 }, { recordedDate: '2026-07-08', weightKg: 81.2, waistInches: 33 }],
    }));
    const share = JSON.stringify(result.privacySafeFacts).toLowerCase();
    expect(share).not.toContain('weight');
    expect(share).not.toContain('waist');
    expect(share).not.toContain('81.2');
  });

  it('scores a verified personal record above other highlights', () => {
    const currentSignals = [signal('workout_logged', '2026-07-06', { personalRecord: true, label: 'Deadlift personal best' })];
    const result = buildWeeklyStory(input({ currentSignals, allSignalsThroughWeek: currentSignals }));
    expect(result.standout).toMatchObject({ kind: 'personal_record', title: 'Deadlift personal best' });
  });

  it('orders a balanced story with no duplicate card types and a safe share ending', () => {
    const currentSignals = [signal('workout_logged', '2026-07-06'), signal('meal_logged', '2026-07-08'), signal('sleep_logged', '2026-07-11')];
    const result = buildWeeklyStory(input({ currentSignals }));
    const types = result.cards.map((card) => card.type);
    expect(types[0]).toBe('cover');
    expect(types.at(-1)).toBe('share');
    expect(new Set(types).size).toBe(types.length);
    expect(result.cards.length).toBeGreaterThanOrEqual(7);
    expect(result.cards.length).toBeLessThanOrEqual(10);
  });

  it('produces byte-for-byte deterministic output for the same plain input', () => {
    const fixture = input({ currentSignals: [signal('workout_logged', '2026-07-06'), signal('meal_logged', '2026-07-08')] });
    expect(buildWeeklyStory(fixture)).toEqual(buildWeeklyStory(fixture));
  });

  it('includes progress photos only after explicit opt-in and sufficient separation', () => {
    const base = {
      currentSignals: [signal('checkin', '2026-07-08')],
      progressPhotos: [
        { url: 'https://images.example/before.jpg', takenAt: '2026-06-01T12:00:00Z' },
        { url: 'https://images.example/current.jpg', takenAt: '2026-07-08T12:00:00Z' },
      ],
    };
    expect(buildWeeklyStory(input(base)).cards.some((card) => card.type === 'progress_photo')).toBe(false);
    const optedIn = buildWeeklyStory(input({ ...base, privacySettings: { includeProgressPhotos: true } }));
    expect(optedIn.cards.find((card) => card.type === 'progress_photo')?.shareSafe).toBe(false);
  });
});
