import type { Exercise, MuscleId } from './types';

export const RIG_JOINTS = ['torso', 'pelvis', 'leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm', 'leftThigh', 'rightThigh', 'leftShin', 'rightShin'] as const;
export type JointName = typeof RIG_JOINTS[number];
export type JointTransform = { rotation?: number; translateX?: number; translateY?: number; scaleX?: number; scaleY?: number; opacity?: number };
export type JointValue = number | JointTransform;
export type JointPose = Partial<Record<JointName, JointValue>>;
export type EquipmentId = 'floor' | 'mat' | 'bench' | 'incline-bench' | 'upright-bench' | 'dumbbell' | 'dumbbells' | 'kettlebell' | 'barbell' | 'resistance-band' | 'cable-machine';
export interface ExerciseAnimation { id: string; slug: string; duration: number; phases: string[]; primaryMuscles: MuscleId[]; secondaryMuscles: MuscleId[]; equipment: EquipmentId[]; frames: Array<{ progress: number; pose: JointPose }>; reducedMotionFrames: JointPose[]; isometric?: boolean; }
const stand: JointPose = { torso: 0, pelvis: 0, leftUpperArm: 8, rightUpperArm: -8, leftForearm: 0, rightForearm: 0, leftThigh: 3, rightThigh: -3, leftShin: 0, rightShin: 0 };
const define = (slug: string, duration: number, phases: string[], primaryMuscles: MuscleId[], secondaryMuscles: MuscleId[], equipment: EquipmentId[], active: JointPose, setup: JointPose = stand, isometric = false): ExerciseAnimation => ({ id: `svg-${slug}`, slug, duration, phases, primaryMuscles, secondaryMuscles, equipment, isometric, frames: [{ progress: 0, pose: setup }, { progress: .42, pose: active }, { progress: .55, pose: active }, { progress: 1, pose: setup }], reducedMotionFrames: [setup, active] });
const floor = (pose: JointPose): JointPose => ({ ...stand, torso: 86, pelvis: 86, ...pose });

export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimation> = {
  'incline-dumbbell-press': define('incline-dumbbell-press', 2900, ['Set on bench', 'Lower', 'Press inward', 'Lock out'], ['upper-chest', 'chest'], ['front-deltoids', 'triceps'], ['incline-bench', 'dumbbells'], { torso: 64, pelvis: 64, leftUpperArm: 118, rightUpperArm: -118, leftForearm: -35, rightForearm: 35, leftThigh: 48, rightThigh: -48 }),
  'push-up': define('push-up', 2600, ['Plank', 'Lower together', 'Press floor', 'Finish'], ['chest'], ['triceps', 'front-deltoids', 'upper-abs'], ['floor'], floor({ leftUpperArm: 118, rightUpperArm: -118, leftForearm: -48, rightForearm: 48, leftThigh: 86, rightThigh: -86 })),
  'seated-dumbbell-shoulder-press': define('seated-dumbbell-shoulder-press', 2700, ['Seated set', 'Press overhead', 'Pause', 'Lower'], ['shoulders', 'front-deltoids'], ['side-deltoids', 'triceps'], ['upright-bench', 'dumbbells'], { leftUpperArm: 42, rightUpperArm: -42, leftForearm: 18, rightForearm: -18, leftThigh: 90, rightThigh: -90 }),
  'dumbbell-lateral-raise': define('dumbbell-lateral-raise', 2500, ['Arms down', 'Raise arc', 'Shoulder height', 'Lower'], ['side-deltoids'], ['shoulders', 'traps'], ['dumbbells'], { leftUpperArm: 92, rightUpperArm: -92, leftForearm: 8, rightForearm: -8 }),
  'band-reverse-fly': define('band-reverse-fly', 2500, ['Band set', 'Pull apart', 'Retract', 'Return'], ['rear-deltoids', 'upper-back'], ['traps'], ['resistance-band'], { leftUpperArm: 86, rightUpperArm: -86, leftForearm: 3, rightForearm: -3 }),
  'alternating-dumbbell-curl': define('alternating-dumbbell-curl', 3000, ['Arms long', 'Left curl', 'Switch', 'Right curl'], ['biceps'], ['forearms'], ['dumbbells'], { leftUpperArm: 8, rightUpperArm: -8, leftForearm: -128, rightForearm: -12 }),
  'overhead-dumbbell-triceps-extension': define('overhead-dumbbell-triceps-extension', 2600, ['Overhead set', 'Bend elbows', 'Extend', 'Finish'], ['triceps'], ['shoulders'], ['dumbbell'], { leftUpperArm: 8, rightUpperArm: -8, leftForearm: 142, rightForearm: -142 }),
  'seated-wrist-curl': define('seated-wrist-curl', 2200, ['Forearms set', 'Lower wrist', 'Curl wrist', 'Reset'], ['forearms'], [], ['bench', 'dumbbells'], { torso: 16, leftUpperArm: 78, rightUpperArm: -78, leftForearm: 42, rightForearm: -42 }),
  'dead-bug': define('dead-bug', 3100, ['Brace', 'Opposite reach', 'Hold', 'Return'], ['upper-abs', 'lower-abs'], ['hip-flexors'], ['mat'], floor({ leftUpperArm: -128, rightUpperArm: 8, leftThigh: -132, rightThigh: 82 })),
  'reverse-crunch': define('reverse-crunch', 2700, ['Set knees', 'Pelvic curl', 'Small lift', 'Lower'], ['lower-abs'], ['upper-abs', 'hip-flexors'], ['mat'], floor({ pelvis: -22, leftThigh: -112, rightThigh: 112, leftShin: 35, rightShin: -35 })),
  'side-plank': define('side-plank', 3600, ['Elbow set', 'Lift hips', 'Breathe', 'Hold'], ['obliques'], ['abductors', 'shoulders'], ['mat'], floor({ torso: -18, pelvis: -18, leftThigh: 88, rightThigh: -88 }), floor({ torso: -12, pelvis: -12, leftThigh: 88, rightThigh: -88 }), true),
  'dumbbell-shrug': define('dumbbell-shrug', 2200, ['Arms long', 'Elevate', 'Squeeze', 'Lower'], ['traps'], ['forearms'], ['dumbbells'], { leftUpperArm: -8, rightUpperArm: 8 }),
  'one-arm-dumbbell-row': define('one-arm-dumbbell-row', 2700, ['Bench support', 'Hang', 'Row elbow', 'Lower'], ['lats', 'upper-back'], ['biceps', 'rear-deltoids'], ['bench', 'dumbbell'], { torso: 34, leftUpperArm: 36, rightUpperArm: -105, rightForearm: 72, leftThigh: 28, rightThigh: -28 }),
  'neutral-grip-lat-pulldown': define('neutral-grip-lat-pulldown', 2800, ['Overhead stretch', 'Pull elbows', 'Upper chest', 'Return'], ['lats'], ['biceps', 'upper-back'], ['cable-machine'], { leftUpperArm: 118, rightUpperArm: -118, leftForearm: -48, rightForearm: 48, leftThigh: 90, rightThigh: -90 }),
  'bird-dog': define('bird-dog', 3100, ['Quadruped', 'Opposite reach', 'Hold level', 'Return'], ['lower-back'], ['glutes', 'upper-abs'], ['mat'], floor({ leftUpperArm: -118, rightUpperArm: 35, leftThigh: -30, rightThigh: 118, rightShin: -18 })),
  'hip-thrust': define('hip-thrust', 2800, ['Bench set', 'Drive hips', 'Glute squeeze', 'Lower'], ['glutes'], ['hamstrings', 'lower-back'], ['bench', 'barbell'], { torso: 88, pelvis: 12, leftThigh: 48, rightThigh: -48, leftShin: -42, rightShin: 42 }),
  'goblet-squat': define('goblet-squat', 2800, ['Tall set', 'Sit down', 'Bottom', 'Stand'], ['quadriceps'], ['glutes', 'adductors', 'upper-abs'], ['kettlebell'], { torso: 15, pelvis: 15, leftThigh: 52, rightThigh: -52, leftShin: -32, rightShin: 32, leftUpperArm: 46, rightUpperArm: -46 }),
  'dumbbell-romanian-deadlift': define('dumbbell-romanian-deadlift', 2800, ['Tall set', 'Hips back', 'Hamstring stretch', 'Stand'], ['hamstrings'], ['glutes', 'lower-back', 'forearms'], ['dumbbells'], { torso: 46, pelvis: -12, leftThigh: 12, rightThigh: -12, leftShin: -8, rightShin: 8 }),
  'standing-calf-raise': define('standing-calf-raise', 2200, ['Feet set', 'Rise toes', 'Pause top', 'Lower'], ['calves'], [], ['floor'], { leftShin: -14, rightShin: 14 }),
  'banded-hip-flexor-march': define('banded-hip-flexor-march', 2600, ['Tall set', 'Lift knee', 'Band tension', 'Lower'], ['hip-flexors'], ['upper-abs', 'glutes'], ['resistance-band'], { leftThigh: -88, leftShin: 44, rightThigh: -3 }),
  'sumo-squat': define('sumo-squat', 2800, ['Wide stance', 'Lower between', 'Bottom', 'Stand'], ['adductors', 'quadriceps'], ['glutes'], ['dumbbell'], { torso: 8, pelvis: 16, leftThigh: 68, rightThigh: -68, leftShin: -42, rightShin: 42, leftUpperArm: 42, rightUpperArm: -42 }),
  'band-lateral-walk': define('band-lateral-walk', 3000, ['Athletic stance', 'Lead step', 'Trail step', 'Reverse'], ['abductors'], ['glutes', 'quadriceps'], ['resistance-band'], { pelvis: 14, leftThigh: 28, rightThigh: -48, leftShin: -12, rightShin: 24 }),
};
export const FALLBACK_ANIMATION: ExerciseAnimation = define('unknown', 1000, ['Animation not yet available'], [], [], [], stand, stand, true);
export function getExerciseAnimation(exercise: Partial<Pick<Exercise, 'slug'>>): ExerciseAnimation { return exercise.slug ? EXERCISE_ANIMATIONS[exercise.slug] ?? FALLBACK_ANIMATION : FALLBACK_ANIMATION; }

export function transformFor(value: JointValue | undefined): Required<JointTransform> {
  if (typeof value === 'number') return { rotation: value, translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, opacity: 1 };
  return { rotation: value?.rotation ?? 0, translateX: value?.translateX ?? 0, translateY: value?.translateY ?? 0, scaleX: value?.scaleX ?? 1, scaleY: value?.scaleY ?? 1, opacity: value?.opacity ?? 1 };
}

const ease = (value: number) => value * value * (3 - 2 * value);
const shortestAngle = (from: number, to: number) => ((to - from + 540) % 360) - 180;

export function interpolatePose(animation: ExerciseAnimation, progress: number): JointPose {
  const frames = animation.frames;
  const index = Math.max(1, frames.findIndex((frame) => frame.progress >= progress));
  const next = frames[index]; const previous = frames[index - 1];
  const ratio = ease(Math.max(0, Math.min(1, (progress - previous.progress) / (next.progress - previous.progress || 1))));
  return Object.fromEntries(RIG_JOINTS.map((joint) => {
    const from = transformFor(previous.pose[joint]); const to = transformFor(next.pose[joint]);
    return [joint, { rotation: from.rotation + shortestAngle(from.rotation, to.rotation) * ratio, translateX: from.translateX + (to.translateX - from.translateX) * ratio, translateY: from.translateY + (to.translateY - from.translateY) * ratio, scaleX: from.scaleX + (to.scaleX - from.scaleX) * ratio, scaleY: from.scaleY + (to.scaleY - from.scaleY) * ratio, opacity: from.opacity + (to.opacity - from.opacity) * ratio }];
  })) as JointPose;
}
