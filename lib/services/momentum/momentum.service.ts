import { AppError } from '@/lib/core/errors';
import type { AuthContext } from '@/lib/core/context';
import { emitEvent } from '@/lib/events/bus';
import {
  buildMomentumExperience,
  shiftMomentumDate,
  type MomentumCompletionFact,
  type MomentumExperience,
} from '@/lib/policy/momentum';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { ReadinessService } from '@/lib/services/readiness/readiness.service';
import { momentumRepository } from './momentum.repository';
import type { MomentumCompletionDoc } from './types';

function dateInTimezone(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function toFact(doc: MomentumCompletionDoc): MomentumCompletionFact {
  return {
    date: doc.date,
    questId: doc.questId,
    kind: doc.kind,
    title: doc.title,
    durationMinutes: doc.durationMinutes,
    xpReward: doc.xpReward,
    completedAt: new Date(doc.completedAt).toISOString(),
  };
}

export const MomentumService = {
  async getState(ctx: AuthContext, timezone: string): Promise<MomentumExperience> {
    const date = dateInTimezone(timezone);
    const from = shiftMomentumDate(date, -27);
    const [readiness, docs] = await Promise.all([
      ReadinessService.getToday(ctx, date),
      momentumRepository.listLimited(ctx.clerkUserId, { date: { $gte: from, $lte: date } }, { date: -1 }, 28),
    ]);
    return buildMomentumExperience({
      date,
      readiness: readiness ? { band: readiness.band, score: readiness.score } : null,
      completions: docs.map(toFact),
    });
  },

  async complete(ctx: AuthContext, timezone: string, questId: string): Promise<MomentumExperience> {
    const before = await this.getState(ctx, timezone);
    if (before.completedToday) return before;
    const quest = before.quests.find((candidate) => candidate.id === questId);
    if (!quest) throw new AppError('QUEST_EXPIRED', 'This quest has expired. Refresh today’s choices.', 409);

    const result = await momentumRepository.completeOnce(ctx.clerkUserId, before.date, quest);
    if (result.created) {
      await MemoryService.recordSignal({
        clerkUserId: ctx.clerkUserId,
        source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
        type: 'quest_completed',
        payload: {
          date: before.date,
          questId: quest.id,
          questKind: quest.kind,
          durationMinutes: quest.durationMinutes,
          xpReward: quest.xpReward,
        },
        occurredAt: new Date(),
      });
      await emitEvent({
        type: 'momentum_quest.completed',
        clerkUserId: ctx.clerkUserId,
        date: before.date,
        questId: quest.id,
        kind: quest.kind,
      });
    }
    return this.getState(ctx, timezone);
  },
};
