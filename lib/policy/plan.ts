import type { WorkoutPlanDoc } from '@/lib/services/plan/types';

export type ConsistencyTrend = 'up' | 'flat' | 'down';

function bumpReps(reps: string | number, delta: number): string | number {
  if (delta === 0) return reps;
  if (typeof reps === 'number') return Math.max(1, reps + delta);
  const m = reps.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    return `${Math.max(1, Number(m[1]) + delta)}-${Math.max(1, Number(m[2]) + delta)}`;
  }
  return reps;
}

/**
 * The Living Plan's weekly macro-loop (vision §5.7). Progressive overload when the user is
 * trending up; pull back volume when trending down. Pure + testable.
 */
export function adjustWeeklyPlan(plan: WorkoutPlanDoc, trend: ConsistencyTrend): WorkoutPlanDoc {
  const delta = trend === 'up' ? 2 : trend === 'down' ? -2 : 0;
  const days = plan.days.map((d) => ({
    ...d,
    exercises: d.exercises.map((e) => ({ ...e, reps: bumpReps(e.reps, delta) })),
  }));
  return { ...plan, days, generatedBy: 'adjusted', version: plan.version + 1 };
}
