import { describe, expect, it } from 'vitest';
import { computeGamification } from '@/lib/policy/gamification';
import { buildWeeklyStory, type WeeklyStorySignal } from '@/lib/policy/weekly-story';
import { enhanceWeeklyStoryNarrative } from './narrative';

const storySignal: WeeklyStorySignal = { type: 'checkin', occurredAt: '2026-07-08T12:00:00Z', activityDate: '2026-07-08' };
const game = computeGamification({ signalTypes: ['checkin'], activityDates: ['2026-07-08'], today: '2026-07-12', events: [{ type: 'checkin', occurredAt: storySignal.occurredAt }] });
const emptyGame = computeGamification({ signalTypes: [], activityDates: [], today: '2026-07-05', events: [] });
const facts = buildWeeklyStory({
  weekStart: '2026-07-06', weekEnd: '2026-07-12', timezone: 'UTC', firstName: 'Mohit', commitmentDays: 3,
  currentSignals: [storySignal], previousSignals: [], allSignalsThroughWeek: [storySignal], gamification: game,
  previousGamification: emptyGame, progressLogs: [], habitLogs: [], memory: null, privacySettings: { includeProgressPhotos: false },
});

describe('weekly story narrative enhancement', () => {
  it('accepts a valid bounded narrative', async () => {
    const generate = async () => JSON.stringify(facts.fallbackNarrative);
    const result = await enhanceWeeklyStoryNarrative(facts, generate, 'openai');
    expect(result.mode).toBe('ai');
    expect(result.narrative).toEqual(facts.fallbackNarrative);
  });

  it('falls back on invalid JSON or schema failure', async () => {
    const result = await enhanceWeeklyStoryNarrative(facts, async () => 'not json', 'openai');
    expect(result.mode).toBe('deterministic');
    expect(result.narrative).toEqual(facts.fallbackNarrative);
  });

  it('falls back when the provider throws or times out', async () => {
    const result = await enhanceWeeklyStoryNarrative(facts, async () => { throw new Error('timeout'); }, 'claude');
    expect(result.mode).toBe('deterministic');
  });

  it('rejects unsupported numeric and transformation claims', async () => {
    const unsafe = { ...facts.fallbackNarrative, weekSummary: 'You are guaranteed to lose 10 kg.' };
    const result = await enhanceWeeklyStoryNarrative(facts, async () => JSON.stringify(unsafe), 'gemini');
    expect(result.mode).toBe('deterministic');
    expect(result.narrative.weekSummary).not.toContain('10 kg');
  });

  it('does not call an external generator when the mock provider is active', async () => {
    let called = false;
    const result = await enhanceWeeklyStoryNarrative(facts, async () => { called = true; return '{}'; }, 'mock');
    expect(called).toBe(false);
    expect(result.mode).toBe('deterministic');
  });
});
