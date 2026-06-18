import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { OwnedRepository, type OwnedDoc } from '@/lib/db/repository';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { SignalType } from '@/lib/services/memory/types';

interface LogDoc extends OwnedDoc {
  type: string;
  value: Record<string, unknown>;
  note?: string;
}

const logsRepo = new OwnedRepository<LogDoc>('logs');

export const LogInput = z.object({
  type: z.enum(['weight', 'water', 'meal', 'workout', 'checkin']),
  value: z.record(z.unknown()).optional(),
  note: z.string().optional(),
});

const SIGNAL_BY_TYPE: Record<string, SignalType> = {
  weight: 'weight_logged',
  water: 'water_logged',
  meal: 'meal_logged',
  workout: 'workout_logged',
  checkin: 'checkin',
};

/**
 * Effortless logging (weight/water/meal/workout/checkin). Persists the log AND emits a Coach
 * Memory signal so the coach learns. Same entrypoint for app, WhatsApp, and voice.
 */
export async function recordLog(ctx: AuthContext, raw: unknown) {
  const input = LogInput.parse(raw);
  const value = input.value ?? {};

  await logsRepo.create(ctx.clerkUserId, { type: input.type, value, note: input.note });

  await MemoryService.recordSignal({
    clerkUserId: ctx.clerkUserId,
    source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
    type: SIGNAL_BY_TYPE[input.type] ?? 'checkin',
    payload: value,
    occurredAt: new Date(),
  });

  return { logged: true, type: input.type };
}
