import type { CoachMode } from '@/lib/services/memory/types';
import type { HabitState } from '@/lib/services/habits/types';

export interface CheckinInput {
  energy?: 1 | 2 | 3 | 4 | 5;
  sleepHours?: number;
  timeMinutes?: number;
  busy?: boolean;
  traveling?: boolean;
  sick?: boolean;
}

export interface TodaySignals {
  date: string; // ISO date (YYYY-MM-DD)
  daysSinceLastActivity: number;
  checkin?: CheckinInput;
}

export type PrimaryActionKind = 'workout' | 'recovery' | 'rest' | 'comeback';

/** Compact consistency snapshot surfaced on Today (from the consistency engine). */
export interface ConsistencySnapshot {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  weekPct: number;
  monthPct: number;
  trend: 'up' | 'flat' | 'down';
  momentum: number; // 1..5
}

export interface TodayGamificationSnapshot {
  xp: number;
  level: number;
  levelTitle: string;
  progressPct: number;
}

export interface TodaySharedSnapshot {
  /** Initial habit state for Today. Dedicated habits endpoint remains the write path. */
  habits: HabitState[];
  /** Compact level chip data derived from the same signal read as consistency. */
  gamification: TodayGamificationSnapshot;
}

export interface TodayCard {
  date: string;
  mode: CoachMode;
  greeting: string;
  primaryAction: {
    kind: PrimaryActionKind;
    title: string;
    durationMin: number;
    exercises: { name: string; sets: number; reps: string | number }[];
  };
  why: string;
  quickLogs: ('workout' | 'meal' | 'water' | 'weight')[];
  momentum: { label: string; level: number };
  /** One-line motivating coach insight (deterministic, instant). Set by the service. */
  insight?: string;
  /** Streak + consistency snapshot. Set by the service. */
  consistency?: ConsistencySnapshot;
  /** Extra Today page data bundled to avoid client request fanout. */
  habits?: HabitState[];
  gamification?: TodayGamificationSnapshot;
}

export type TodayNeedsPlan = { needsPlan: true } & TodaySharedSnapshot;
