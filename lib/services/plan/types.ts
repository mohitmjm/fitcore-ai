import type { ObjectId } from 'mongodb';

export type Equipment = 'gym' | 'home' | 'none';

export interface PlanExercise {
  name: string;
  sets: number;
  reps: string | number;
  restSeconds: number;
  muscleGroup: string;
  tip: string;
}

export interface PlanDay {
  day: string;
  focus?: string;
  exercises: PlanExercise[];
}

export interface WorkoutPlanDoc {
  _id?: ObjectId;
  clerkUserId: string;
  weekOf: string; // ISO date of the week's start
  days: PlanDay[];
  mode: string; // CoachMode at generation time
  generatedBy: 'ai' | 'fallback' | 'adjusted';
  version: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
