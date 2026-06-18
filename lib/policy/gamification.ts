import { computeConsistency, computeTrend, momentumLevel, type ConsistencyStats } from './consistency';

/**
 * Gamification — consistency-first, derived (not stored).
 *
 * XP, level, and badges are a pure function of the user's signal history, so they can never
 * drift out of sync with reality and need no separate mutable counter. Rewards favor *showing
 * up* (logging anything) over volume, in line with the North Star.
 */

export const XP_BY_SIGNAL: Record<string, number> = {
  workout_logged: 20,
  meal_logged: 10,
  weight_logged: 10,
  checkin: 8,
  sleep_logged: 6,
  habit_logged: 5,
  plan_feedback: 5,
  water_logged: 4,
  message: 2,
};

const LEVEL_TITLES = [
  'Rookie',
  'Starter',
  'Regular',
  'Committed',
  'Consistent',
  'Disciplined',
  'Athlete',
  'Beast',
  'Elite',
  'Legend',
];

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface GamificationState {
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  badges: Badge[];
  /** The consistency snapshot computed alongside badges — lets callers avoid a second query. */
  consistency: ConsistencyStats & { trend: 'up' | 'flat' | 'down'; momentum: number };
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] ?? 'Legend';
}

/** Cumulative XP required to reach level L (L>=1): 50·(L-1)·L → 0,100,300,600,1000,… */
function xpToReach(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelForXp(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
} {
  let level = 1;
  while (xpToReach(level + 1) <= xp) level++;
  const base = xpToReach(level);
  const next = xpToReach(level + 1);
  const xpIntoLevel = xp - base;
  const xpForNextLevel = next - base;
  const progressPct = xpForNextLevel > 0 ? Math.round((xpIntoLevel / xpForNextLevel) * 100) : 100;
  return { level, xpIntoLevel, xpForNextLevel, progressPct };
}

export function xpForSignals(signalTypes: string[]): number {
  return signalTypes.reduce((sum, t) => sum + (XP_BY_SIGNAL[t] ?? 0), 0);
}

export interface GamificationInput {
  /** All signal types on record (drives XP + counts). */
  signalTypes: string[];
  /** Activity dates (YYYY-MM-DD) for streak/consistency-based badges. */
  activityDates: string[];
  today: string;
}

export function computeGamification(input: GamificationInput): GamificationState {
  const xp = xpForSignals(input.signalTypes);
  const lvl = levelForXp(xp);

  const counts = new Map<string, number>();
  for (const t of input.signalTypes) counts.set(t, (counts.get(t) ?? 0) + 1);
  const workouts = counts.get('workout_logged') ?? 0;

  const stats = computeConsistency(input.activityDates, input.today);
  const trend = computeTrend(input.activityDates, input.today);

  const badges: Badge[] = [
    { id: 'first_workout', label: 'First Rep', description: 'Logged your first workout', earned: workouts >= 1 },
    { id: 'streak_7', label: 'Week Warrior', description: 'Hit a 7-day streak', earned: stats.longestStreak >= 7 },
    { id: 'streak_30', label: 'Unbreakable', description: 'Hit a 30-day streak', earned: stats.longestStreak >= 30 },
    { id: 'workouts_50', label: 'Half Century', description: 'Logged 50 workouts', earned: workouts >= 50 },
    { id: 'consistent_month', label: 'Locked In', description: '80%+ monthly consistency', earned: stats.monthPct >= 80 },
    { id: 'century_days', label: 'Centurion', description: '100 active days', earned: stats.totalActiveDays >= 100 },
  ];

  return {
    xp,
    level: lvl.level,
    levelTitle: levelTitle(lvl.level),
    xpIntoLevel: lvl.xpIntoLevel,
    xpForNextLevel: lvl.xpForNextLevel,
    progressPct: lvl.progressPct,
    badges,
    consistency: { ...stats, trend, momentum: momentumLevel(stats.monthPct) },
  };
}
