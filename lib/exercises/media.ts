import type { Exercise } from './types';

export interface ExerciseMedia {
  videoUrl: string;
  provider: 'fitcore-development';
  status: 'development-placeholder';
  label: string;
}

/**
 * One swappable media boundary for the whole exercise library. The repository
 * currently has no licensed Fitcore exercise footage, so this CC0 development
 * clip keeps player behaviour fully testable without presenting borrowed
 * workout content as production media.
 */
const DEVELOPMENT_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export function getExerciseMedia(exercise: Pick<Exercise, 'name'>): ExerciseMedia {
  return {
    videoUrl: DEVELOPMENT_VIDEO_URL,
    provider: 'fitcore-development',
    status: 'development-placeholder',
    label: `${exercise.name} development preview`,
  };
}
