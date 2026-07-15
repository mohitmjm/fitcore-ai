import { z } from 'zod';
import { EXERCISES, EXERCISE_BY_SLUG } from '@/lib/exercises/catalog';
import type { Exercise, ExerciseCategory, ExerciseDifficulty, ExerciseLocation, MuscleId } from '@/lib/exercises/types';
import { OwnedRepository, type OwnedDoc } from '@/lib/db/repository';
import { Errors } from '@/lib/core/errors';

const SavedExerciseInput = z.object({ exerciseId: z.string().min(1).max(80) });

interface SavedExerciseDoc extends OwnedDoc {
  exerciseId: string;
}

const savedRepo = new OwnedRepository<SavedExerciseDoc>('saved_exercises');

export interface ExerciseFilters {
  search?: string;
  muscles?: MuscleId[];
  equipment?: string[];
  difficulty?: ExerciseDifficulty[];
  category?: ExerciseCategory[];
  location?: ExerciseLocation;
  trainingType?: 'compound' | 'isolation';
}

function includesLoose(values: string[], choices: string[]): boolean {
  const normalized = values.map((value) => value.toLowerCase());
  return choices.some((choice) => normalized.some((value) => value.includes(choice.toLowerCase())));
}

export const ExerciseService = {
  list(filters: ExerciseFilters = {}): Exercise[] {
    const search = filters.search?.trim().toLowerCase();
    return EXERCISES.filter((exercise) => {
      if (
        search &&
        ![exercise.name, exercise.description, ...exercise.tags, ...exercise.primaryMuscles]
          .join(' ')
          .toLowerCase()
          .includes(search)
      ) return false;
      if (
        filters.muscles?.length &&
        !filters.muscles.some((muscle) =>
          [...exercise.primaryMuscles, ...exercise.secondaryMuscles].includes(muscle),
        )
      ) return false;
      if (filters.equipment?.length && !includesLoose(exercise.equipment, filters.equipment)) return false;
      if (filters.difficulty?.length && !filters.difficulty.includes(exercise.difficulty)) return false;
      if (filters.category?.length && !filters.category.includes(exercise.category)) return false;
      if (filters.location && !exercise.locations.includes(filters.location)) return false;
      if (filters.trainingType && exercise.trainingType !== filters.trainingType) return false;
      return true;
    });
  },

  getBySlug(slug: string): Exercise | null {
    return EXERCISE_BY_SLUG[slug] ?? null;
  },

  getById(id: string): Exercise | null {
    return EXERCISES.find((exercise) => exercise.id === id) ?? null;
  },

  async getSavedIds(clerkUserId: string): Promise<string[]> {
    const saved = await savedRepo.list(clerkUserId);
    return [...new Set(saved.map((item) => item.exerciseId))];
  },

  async save(clerkUserId: string, raw: unknown): Promise<void> {
    const input = SavedExerciseInput.parse(raw);
    if (!this.getById(input.exerciseId)) throw Errors.notFound('Exercise');
    const existing = await savedRepo.findOne(clerkUserId, { exerciseId: input.exerciseId });
    if (!existing) await savedRepo.create(clerkUserId, { exerciseId: input.exerciseId });
  },

  async unsave(clerkUserId: string, raw: unknown): Promise<void> {
    const input = SavedExerciseInput.parse(raw);
    await savedRepo.softDelete(clerkUserId, { exerciseId: input.exerciseId });
  },
};
