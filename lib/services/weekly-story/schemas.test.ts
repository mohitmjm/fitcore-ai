import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enforceRateLimit, resetRateLimitsForTests } from '@/lib/core/rate-limit';
import {
  DateKeySchema,
  StoryHistoryQuerySchema,
  StoryShareEventSchema,
  TimezoneSchema,
} from './schemas';

describe('weekly story API validation and rate limiting', () => {
  beforeEach(() => {
    resetRateLimitsForTests();
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects invalid calendar dates and timezones', () => {
    expect(DateKeySchema.safeParse('2026-02-31').success).toBe(false);
    expect(TimezoneSchema.safeParse('Not/A_Timezone').success).toBe(false);
    expect(TimezoneSchema.parse('Asia/Kolkata')).toBe('Asia/Kolkata');
  });

  it('caps archive pagination', () => {
    expect(StoryHistoryQuerySchema.safeParse({ limit: '21' }).success).toBe(false);
    expect(StoryHistoryQuerySchema.parse({ limit: '8' }).limit).toBe(8);
  });

  it('rejects sensitive or unknown share settings', () => {
    const result = StoryShareEventSchema.safeParse({
      snapshotId: '6ce4c36b-65f4-4e30-aa3a-e0504b9ed2af',
      action: 'share',
      configuration: {
        showFirstName: false, showConsistency: true, showWorkoutCount: true, showBadge: true,
        showComeback: true, showLevel: false, showBrandedLine: true, showWeight: true,
      },
    });
    expect(result.success).toBe(false);
  });

  it('returns a stable 429 error with retry metadata when regeneration is exhausted', async () => {
    await enforceRateLimit('user:regen', 2, 1000, 1000);
    await enforceRateLimit('user:regen', 2, 1000, 1100);
    await expect(enforceRateLimit('user:regen', 2, 1000, 1200)).rejects.toThrowError(/wait/i);
  });

  it('falls back to the local limiter when an Upstash pipeline command fails', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([
      { error: 'WRONGTYPE' },
      { result: 1 },
      { result: 60 },
    ]), { status: 200, headers: { 'content-type': 'application/json' } })));

    await enforceRateLimit('user:remote-error', 1, 1000, 1000);
    await expect(enforceRateLimit('user:remote-error', 1, 1000, 1100)).rejects.toThrowError(/wait/i);
  });
});
