import { z } from 'zod';
import type { ObjectId } from 'mongodb';
import { OwnedRepository, type OwnedDoc } from '@/lib/db/repository';
import { ExerciseService } from './exercise.service';
import { Errors } from '@/lib/core/errors';

export interface DraftWorkoutExercise {
  exerciseId: string;
  slug: string;
  name: string;
  sets: number;
  reps: string;
  weightKg?: number;
  durationSeconds?: number;
  restSeconds: number;
  notes?: string;
  order: number;
}

interface WorkoutDraftDoc extends OwnedDoc {
  _id?: ObjectId;
  target: 'today' | 'existing' | 'new';
  targetName: string;
  exercises: DraftWorkoutExercise[];
}

const AddExerciseInput = z.object({
  exerciseId: z.string().min(1),
  target: z.enum(['today', 'existing', 'new']).default('today'),
  targetName: z.string().trim().min(1).max(80).default("Today's workout"),
  sets: z.number().int().min(1).max(12).default(3),
  reps: z.string().trim().min(1).max(20).default('10'),
  weightKg: z.number().min(0).max(1000).optional(),
  durationSeconds: z.number().int().min(0).max(7200).optional(),
  restSeconds: z.number().int().min(0).max(900).default(60),
  notes: z.string().trim().max(300).optional(),
});

const draftsRepo = new OwnedRepository<WorkoutDraftDoc>('workout_drafts');

export const WorkoutBuilderService = {
  async addExercise(clerkUserId: string, raw: unknown): Promise<WorkoutDraftDoc> {
    const input = AddExerciseInput.parse(raw);
    const exercise = ExerciseService.getById(input.exerciseId);
    if (!exercise) throw Errors.notFound('Exercise');

    const existing = await draftsRepo.findOne(clerkUserId, {
      target: input.target,
      targetName: input.targetName,
    });
    const current = existing?.exercises ?? [];
    const draftExercise: DraftWorkoutExercise = {
      exerciseId: exercise.id,
      slug: exercise.slug,
      name: exercise.name,
      sets: input.sets,
      reps: input.reps,
      weightKg: input.weightKg,
      durationSeconds: input.durationSeconds,
      restSeconds: input.restSeconds,
      notes: input.notes,
      order: current.find((item) => item.exerciseId === exercise.id)?.order ?? current.length,
    };
    const exercises = current.some((item) => item.exerciseId === exercise.id)
      ? current.map((item) => (item.exerciseId === exercise.id ? draftExercise : item))
      : [...current, draftExercise];

    if (existing) {
      await draftsRepo.update(clerkUserId, { target: input.target, targetName: input.targetName }, { exercises });
    } else {
      await draftsRepo.create(clerkUserId, {
        target: input.target,
        targetName: input.targetName,
        exercises,
      });
    }

    return {
      ...(existing ?? {}),
      clerkUserId,
      target: input.target,
      targetName: input.targetName,
      exercises,
    };
  },

  async getToday(clerkUserId: string): Promise<WorkoutDraftDoc | null> {
    return draftsRepo.findOne(clerkUserId, { target: 'today', targetName: "Today's workout" });
  },
};
