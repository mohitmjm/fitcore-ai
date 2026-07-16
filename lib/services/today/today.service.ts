import type { AuthContext } from '@/lib/core/context';
import { MemoryService } from '@/lib/services/memory/memory.service';
import { PlanService } from '@/lib/services/plan/plan.service';
import { ConsistencyService } from '@/lib/services/consistency/consistency.service';
import { HabitsService } from '@/lib/services/habits/habits.service';
import { GamificationService } from '@/lib/services/gamification/gamification.service';
import { decideTodayShape } from '@/lib/policy/today';
import { buildInsight } from '@/lib/policy/insight';
import type { CheckinInput, TodayCard, TodayGamificationSnapshot, TodayNeedsPlan } from './types';

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

export type TodayResult = TodayCard | TodayNeedsPlan;

function compactGamification(summary: ReturnType<typeof GamificationService.summarizeSignals>): TodayGamificationSnapshot {
  return {
    xp: summary.xp,
    level: summary.level,
    levelTitle: summary.levelTitle,
    progressPct: summary.progressPct,
  };
}

/**
 * Assemble the adaptive "Today" card.
 *
 * Performance: the initial Today payload reads the activity stream, plan, memory, and habits once
 * in parallel. Consistency, days-since-last-activity, and the level chip are then computed
 * in-memory from the same signal read, while reflection reuses the already-loaded memory and
 * writes only when derived values changed. See docs/architecture/01-prd.md B1.
 */
export async function getToday(ctx: AuthContext, checkin?: CheckinInput): Promise<TodayResult> {
  const today = todayISO();

  const [signals, plan, existingMemory, habitDay] = await Promise.all([
    ConsistencyService.getActivitySignals(ctx.clerkUserId, 2000),
    PlanService.getCurrent(ctx.clerkUserId),
    MemoryService.getMemory(ctx.clerkUserId),
    HabitsService.getDay(ctx, today),
  ]);
  const dates = ConsistencyService.activityDatesFromSignals(signals);
  const consistencyDates = dates.slice(0, 500);
  const gamification = compactGamification(GamificationService.summarizeSignals(signals, today));

  // Reuses the same activity read and `existingMemory`; skips the write unless something changed.
  const memory = await MemoryService.reflectFromDates(ctx.clerkUserId, consistencyDates, existingMemory);

  if (!plan) return { needsPlan: true, habits: habitDay.habits, gamification };

  const consistency = ConsistencyService.summarize(consistencyDates, today);
  const daysSinceLastActivity = daysSinceFrom(consistencyDates, today);

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
    habits: habitDay.habits,
    gamification,
  };
}
