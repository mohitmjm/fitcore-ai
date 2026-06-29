export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  slug: string;
  name: string;
  targetMuscles: string[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  movementPattern: string;
  instructions: string[];
  coachTip: string;
}

export interface ExerciseFilters {
  query?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: ExerciseDifficulty | 'all';
}
