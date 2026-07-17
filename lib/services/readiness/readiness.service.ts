import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { OwnedRepository } from '@/lib/db/repository';
import { calculateReadiness } from '@/lib/policy/readiness';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { ReadinessDoc, ReadinessInput, ReadinessSnapshot } from './types';

const repo = new OwnedRepository<ReadinessDoc>('daily_readiness');

export const ReadinessInputSchema = z.object({
  energy: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  sleepHours: z.number().min(0).max(16),
  soreness: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  stress: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  timeMinutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]),
  busy: z.boolean().optional(),
  traveling: z.boolean().optional(),
  sick: z.boolean().optional(),
});

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Persist one editable check-in per member per day, then emit a single coach-memory signal. */
export const ReadinessService = {
  async getToday(ctx: AuthContext, date: string = todayISO()): Promise<ReadinessSnapshot | null> {
    const doc = await repo.findOne(ctx.clerkUserId, { date });
    return doc ? { date: doc.date, score: doc.score, band: doc.band, title: doc.title, message: doc.message, checkin: doc.checkin } : null;
  },

  async save(ctx: AuthContext, raw: unknown, date: string = todayISO()): Promise<ReadinessSnapshot> {
    const checkin = ReadinessInputSchema.parse(raw) as ReadinessInput;
    const readiness = calculateReadiness(date, checkin);
    const existing = await repo.findOne(ctx.clerkUserId, { date });

    if (existing) {
      await repo.update(ctx.clerkUserId, { date }, readiness);
    } else {
      await repo.create(ctx.clerkUserId, readiness);
      await MemoryService.recordSignal({
        clerkUserId: ctx.clerkUserId,
        source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
        type: 'checkin',
        payload: { score: readiness.score, band: readiness.band, ...checkin },
        occurredAt: new Date(),
      });
    }

    return readiness;
  },
};
