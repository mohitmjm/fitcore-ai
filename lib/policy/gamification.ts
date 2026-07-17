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

const DAILY_XP_CAPS: Record<string, number> = {
  workout_logged: 6,
  meal_logged: 3,
  weight_logged: 1,
  checkin: 2,
  sleep_logged: 1,
  habit_logged: 4,
  plan_feedback: 2,
  water_logged: 4,
  message: 8,
};

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  progress: number;
  target: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
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
  if (level >= 100) return 'Fitcore Legend';
  if (level >= 76) return 'Master';
  if (level >= 51) return 'Elite';
  if (level >= 36) return 'Advanced';
  if (level >= 21) return 'Athlete';
  if (level >= 11) return 'Challenger';
  if (level >= 6) return 'Consistent';
  return 'Foundation';
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

export interface XPEvent {
  type: string;
  occurredAt: string | Date;
  payload?: Record<string, unknown>;
}

/**
 * Turns verified domain events into XP. Duplicate event fingerprints and per-day caps prevent
 * rapid repeat logging from becoming a reward exploit. Safety signals never award negative XP.
 */
export function validatedXpForEvents(events: XPEvent[]): number {
  const seen = new Set<string>();
  const dailyCounts = new Map<string, number>();
  let xp = 0;

  for (const event of [...events].sort((a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt))) {
    const award = XP_BY_SIGNAL[event.type] ?? 0;
    if (!award) continue;
    const day = new Date(event.occurredAt).toISOString().slice(0, 10);
    const subject = String(event.payload?.exerciseName ?? event.payload?.habit ?? event.payload?.date ?? 'event');
    const fingerprint = `${event.type}:${day}:${subject}`;
    const dayKey = `${event.type}:${day}`;
    const count = dailyCounts.get(dayKey) ?? 0;
    const cap = DAILY_XP_CAPS[event.type] ?? 1;
    if (seen.has(fingerprint) || count >= cap) continue;
    seen.add(fingerprint);
    dailyCounts.set(dayKey, count + 1);
    xp += award;
  }

  return xp;
}

export interface GamificationInput {
  /** All signal types on record (drives XP + counts). */
  signalTypes: string[];
  /** Activity dates (YYYY-MM-DD) for streak/consistency-based badges. */
  activityDates: string[];
  today: string;
  /** Full events enable duplicate detection and daily XP caps on the service path. */
  events?: XPEvent[];
}

export function computeGamification(input: GamificationInput): GamificationState {
  const xp = input.events ? validatedXpForEvents(input.events) : xpForSignals(input.signalTypes);
  const lvl = levelForXp(xp);

  const counts = new Map<string, number>();
  for (const t of input.signalTypes) counts.set(t, (counts.get(t) ?? 0) + 1);
  const workouts = counts.get('workout_logged') ?? 0;

  const stats = computeConsistency(input.activityDates, input.today);
  const trend = computeTrend(input.activityDates, input.today);

  const badge = (
    id: string,
    label: string,
    description: string,
    progress: number,
    target: number,
    rarity: Badge['rarity'],
    xpReward: number,
  ): Badge => ({ id, label, description, progress: Math.min(progress, target), target, earned: progress >= target, rarity, xpReward });

  const badges: Badge[] = [
    badge('first_workout', 'First Rep', 'Complete your first planned movement', workouts, 1, 'common', 25),
    badge('workouts_10', 'Training Rhythm', 'Complete 10 planned movements', workouts, 10, 'uncommon', 75),
    badge('streak_7', 'Seven-Day Rhythm', 'Stay active across seven consecutive days', stats.longestStreak, 7, 'uncommon', 100),
    badge('comeback', 'Back in Motion', 'Return and log activity after time away', counts.get('streak_event') ?? 0, 1, 'rare', 120),
    badge('workouts_50', 'Fifty Strong', 'Complete 50 planned movements', workouts, 50, 'rare', 250),
    badge('consistent_month', 'Locked In', 'Reach 80% consistency across 28 days', stats.monthPct, 80, 'epic', 300),
    badge('mobility_builder', 'Mobility Builder', 'Complete 15 mobility or stretch logs', counts.get('habit_logged') ?? 0, 15, 'uncommon', 100),
    badge('nutrition_rhythm', 'Fuelled Week', 'Log 21 meals with awareness', counts.get('meal_logged') ?? 0, 21, 'rare', 180),
    badge('century_days', 'Century Journey', 'Show up on 100 different days', stats.totalActiveDays, 100, 'epic', 500),
    badge('year_journey', 'One-Year Journey', 'Stay in the game for 365 active days', stats.totalActiveDays, 365, 'legendary', 1000),
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
