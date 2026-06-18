import type { AuthContext } from '@/lib/core/context';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { PlanService } from '@/lib/services/plan/plan.service';
import { ConsistencyService } from '@/lib/services/consistency/consistency.service';
import { decideTodayShape } from '@/lib/policy/today';
import { buildInsight } from '@/lib/policy/insight';
import type { CheckinInput, TodayCard } from './types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export type TodayResult = TodayCard | { needsPlan: true };

/**
 * Assemble the adaptive "Today" card: refresh derived memory → memory + plan + activity +
 * consistency → deterministic policy → one decision, enriched with a coach insight and a
 * streak/consistency snapshot. See docs/architecture/01-prd.md B1.
 *
 * reflect() runs first so memory.derived.consistencyTrend (which feeds the momentum meter) is
 * fresh before decideTodayShape reads it.
 */
export async function getToday(ctx: AuthContext, checkin?: CheckinInput): Promise<TodayResult> {
  await MemoryService.reflect(ctx.clerkUserId);

  const [memory, plan, daysSinceLastActivity, consistency] = await Promise.all([
    MemoryService.getMemory(ctx.clerkUserId),
    PlanService.getCurrent(ctx.clerkUserId),
    MemoryService.daysSinceLastActivity(ctx.clerkUserId),
    ConsistencyService.getSummary(ctx.clerkUserId),
  ]);

  if (!plan) return { needsPlan: true };

  const card = decideTodayShape(memory, plan, {
    date: todayISO(),
    daysSinceLastActivity,
    checkin,
  });

  const insight = buildInsight({
    trend: consistency.trend,
    currentStreak: consistency.currentStreak,
    weekPct: consistency.weekPct,
    monthPct: consistency.monthPct,
    activeToday: consistency.activeToday,
    mode: card.mode,
    goal: memory?.context?.goal,
  });

  return {
    ...card,
    insight,
    consistency: {
      currentStreak: consistency.currentStreak,
      longestStreak: consistency.longestStreak,
      activeToday: consistency.activeToday,
      weekPct: consistency.weekPct,
      monthPct: consistency.monthPct,
      trend: consistency.trend,
      momentum: consistency.momentum,
    },
  };
}
