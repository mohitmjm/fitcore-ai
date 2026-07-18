import type { UpdateFilter } from 'mongodb';
import { OwnedRepository } from '@/lib/db/repository';
import type { MomentumQuest } from '@/lib/policy/momentum';
import type { MomentumCompletionDoc } from './types';

class MomentumRepository extends OwnedRepository<MomentumCompletionDoc> {
  constructor() {
    super('momentum_quest_completions');
  }

  async completeOnce(clerkUserId: string, date: string, quest: MomentumQuest): Promise<{ doc: MomentumCompletionDoc; created: boolean }> {
    const coll = await this.coll();
    const now = new Date();
    const result = await coll.updateOne(
      { clerkUserId, date },
      {
        $setOnInsert: {
          clerkUserId,
          date,
          questId: quest.id,
          kind: quest.kind,
          title: quest.title,
          durationMinutes: quest.durationMinutes,
          xpReward: quest.xpReward,
          completedAt: now,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      } as unknown as UpdateFilter<MomentumCompletionDoc>,
      { upsert: true },
    );
    const doc = await coll.findOne({ clerkUserId, date, isActive: { $ne: false } });
    if (!doc) throw new Error('Momentum completion could not be read after write');
    return { doc, created: result.upsertedCount === 1 };
  }
}

export const momentumRepository = new MomentumRepository();
