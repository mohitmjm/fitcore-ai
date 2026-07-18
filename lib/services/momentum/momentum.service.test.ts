import { describe, expect, it } from 'vitest';
import type { AuthContext } from '@/lib/core/context';
import { GamificationService } from '@/lib/services/gamification/gamification.service';
import { MomentumService } from './momentum.service';

const context = (id: string): AuthContext => ({ clerkUserId: id, role: 'user', plan: 'free', source: 'web' });

describe('MomentumService', () => {
  it('completes one server-approved quest per day idempotently', async () => {
    const ctx = context(`momentum-${crypto.randomUUID()}`);
    const initial = await MomentumService.getState(ctx, 'UTC');
    const chosen = initial.quests[0];
    const completed = await MomentumService.complete(ctx, 'UTC', chosen.id);
    const repeated = await MomentumService.complete(ctx, 'UTC', initial.quests[1].id);
    expect(completed.completedToday?.questId).toBe(chosen.id);
    expect(repeated.completedToday?.questId).toBe(chosen.id);
    expect(repeated.streak.totalQuests).toBe(1);
    expect((await GamificationService.getSummary(ctx.clerkUserId)).xp).toBe(chosen.xpReward);
  });

  it('rejects a forged or expired quest identifier', async () => {
    const ctx = context(`momentum-${crypto.randomUUID()}`);
    await expect(MomentumService.complete(ctx, 'UTC', 'forged-quest-id')).rejects.toMatchObject({ code: 'QUEST_EXPIRED' });
  });
});
