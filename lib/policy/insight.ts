import type { CoachMode } from '@/lib/services/memory/types';

/**
 * Coach Insight — a single, human, motivating line for the Today screen.
 *
 * Deterministic + instant (no LLM round-trip), so Today loads fast and works with zero keys.
 * It reflects the user's real consistency + current mode, reinforcing the North Star without
 * being punitive (vision §5.6). The conversational coach (LLM) handles open Q&A separately.
 */
export interface InsightInput {
  trend: 'up' | 'flat' | 'down';
  currentStreak: number;
  weekPct: number;
  monthPct: number;
  activeToday: boolean;
  mode: CoachMode;
  goal?: string;
}

export function buildInsight(i: InsightInput): string {
  // Mode-driven messages take priority — they explain the adapted plan.
  if (i.mode === 'comeback') {
    return "Welcome back. We're not starting over — we're picking up. Just today's small step counts.";
  }
  if (i.mode === 'exam') {
    return 'Exam season detected. Protecting your routine with a short reset — momentum over maxing out.';
  }
  if (i.mode === 'illness') {
    return 'Rest is training too. Recover today; your streak is protected and your progress is safe.';
  }
  if (i.mode === 'travel') {
    return 'On the move? A quick no-equipment session keeps the chain alive wherever you are.';
  }
  if (i.mode === 'busy' || i.mode === 'deload') {
    return 'Short on time or energy — a focused mini-session today beats a perfect session skipped.';
  }

  // Streak-driven encouragement.
  if (i.currentStreak >= 14) {
    return `${i.currentStreak} days strong. This is who you are now — consistency on autopilot.`;
  }
  if (i.currentStreak >= 7) {
    return `A full week locked in (${i.currentStreak}-day streak). Showing up is the hard part, and you're doing it.`;
  }
  if (i.currentStreak >= 3) {
    return `${i.currentStreak}-day streak building. Keep the chain alive — one more day compounds.`;
  }

  // No active streak: nudge based on trend + recent activity.
  if (!i.activeToday && i.currentStreak === 0) {
    if (i.monthPct >= 40) {
      return 'A small action today restarts your momentum. You already know you can do this.';
    }
    return "Today's the easiest day to begin again. One log, one set — that's a win.";
  }

  if (i.trend === 'up') {
    return `You're trending up vs last week (${i.weekPct}% this week). Momentum is on your side.`;
  }
  if (i.trend === 'down') {
    return 'Last week dipped a little — totally normal. Today is a fresh chance to steady the ship.';
  }
  return `Steady and consistent (${i.monthPct}% this month). Show up today and keep it rolling.`;
}
