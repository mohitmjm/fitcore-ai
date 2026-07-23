export type ExerciseMediaFormat = 'webm' | 'mp4' | 'gif' | '3d';
export type ExerciseMediaStatus = 'needs-approval' | 'approved' | 'disabled';

export interface ExerciseAnimationMedia {
  mediaStatus: ExerciseMediaStatus;
  previewUrl?: string;
  fullVideoUrl?: string;
  posterUrl?: string;
  frontViewUrl?: string;
  sideViewUrl?: string;
  format?: ExerciseMediaFormat;
  durationSeconds?: number;
  attribution?: string;
  license?: string;
  source?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version: number;
}

const pending = (): ExerciseAnimationMedia => ({ mediaStatus: 'needs-approval', version: 1 });

// Only approved, locally hosted media belongs here. Do not add remote social or video-platform links.
export const EXERCISE_MEDIA: Record<string, ExerciseAnimationMedia> = Object.fromEntries([
  'incline-dumbbell-press', 'push-up', 'seated-dumbbell-shoulder-press', 'dumbbell-lateral-raise',
  'band-reverse-fly', 'alternating-dumbbell-curl', 'overhead-dumbbell-triceps-extension', 'seated-wrist-curl',
  'dead-bug', 'reverse-crunch', 'side-plank', 'dumbbell-shrug', 'one-arm-dumbbell-row',
  'neutral-grip-lat-pulldown', 'bird-dog', 'hip-thrust', 'goblet-squat', 'dumbbell-romanian-deadlift',
  'standing-calf-raise', 'banded-hip-flexor-march', 'sumo-squat', 'band-lateral-walk',
].map((slug) => [slug, pending()]));

export function getExerciseMedia(slug?: string): ExerciseAnimationMedia {
  if (!slug) return pending();
  return EXERCISE_MEDIA[slug] ?? pending();
}
