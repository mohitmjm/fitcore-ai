import type { CoachMode } from '@/lib/services/memory/types';
import type { ReadinessInput, ReadinessSnapshot } from '@/lib/services/readiness/types';

export type CheckinInput = ReadinessInput;

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
  /** Today's durable self-reported training signal, if the member completed the check-in. */
  readiness?: ReadinessSnapshot | null;
}
