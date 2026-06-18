import type { AuthContext } from '@/lib/core/context';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { PlanService } from '@/lib/services/plan/plan.service';
import { ConsistencyService } from '@/lib/services/consistency/consistency.service';
import { decideTodayShape } from '@/lib/policy/today';
import { buildInsight } from '@/lib/policy/insight';
import type { CheckinInput, TodayCard } from './types';

const DAY_MS = 86_400_000;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days since the most recent activity date. `dates` is sorted desc (most recent first). */
function daysSinceFrom(dates: string[], today: string): number {
  if (dates.length === 0) return 0;
  const last = Date.parse(dates[0] + 'T00:00:00Z');
  const now = Date.parse(today + 'T00:00:00Z');
  return Math.max(0, Math.round((now - last) / DAY_MS));
}

export type TodayResult = TodayCard | { needsPlan: true };

/**
 * Assemble the adaptive "Today" card.
 *
 * Performance: the three data sources (activity stream, plan, memory) are read ONCE, in
 * parallel. Consistency + days-since-last-activity are then computed in-memory from the same
 * `dates` array (no extra queries), and reflection reuses both `dates` and the already-loaded
 * memory — writing only when derived values changed. See docs/architecture/01-prd.md B1.
 */
export async function getToday(ctx: AuthContext, checkin?: CheckinInput): Promise<TodayResult> {
  const today = todayISO();

  const [dates, plan, existingMemory] = await Promise.all([
    ConsistencyService.getActivityDates(ctx.clerkUserId),
    PlanService.getCurrent(ctx.clerkUserId),
    MemoryService.getMemory(ctx.clerkUserId),
  ]);

  // Reuses `dates` (no second signals scan) and `existingMemory` (no second memory read);
  // skips the write unless something changed.
  const memory = await MemoryService.reflectFromDates(ctx.clerkUserId, dates, existingMemory);

  if (!plan) return { needsPlan: true };

  const consistency = ConsistencyService.summarize(dates, today);
  const daysSinceLastActivity = daysSinceFrom(dates, today);

  const card = decideTodayShape(memory, plan, {
    date: today,
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
