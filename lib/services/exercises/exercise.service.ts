import {
  isSupabaseConfigured,
  selectSupabaseRows,
  type SupabaseRow,
} from '@/lib/db/supabase';
import { EXERCISE_CATALOG } from './catalog';
import type { Exercise, ExerciseDifficulty, ExerciseFilters } from './types';

interface ExerciseRow extends SupabaseRow {
  slug?: string | null;
  name?: string | null;
  target_muscles?: unknown;
  equipment?: unknown;
  difficulty?: string | null;
  movement_pattern?: string | null;
  instructions?: unknown;
  coach_tip?: string | null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asDifficulty(value: unknown): ExerciseDifficulty {
  return value === 'intermediate' || value === 'advanced' ? value : 'beginner';
}

function fromRow(row: ExerciseRow): Exercise | null {
  if (!row.slug || !row.name) return null;
  return {
    slug: row.slug,
    name: row.name,
    targetMuscles: stringArray(row.target_muscles),
    equipment: stringArray(row.equipment),
    difficulty: asDifficulty(row.difficulty),
    movementPattern: row.movement_pattern ?? 'general',
    instructions: stringArray(row.instructions),
    coachTip: row.coach_tip ?? '',
  };
}

function matches(exercise: Exercise, filters: ExerciseFilters): boolean {
  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const haystack = [
      exercise.name,
      exercise.movementPattern,
      exercise.coachTip,
      ...exercise.targetMuscles,
      ...exercise.equipment,
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }

  if (filters.muscle && filters.muscle !== 'all' && !exercise.targetMuscles.includes(filters.muscle)) {
    return false;
  }

  if (filters.equipment && filters.equipment !== 'all' && !exercise.equipment.includes(filters.equipment)) {
    return false;
  }

  if (filters.difficulty && filters.difficulty !== 'all' && exercise.difficulty !== filters.difficulty) {
    return false;
  }

  return true;
}

async function loadExercises(): Promise<Exercise[]> {
  if (!isSupabaseConfigured()) return EXERCISE_CATALOG;

  const rows = await selectSupabaseRows<ExerciseRow>(
    'exercises',
    { is_active: true },
    'slug,name,target_muscles,equipment,difficulty,movement_pattern,instructions,coach_tip',
    { order: 'name.asc' },
  );
  const exercises = rows.map(fromRow).filter((item): item is Exercise => item !== null);
  return exercises.length > 0 ? exercises : EXERCISE_CATALOG;
}

export const ExerciseService = {
  async list(filters: ExerciseFilters = {}): Promise<Exercise[]> {
    const exercises = await loadExercises();
    return exercises.filter((exercise) => matches(exercise, filters));
  },
};
