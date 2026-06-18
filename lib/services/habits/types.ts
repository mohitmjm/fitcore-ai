import type { OwnedDoc } from '@/lib/db/repository';

/**
 * Daily habits — the low-friction half of the consistency loop. Logging a habit also emits a
 * memory signal, so habits count toward streaks/consistency just like workouts.
 */
export type HabitType = 'water' | 'sleep' | 'steps' | 'meditation' | 'stretch';

export const HABIT_TYPES: HabitType[] = ['water', 'sleep', 'steps', 'meditation', 'stretch'];

export interface HabitConfig {
  goal: number;
  unit: string;
  label: string;
  /** Increment applied by a single quick-tap. */
  step: number;
  /** lucide-react icon name used by the UI. */
  icon: string;
}

export const HABIT_CONFIG: Record<HabitType, HabitConfig> = {
  water: { goal: 8, unit: 'glasses', label: 'Water', step: 1, icon: 'droplet' },
  sleep: { goal: 8, unit: 'hours', label: 'Sleep', step: 1, icon: 'moon' },
  steps: { goal: 8000, unit: 'steps', label: 'Steps', step: 1000, icon: 'footprints' },
  meditation: { goal: 10, unit: 'min', label: 'Meditation', step: 5, icon: 'brain' },
  stretch: { goal: 10, unit: 'min', label: 'Stretch', step: 5, icon: 'activity' },
};

/** One row per (user, date, habit). */
export interface HabitLogDoc extends OwnedDoc {
  date: string; // YYYY-MM-DD
  habit: HabitType;
  value: number;
}

export interface HabitState {
  habit: HabitType;
  value: number;
  goal: number;
  unit: string;
  label: string;
  step: number;
  done: boolean;
}

export interface HabitDay {
  date: string;
  habits: HabitState[];
}
