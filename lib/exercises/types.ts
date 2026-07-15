export type MuscleId =
  | 'neck'
  | 'chest'
  | 'upper-chest'
  | 'lower-chest'
  | 'shoulders'
  | 'front-deltoids'
  | 'side-deltoids'
  | 'rear-deltoids'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'upper-abs'
  | 'lower-abs'
  | 'obliques'
  | 'traps'
  | 'upper-back'
  | 'middle-back'
  | 'lats'
  | 'lower-back'
  | 'glutes'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'tibialis'
  | 'hip-flexors'
  | 'adductors'
  | 'abductors';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory = 'strength' | 'hypertrophy' | 'mobility' | 'stretching';
export type ExerciseLocation = 'home' | 'gym';

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  description: string;
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  category: ExerciseCategory;
  movementPattern: 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'carry' | 'core' | 'mobility';
  trainingType: 'compound' | 'isolation';
  locations: ExerciseLocation[];
  instructions: string[];
  breathing: string;
  formTips: string[];
  commonMistakes: string[];
  safetyTips: string[];
  easierVariation: string;
  harderVariation: string;
  setsRecommendation: string;
  repsRecommendation: string;
  restRecommendation: string;
  tags: string[];
  demoStyle: 'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'raise';
}

export interface MuscleDefinition {
  id: MuscleId;
  label: string;
  scientificName: string;
  view: 'front' | 'back' | 'both';
}
