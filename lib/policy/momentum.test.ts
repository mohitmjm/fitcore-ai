import { describe, expect, it } from 'vitest';
import { buildMomentumExperience, type MomentumCompletionFact } from './momentum';

const completion = (date: string, kind: MomentumCompletionFact['kind'] = 'movement'): MomentumCompletionFact => ({
  date,
  questId: `${date}:${kind}:test`,
  kind,
  title: 'Test quest',
  durationMinutes: 8,
  xpReward: 12,
  completedAt: `${date}T10:00:00.000Z`,
});

describe('momentum quest policy', () => {
  it('offers exactly three deterministic quest lanes', () => {
    const input = { date: '2026-07-18', readiness: null, completions: [] };
    const first = buildMomentumExperience(input);
    expect(first).toEqual(buildMomentumExperience(input));
    expect(first.quests.map((quest) => quest.kind)).toEqual(['strength', 'movement', 'recovery']);
    expect(first.quests.filter((quest) => quest.recommended)).toHaveLength(1);
    expect(new Set(first.quests.map((quest) => quest.xpReward))).toEqual(new Set([12]));
  });

  it('recommends recovery when readiness is low without removing choice', () => {
    const result = buildMomentumExperience({ date: '2026-07-18', readiness: { band: 'recover', score: 28 }, completions: [] });
    expect(result.quests.find((quest) => quest.recommended)?.kind).toBe('recovery');
    expect(result.quests.find((quest) => quest.kind === 'strength')?.durationMinutes).toBe(4);
  });

  it('balances a push day away from recently repeated strength work', () => {
    const result = buildMomentumExperience({
      date: '2026-07-18',
      readiness: { band: 'push', score: 88 },
      completions: [completion('2026-07-17', 'strength')],
    });
    expect(result.quests.find((quest) => quest.recommended)?.kind).toBe('movement');
  });

  it('counts recovery quests as real momentum and computes streaks', () => {
    const completions = [
      completion('2026-07-14', 'strength'),
      completion('2026-07-15', 'recovery'),
      completion('2026-07-16', 'movement'),
      completion('2026-07-18', 'recovery'),
    ];
    const result = buildMomentumExperience({ date: '2026-07-18', readiness: null, completions });
    expect(result.streak.current).toBe(1);
    expect(result.streak.best).toBe(3);
    expect(result.streak.activeDaysLast7).toBe(4);
    expect(result.completedToday?.kind).toBe('recovery');
  });

  it('keeps social copy free of identity and private readiness data', () => {
    const result = buildMomentumExperience({ date: '2026-07-18', readiness: { band: 'recover', score: 20 }, completions: [completion('2026-07-18')] });
    expect(result.crewBoost?.text).toContain('One real action');
    expect(result.crewBoost?.text).not.toContain('20');
    expect(result.crewBoost?.text).not.toContain('recover');
  });
});
