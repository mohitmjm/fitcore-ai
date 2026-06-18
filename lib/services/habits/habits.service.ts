import type { AuthContext } from '@/lib/core/context';
import { OwnedRepository } from '@/lib/db/repository';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { SignalType } from '@/lib/services/memory/types';
import {
  HABIT_CONFIG,
  HABIT_TYPES,
  type HabitDay,
  type HabitLogDoc,
  type HabitState,
  type HabitType,
} from './types';

const repo = new OwnedRepository<HabitLogDoc>('habit_logs');

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toState(habit: HabitType, value: number): HabitState {
  const cfg = HABIT_CONFIG[habit];
  return {
    habit,
    value,
    goal: cfg.goal,
    unit: cfg.unit,
    label: cfg.label,
    step: cfg.step,
    done: value >= cfg.goal,
  };
}

function signalTypeFor(habit: HabitType): SignalType {
  if (habit === 'water') return 'water_logged';
  if (habit === 'sleep') return 'sleep_logged';
  return 'habit_logged';
}

/**
 * Habit tracking. getDay returns all five habits (with sensible goals/units) for a date,
 * defaulting missing ones to 0. Writes record a single memory signal the first time a habit is
 * logged for the day, so habits feed the consistency engine without spamming the signal stream.
 */
export const HabitsService = {
  async getDay(ctx: AuthContext, date: string = todayISO()): Promise<HabitDay> {
    const docs = await repo.list(ctx.clerkUserId, { date });
    const byHabit = new Map<HabitType, number>(docs.map((d) => [d.habit, d.value]));
    return { date, habits: HABIT_TYPES.map((h) => toState(h, byHabit.get(h) ?? 0)) };
  },

  async setHabit(
    ctx: AuthContext,
    habit: HabitType,
    value: number,
    date: string = todayISO(),
  ): Promise<HabitDay> {
    const safeValue = Math.max(0, Math.round(value));
    const existing = await repo.findOne(ctx.clerkUserId, { date, habit });
    const prev = existing?.value ?? 0;

    if (existing) {
      await repo.update(ctx.clerkUserId, { date, habit }, { value: safeValue });
    } else {
      await repo.create(ctx.clerkUserId, { date, habit, value: safeValue });
    }

    if (prev <= 0 && safeValue > 0) {
      await MemoryService.recordSignal({
        clerkUserId: ctx.clerkUserId,
        source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
        type: signalTypeFor(habit),
        payload: { habit, value: safeValue },
        occurredAt: new Date(),
      });
    }

    return this.getDay(ctx, date);
  },

  async increment(ctx: AuthContext, habit: HabitType, date: string = todayISO()): Promise<HabitDay> {
    const existing = await repo.findOne(ctx.clerkUserId, { date, habit });
    const prev = existing?.value ?? 0;
    return this.setHabit(ctx, habit, prev + HABIT_CONFIG[habit].step, date);
  },
};
