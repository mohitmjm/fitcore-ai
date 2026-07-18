import { EXERCISES } from './catalog';
import type { Exercise, MuscleId } from './types';

export type MotionTemplate =
  | 'incline-press'
  | 'push-up'
  | 'overhead-press'
  | 'lateral-raise'
  | 'reverse-fly'
  | 'curl'
  | 'overhead-extension'
  | 'wrist-curl'
  | 'dead-bug'
  | 'reverse-crunch'
  | 'side-plank'
  | 'shrug'
  | 'row'
  | 'pulldown'
  | 'bird-dog'
  | 'hip-thrust'
  | 'squat'
  | 'hinge'
  | 'calf-raise'
  | 'march'
  | 'lateral-walk'
  | 'supported-fallback';

export type BodyPosition = 'standing' | 'seated' | 'incline' | 'supine' | 'prone' | 'kneeling';
export type CameraAngle = 'front' | 'side' | 'three-quarter';

export interface JointPose {
  torso: number;
  shoulder: number;
  elbow: number;
  hip: number;
  knee: number;
  ankle: number;
}

export interface ExerciseAnimationConfig {
  exerciseId: string;
  slug: string;
  template: MotionTemplate;
  movementCategory: Exercise['movementPattern'];
  equipment: string[];
  bodyPosition: BodyPosition;
  cameraAngle: CameraAngle;
  startPose: JointPose;
  endPose: JointPose;
  rangeOfMotion: string;
  tempo: string;
  repetitionDurationMs: number;
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  equipmentMovement: string;
  safetyConstraints: string[];
  instructionMarkers: [string, string, string];
  breathingCue: string;
  fallbackAnimation: MotionTemplate;
}

const STANDING: JointPose = { torso: 0, shoulder: 8, elbow: 6, hip: 0, knee: 4, ankle: 0 };
const SEATED: JointPose = { torso: 0, shoulder: 8, elbow: 78, hip: 84, knee: 88, ankle: 0 };

type MotionDefinition = Pick<
  ExerciseAnimationConfig,
  | 'template'
  | 'bodyPosition'
  | 'cameraAngle'
  | 'startPose'
  | 'endPose'
  | 'rangeOfMotion'
  | 'equipmentMovement'
  | 'instructionMarkers'
>;

const MOTIONS: Record<string, MotionDefinition> = {
  'incline-dumbbell-press': {
    template: 'incline-press', bodyPosition: 'incline', cameraAngle: 'side',
    startPose: { ...SEATED, torso: -28, shoulder: 72, elbow: 92 }, endPose: { ...SEATED, torso: -28, shoulder: 142, elbow: 12 },
    rangeOfMotion: 'Lower to chest level, then press up without locking hard.', equipmentMovement: 'Dumbbells travel up and slightly inward.',
    instructionMarkers: ['Shoulder blades set', 'Press above upper chest', 'Return with control'],
  },
  'push-up': {
    template: 'push-up', bodyPosition: 'prone', cameraAngle: 'side',
    startPose: { ...STANDING, torso: 90, shoulder: 82, elbow: 8 }, endPose: { ...STANDING, torso: 90, shoulder: 82, elbow: 88 },
    rangeOfMotion: 'Lower the chest as one unit until elbows reach a comfortable depth.', equipmentMovement: 'Body moves as one braced line.',
    instructionMarkers: ['Brace from ribs to glutes', 'Lower as one unit', 'Press the floor away'],
  },
  'seated-dumbbell-shoulder-press': {
    template: 'overhead-press', bodyPosition: 'seated', cameraAngle: 'front',
    startPose: { ...SEATED, shoulder: 82, elbow: 92 }, endPose: { ...SEATED, shoulder: 164, elbow: 8 },
    rangeOfMotion: 'Press from shoulder height to overhead within a pain-free range.', equipmentMovement: 'Dumbbells finish stacked above the shoulders.',
    instructionMarkers: ['Ribs stay down', 'Press overhead', 'Lower to shoulder height'],
  },
  'dumbbell-lateral-raise': {
    template: 'lateral-raise', bodyPosition: 'standing', cameraAngle: 'front',
    startPose: { ...STANDING, shoulder: 8, elbow: 8 }, endPose: { ...STANDING, shoulder: 88, elbow: 12 },
    rangeOfMotion: 'Raise to roughly shoulder height without shrugging.', equipmentMovement: 'Dumbbells arc outward with soft elbows.',
    instructionMarkers: ['Soft elbows', 'Lead with elbows', 'Stop near shoulder height'],
  },
  'band-reverse-fly': {
    template: 'reverse-fly', bodyPosition: 'standing', cameraAngle: 'three-quarter',
    startPose: { ...STANDING, shoulder: 80, elbow: 8 }, endPose: { ...STANDING, shoulder: -8, elbow: 8 },
    rangeOfMotion: 'Open the arms until the band reaches the chest without arching.', equipmentMovement: 'Band tension increases smoothly across the chest.',
    instructionMarkers: ['Ribs stacked', 'Open from upper back', 'Return slowly'],
  },
  'alternating-dumbbell-curl': {
    template: 'curl', bodyPosition: 'standing', cameraAngle: 'front',
    startPose: STANDING, endPose: { ...STANDING, elbow: 128 },
    rangeOfMotion: 'Flex one elbow at a time while the upper arm stays quiet.', equipmentMovement: 'Dumbbell arcs toward the shoulder without swinging.',
    instructionMarkers: ['Elbow under shoulder', 'Curl without swinging', 'Lower for two counts'],
  },
  'overhead-dumbbell-triceps-extension': {
    template: 'overhead-extension', bodyPosition: 'seated', cameraAngle: 'side',
    startPose: { ...SEATED, shoulder: 160, elbow: 105 }, endPose: { ...SEATED, shoulder: 160, elbow: 8 },
    rangeOfMotion: 'Extend the elbows overhead while keeping the upper arms stable.', equipmentMovement: 'Dumbbell rises above the crown of the head.',
    instructionMarkers: ['Upper arms vertical', 'Extend without flaring', 'Lower behind head'],
  },
  'seated-wrist-curl': {
    template: 'wrist-curl', bodyPosition: 'seated', cameraAngle: 'side',
    startPose: { ...SEATED, elbow: 90 }, endPose: { ...SEATED, elbow: 90, ankle: 35 },
    rangeOfMotion: 'Curl through the wrist only, using a small controlled range.', equipmentMovement: 'Dumbbells roll into the palm as wrists flex.',
    instructionMarkers: ['Forearms supported', 'Curl at the wrist', 'Open the hand slowly'],
  },
  'dead-bug': {
    template: 'dead-bug', bodyPosition: 'supine', cameraAngle: 'side',
    startPose: { ...STANDING, torso: 90, shoulder: 90, hip: 90, knee: 90 }, endPose: { ...STANDING, torso: 90, shoulder: 164, hip: 18, knee: 8 },
    rangeOfMotion: 'Extend opposite arm and leg only as far as the back stays settled.', equipmentMovement: 'Bodyweight limbs lengthen away from the trunk.',
    instructionMarkers: ['Exhale and brace', 'Reach opposite limbs', 'Return without arching'],
  },
  'reverse-crunch': {
    template: 'reverse-crunch', bodyPosition: 'supine', cameraAngle: 'side',
    startPose: { ...STANDING, torso: 90, hip: 90, knee: 90 }, endPose: { ...STANDING, torso: 78, hip: 125, knee: 90 },
    rangeOfMotion: 'Curl the pelvis toward the ribs without using momentum.', equipmentMovement: 'Knees travel toward the chest as the pelvis curls.',
    instructionMarkers: ['Flatten the low back', 'Curl the pelvis', 'Lower without swinging'],
  },
  'side-plank': {
    template: 'side-plank', bodyPosition: 'prone', cameraAngle: 'front',
    startPose: { ...STANDING, torso: 90, shoulder: 90, elbow: 90 }, endPose: { ...STANDING, torso: 90, shoulder: 90, elbow: 90 },
    rangeOfMotion: 'Hold a straight line while breathing normally.', equipmentMovement: 'Static bodyweight hold.',
    instructionMarkers: ['Elbow below shoulder', 'Lift the underside waist', 'Breathe behind the brace'],
  },
  'dumbbell-shrug': {
    template: 'shrug', bodyPosition: 'standing', cameraAngle: 'front',
    startPose: STANDING, endPose: { ...STANDING, shoulder: -8 },
    rangeOfMotion: 'Elevate the shoulders straight up, then lower fully.', equipmentMovement: 'Dumbbells move vertically beside the thighs.',
    instructionMarkers: ['Arms stay long', 'Lift shoulders upward', 'Do not roll'],
  },
  'one-arm-dumbbell-row': {
    template: 'row', bodyPosition: 'kneeling', cameraAngle: 'side',
    startPose: { ...STANDING, torso: 58, shoulder: 72, elbow: 8, hip: 35, knee: 30 }, endPose: { ...STANDING, torso: 58, shoulder: 20, elbow: 105, hip: 35, knee: 30 },
    rangeOfMotion: 'Pull the elbow toward the hip while the torso remains square.', equipmentMovement: 'Dumbbell travels close to the ribcage.',
    instructionMarkers: ['Long neutral spine', 'Drive elbow to hip', 'Reach down under control'],
  },
  'neutral-grip-lat-pulldown': {
    template: 'pulldown', bodyPosition: 'seated', cameraAngle: 'front',
    startPose: { ...SEATED, shoulder: 165, elbow: 8 }, endPose: { ...SEATED, shoulder: 70, elbow: 105 },
    rangeOfMotion: 'Pull to the upper chest without leaning far back.', equipmentMovement: 'Cable handle descends vertically toward the collarbone.',
    instructionMarkers: ['Reach tall', 'Drive elbows down', 'Control the cable up'],
  },
  'bird-dog': {
    template: 'bird-dog', bodyPosition: 'kneeling', cameraAngle: 'side',
    startPose: { ...STANDING, torso: 90, shoulder: 90, elbow: 4, hip: 90, knee: 90 }, endPose: { ...STANDING, torso: 90, shoulder: 164, elbow: 4, hip: 8, knee: 5 },
    rangeOfMotion: 'Reach opposite arm and leg until level with the torso.', equipmentMovement: 'Bodyweight limbs extend away from a stable trunk.',
    instructionMarkers: ['Hands under shoulders', 'Reach long, not high', 'Keep hips square'],
  },
  'hip-thrust': {
    template: 'hip-thrust', bodyPosition: 'supine', cameraAngle: 'side',
    startPose: { ...STANDING, torso: 55, hip: 75, knee: 92 }, endPose: { ...STANDING, torso: 90, hip: 8, knee: 92 },
    rangeOfMotion: 'Drive the hips to a level torso without overextending the back.', equipmentMovement: 'Barbell rises vertically with the pelvis.',
    instructionMarkers: ['Chin gently tucked', 'Drive through mid-foot', 'Finish with glutes'],
  },
  'goblet-squat': {
    template: 'squat', bodyPosition: 'standing', cameraAngle: 'three-quarter',
    startPose: STANDING, endPose: { ...STANDING, torso: 12, hip: 88, knee: 104, ankle: 18 },
    rangeOfMotion: 'Sit between the hips to the deepest stable, pain-free position.', equipmentMovement: 'Load stays close to the chest over mid-foot.',
    instructionMarkers: ['Brace around the load', 'Knees track over toes', 'Stand through the floor'],
  },
  'dumbbell-romanian-deadlift': {
    template: 'hinge', bodyPosition: 'standing', cameraAngle: 'side',
    startPose: STANDING, endPose: { ...STANDING, torso: 58, hip: 72, knee: 22 },
    rangeOfMotion: 'Push the hips back until hamstrings limit the range.', equipmentMovement: 'Dumbbells slide close to the legs.',
    instructionMarkers: ['Soften the knees', 'Send hips back', 'Stand by squeezing glutes'],
  },
  'standing-calf-raise': {
    template: 'calf-raise', bodyPosition: 'standing', cameraAngle: 'side',
    startPose: STANDING, endPose: { ...STANDING, ankle: 34 },
    rangeOfMotion: 'Rise onto the balls of the feet, pause, and lower fully.', equipmentMovement: 'Body and dumbbells rise vertically.',
    instructionMarkers: ['Tripod foot', 'Rise straight up', 'Lower the heel slowly'],
  },
  'banded-hip-flexor-march': {
    template: 'march', bodyPosition: 'standing', cameraAngle: 'front',
    startPose: STANDING, endPose: { ...STANDING, hip: 88, knee: 94 },
    rangeOfMotion: 'Lift one knee to hip height without leaning back.', equipmentMovement: 'Band stretches as the knee rises.',
    instructionMarkers: ['Stand tall', 'Lift from the hip', 'Alternate without swaying'],
  },
  'sumo-squat': {
    template: 'squat', bodyPosition: 'standing', cameraAngle: 'front',
    startPose: { ...STANDING, hip: 10 }, endPose: { ...STANDING, torso: 8, hip: 90, knee: 108, ankle: 20 },
    rangeOfMotion: 'Descend between a wide stance while knees follow the toes.', equipmentMovement: 'Optional load stays centered beneath the chest.',
    instructionMarkers: ['Set a wide stable stance', 'Track knees outward', 'Stand tall without snapping'],
  },
  'band-lateral-walk': {
    template: 'lateral-walk', bodyPosition: 'standing', cameraAngle: 'front',
    startPose: { ...STANDING, hip: 28, knee: 30 }, endPose: { ...STANDING, hip: 36, knee: 34 },
    rangeOfMotion: 'Take controlled side steps while keeping band tension.', equipmentMovement: 'Band remains tensioned as the feet separate and follow.',
    instructionMarkers: ['Stay in an athletic stance', 'Step from the hip', 'Keep toes facing ahead'],
  },
};

function configFor(exercise: Exercise): ExerciseAnimationConfig {
  const motion = MOTIONS[exercise.slug];
  if (!motion) {
    throw new Error(`Missing animation definition for ${exercise.slug}`);
  }

  return {
    exerciseId: exercise.id,
    slug: exercise.slug,
    movementCategory: exercise.movementPattern,
    equipment: exercise.equipment,
    tempo: '2-1-2 controlled',
    repetitionDurationMs: exercise.demoStyle === 'core' ? 3600 : 3000,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    safetyConstraints: exercise.safetyTips.slice(0, 2),
    breathingCue: exercise.breathing,
    fallbackAnimation: 'supported-fallback',
    ...motion,
  };
}

export const EXERCISE_ANIMATIONS: ExerciseAnimationConfig[] = EXERCISES.map(configFor);

export const ANIMATION_BY_EXERCISE_ID = Object.fromEntries(
  EXERCISE_ANIMATIONS.map((animation) => [animation.exerciseId, animation]),
) as Record<string, ExerciseAnimationConfig>;

export const ANIMATION_BY_SLUG = Object.fromEntries(
  EXERCISE_ANIMATIONS.map((animation) => [animation.slug, animation]),
) as Record<string, ExerciseAnimationConfig>;

export function getExerciseAnimation(exercise: { id?: string; slug?: string; name: string }): ExerciseAnimationConfig | null {
  if (exercise.id && ANIMATION_BY_EXERCISE_ID[exercise.id]) return ANIMATION_BY_EXERCISE_ID[exercise.id];
  if (exercise.slug && ANIMATION_BY_SLUG[exercise.slug]) return ANIMATION_BY_SLUG[exercise.slug];
  const catalogExercise = EXERCISES.find((item) => item.name.toLowerCase() === exercise.name.toLowerCase());
  return catalogExercise ? ANIMATION_BY_EXERCISE_ID[catalogExercise.id] : null;
}

export function validateExerciseAnimations(): string[] {
  const issues: string[] = [];
  for (const exercise of EXERCISES) {
    const animation = ANIMATION_BY_EXERCISE_ID[exercise.id];
    if (!animation) {
      issues.push(`${exercise.slug}: missing animation mapping`);
      continue;
    }
    if (!animation.startPose || !animation.endPose) issues.push(`${exercise.slug}: missing start or end pose`);
    if (!animation.primaryMuscles.length) issues.push(`${exercise.slug}: missing primary muscle mapping`);
    if (!animation.template) issues.push(`${exercise.slug}: missing motion template`);
    if (animation.repetitionDurationMs < 1200) issues.push(`${exercise.slug}: repetition duration is unsafe or unreadable`);
  }
  return issues;
}
