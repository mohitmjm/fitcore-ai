import { describe, expect, it } from 'vitest';
import { CompleteMomentumQuestSchema, MomentumQuerySchema } from './schemas';

describe('momentum request schemas', () => {
  it('accepts a valid timezone and server-shaped quest identifier', () => {
    expect(CompleteMomentumQuestSchema.parse({ timezone: 'Asia/Kolkata', questId: '2026-07-18:movement:walk-reset' }).questId).toContain('movement');
  });

  it('rejects invalid timezones and unexpected fields', () => {
    expect(() => MomentumQuerySchema.parse({ timezone: 'Mars/Olympus' })).toThrow();
    expect(() => MomentumQuerySchema.parse({ timezone: 'UTC', clerkUserId: 'someone-else' })).toThrow();
  });
});
