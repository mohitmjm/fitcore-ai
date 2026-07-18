import { getCollection } from '@/lib/db/repository';
import { buildFitnessWorld, type FitnessWorldState, type WorldSignal } from '@/lib/policy/world';
import type { AuthContext } from '@/lib/core/context';
import { HabitsService } from '@/lib/services/habits/habits.service';
import { MemoryService } from '@/lib/services/memory/memory.service';
import type { MemorySignal } from '@/lib/services/memory/types';
import { PlanService } from '@/lib/services/plan/plan.service';
import { ReadinessService } from '@/lib/services/readiness/readiness.service';

export const WorldService = {
  async get(ctx: AuthContext): Promise<FitnessWorldState> {
    const signalsCollection = await getCollection<MemorySignal>('memory_signals');
    const [signals, habits, readiness, memory, plan] = await Promise.all([
      signalsCollection.find({ clerkUserId: ctx.clerkUserId }).sort({ occurredAt: -1 }).limit(2000).toArray(),
      HabitsService.getDay(ctx),
      ReadinessService.getToday(ctx),
      MemoryService.getMemory(ctx.clerkUserId),
      PlanService.getCurrent(ctx.clerkUserId),
    ]);

    return buildFitnessWorld({
      now: new Date(),
      signals: signals.map((signal): WorldSignal => ({ type: signal.type, occurredAt: signal.occurredAt, payload: signal.payload })),
      habits: habits.habits,
      readiness,
      goal: memory?.context?.goal,
      weeklyCommitmentDays: memory?.context?.weeklyCommitmentDays,
      plannedExerciseCount: plan?.days[0]?.exercises.length,
    });
  },
};
