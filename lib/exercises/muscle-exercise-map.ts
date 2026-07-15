import type { MuscleId } from './types';

/**
 * Detailed anatomical regions can share a training catalogue with their
 * parent muscle group. Keeping this mapping outside the UI makes the body
 * model more precise without scattering special cases through components.
 */
export const MUSCLE_EXERCISE_MAP: Record<MuscleId, readonly MuscleId[]> = {
  neck: ['traps'],
  chest: ['chest'],
  'upper-chest': ['upper-chest', 'chest'],
  'lower-chest': ['chest'],
  shoulders: ['shoulders', 'front-deltoids', 'side-deltoids', 'rear-deltoids'],
  'front-deltoids': ['front-deltoids', 'shoulders'],
  'side-deltoids': ['side-deltoids', 'shoulders'],
  'rear-deltoids': ['rear-deltoids', 'upper-back'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  'upper-abs': ['upper-abs'],
  'lower-abs': ['lower-abs'],
  obliques: ['obliques'],
  traps: ['traps'],
  'upper-back': ['upper-back'],
  'middle-back': ['upper-back', 'lower-back'],
  lats: ['lats'],
  'lower-back': ['lower-back'],
  glutes: ['glutes'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
  tibialis: ['calves'],
  'hip-flexors': ['hip-flexors'],
  adductors: ['adductors'],
  abductors: ['abductors'],
};

export function expandMuscleTargets(muscles: readonly MuscleId[]): MuscleId[] {
  return [...new Set(muscles.flatMap((muscle) => MUSCLE_EXERCISE_MAP[muscle]))];
}
