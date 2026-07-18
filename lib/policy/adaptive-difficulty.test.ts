import { describe, expect, it } from 'vitest';
import { adaptDifficulty } from './adaptive-difficulty';

describe('adaptDifficulty', () => {
  it('uses a conservative progression for an easy session', () => {
    expect(adaptDifficulty('too_easy').loadChangePct).toBe(2.5);
  });

  it('blocks progression and requires review when pain is reported', () => {
    const result = adaptDifficulty('pain');
    expect(result.allowProgression).toBe(false);
    expect(result.requiresSafetyReview).toBe(true);
  });
});
