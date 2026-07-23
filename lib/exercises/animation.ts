import type { Exercise, MuscleId } from './types';

export const RIG_JOINTS = ['torso', 'pelvis', 'leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm', 'leftThigh', 'rightThigh', 'leftShin', 'rightShin'] as const;
export type JointName = typeof RIG_JOINTS[number];
export type JointTransform = { rotation?: number; translateX?: number; translateY?: number; scaleX?: number; scaleY?: number; opacity?: number };
export type JointValue = number | JointTransform;
export type JointPose = Partial<Record<JointName, JointValue>>;
export type EquipmentId = 'floor' | 'mat' | 'bench' | 'incline-bench' | 'upright-bench' | 'dumbbell' | 'dumbbells' | 'kettlebell' | 'barbell' | 'resistance-band' | 'cable-machine';
export type ExercisePosture = 'standing' | 'incline' | 'seated' | 'prone' | 'supine' | 'side' | 'quadruped' | 'row' | 'hip-thrust';
export type RigView = 'front' | 'side' | 'three-quarter' | 'floor-side' | 'floor-three-quarter';
export interface AnimationViewport { viewBox: string; scale: number; offsetX: number; offsetY: number; }
export interface ExerciseAnimation { id: string; slug: string; posture: ExercisePosture; rigView: RigView; compactViewport: AnimationViewport; fullViewport: AnimationViewport; duration: number; phases: string[]; primaryMuscles: MuscleId[]; secondaryMuscles: MuscleId[]; equipment: EquipmentId[]; frames: Array<{ progress: number; pose: JointPose }>; reducedMotionFrames: JointPose[]; isometric?: boolean; }
const stand: JointPose = { torso: 0, pelvis: 0, leftUpperArm: 8, rightUpperArm: -8, leftForearm: 0, rightForearm: 0, leftThigh: 3, rightThigh: -3, leftShin: 0, rightShin: 0 };
const rigViews: Record<string, RigView> = {
  'incline-dumbbell-press': 'three-quarter',
  'push-up': 'floor-side',
  'seated-dumbbell-shoulder-press': 'three-quarter',
  'seated-wrist-curl': 'three-quarter',
  'dead-bug': 'floor-three-quarter',
  'reverse-crunch': 'floor-three-quarter',
  'side-plank': 'floor-side',
  'one-arm-dumbbell-row': 'side',
  'bird-dog': 'floor-three-quarter',
  'hip-thrust': 'floor-side',
  'dumbbell-romanian-deadlift': 'side',
};
const viewport = (viewBox: string, scale = 1, offsetX = 0, offsetY = 0): AnimationViewport => ({ viewBox, scale, offsetX, offsetY });
const viewportsFor = (slug: string, view: RigView) => {
  if (slug === 'push-up') return { compactViewport: viewport('0 18 280 215', 1), fullViewport: viewport('0 8 280 235', 1) };
  if (slug === 'hip-thrust') return { compactViewport: viewport('0 30 280 230', 1), fullViewport: viewport('0 10 280 260', 1) };
  if (slug === 'side-plank') return { compactViewport: viewport('0 42 280 205', 1.02), fullViewport: viewport('0 20 280 245', 1) };
  if (slug === 'incline-dumbbell-press') return { compactViewport: viewport('-10 15 285 325', 1), fullViewport: viewport('-10 -5 285 340', 1) };
  if (slug === 'goblet-squat' || slug === 'sumo-squat') return { compactViewport: viewport('8 0 244 320', 1), fullViewport: viewport('0 0 260 320', 1) };
  if (view === 'floor-three-quarter') return { compactViewport: viewport('-5 30 290 225', 1), fullViewport: viewport('-10 10 300 260', 1) };
  return { compactViewport: viewport('18 0 224 292', .98), fullViewport: viewport('0 0 260 300', 1) };
};
const define = (slug: string, duration: number, phases: string[], primaryMuscles: MuscleId[], secondaryMuscles: MuscleId[], equipment: EquipmentId[], active: JointPose, setup: JointPose = stand, isometric = false, posture: ExercisePosture = 'standing'): ExerciseAnimation => {
  const rigView = rigViews[slug] ?? 'front';
  return { id: `svg-${slug}`, slug, posture, rigView, ...viewportsFor(slug, rigView), duration, phases, primaryMuscles, secondaryMuscles, equipment, isometric, frames: [{ progress: 0, pose: setup }, { progress: .42, pose: active }, { progress: .55, pose: active }, { progress: 1, pose: setup }], reducedMotionFrames: [setup, active] };
};
const floor = (pose: JointPose): JointPose => ({ ...stand, ...pose });
const seatedNeutral: JointPose = { ...stand, leftThigh: 68, rightThigh: -68, leftShin: -68, rightShin: 68 };
const pressSetup: JointPose = { ...seatedNeutral, leftUpperArm: 88, rightUpperArm: -88, leftForearm: 84, rightForearm: -84 };
const plankSetup: JointPose = floor({ torso: 18, pelvis: 0, leftUpperArm: 0, rightUpperArm: 0, leftForearm: 0, rightForearm: 0, leftThigh: 18, rightThigh: 16, leftShin: 0, rightShin: 0 });
const plankBottom: JointPose = floor({ torso: 18, pelvis: { rotation: 0, translateY: 19 }, leftUpperArm: 60, rightUpperArm: 56, leftForearm: -60, rightForearm: -56, leftThigh: 8, rightThigh: 6, leftShin: 0, rightShin: 0 });
const quadrupedSetup: JointPose = floor({ torso: 0, pelvis: 0, leftUpperArm: 0, rightUpperArm: 0, leftForearm: 0, rightForearm: 0, leftThigh: 88, rightThigh: 82, leftShin: -88, rightShin: -82 });
const sidePlankSetup: JointPose = floor({ torso: 0, pelvis: 0, leftUpperArm: -165, rightUpperArm: 0, leftForearm: 0, rightForearm: 0, leftThigh: 3, rightThigh: 0, leftShin: 0, rightShin: 0 });
const inclineSetup: JointPose = { ...stand, leftUpperArm: 10, rightUpperArm: -80, leftForearm: 128, rightForearm: -142, leftThigh: 32, rightThigh: 18, leftShin: -24, rightShin: -12 };
const inclineLockout: JointPose = { ...inclineSetup, leftUpperArm: 128, rightUpperArm: 148, leftForearm: 0, rightForearm: 0 };
const rowSetup: JointPose = { ...stand, torso: 60, pelvis: -10, leftUpperArm: -60, rightUpperArm: -60, leftForearm: { rotation: 0, scaleY: 1.18 }, rightForearm: 0, leftThigh: 7, rightThigh: -7 };

export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimation> = {
  'incline-dumbbell-press': define('incline-dumbbell-press', 2900, ['Set on bench', 'Lower', 'Press inward', 'Lock out'], ['upper-chest', 'chest'], ['front-deltoids', 'triceps'], ['incline-bench', 'dumbbells'], inclineLockout, inclineSetup, false, 'incline'),
  'push-up': define('push-up', 2600, ['Plank', 'Lower together', 'Press floor', 'Finish'], ['chest'], ['triceps', 'front-deltoids', 'upper-abs'], ['floor'], plankBottom, plankSetup, false, 'prone'),
  'seated-dumbbell-shoulder-press': define('seated-dumbbell-shoulder-press', 2700, ['Seated set', 'Press overhead', 'Pause', 'Lower'], ['shoulders', 'front-deltoids'], ['side-deltoids', 'triceps'], ['upright-bench', 'dumbbells'], { ...seatedNeutral, leftUpperArm: 156, rightUpperArm: -156, leftForearm: 4, rightForearm: -4 }, pressSetup, false, 'seated'),
  'dumbbell-lateral-raise': define('dumbbell-lateral-raise', 2500, ['Arms down', 'Raise arc', 'Shoulder height', 'Lower'], ['side-deltoids'], ['shoulders', 'traps'], ['dumbbells'], { leftUpperArm: 92, rightUpperArm: -92, leftForearm: 8, rightForearm: -8 }),
  'band-reverse-fly': define('band-reverse-fly', 2500, ['Band set', 'Pull apart', 'Retract', 'Return'], ['rear-deltoids', 'upper-back'], ['traps'], ['resistance-band'], { leftUpperArm: 86, rightUpperArm: -86, leftForearm: 3, rightForearm: -3 }),
  'alternating-dumbbell-curl': define('alternating-dumbbell-curl', 3000, ['Arms long', 'Left curl', 'Switch', 'Right curl'], ['biceps'], ['forearms'], ['dumbbells'], { leftUpperArm: 8, rightUpperArm: -8, leftForearm: -128, rightForearm: -12 }),
  'overhead-dumbbell-triceps-extension': define('overhead-dumbbell-triceps-extension', 2600, ['Overhead set', 'Bend elbows', 'Extend', 'Finish'], ['triceps'], ['shoulders'], ['dumbbell'], { leftUpperArm: -150, rightUpperArm: 150, leftForearm: 122, rightForearm: -122 }),
  'seated-wrist-curl': define('seated-wrist-curl', 2200, ['Forearms set', 'Lower wrist', 'Curl wrist', 'Reset'], ['forearms'], [], ['bench', 'dumbbells'], { ...seatedNeutral, torso: 10, leftUpperArm: -62, rightUpperArm: 62, leftForearm: 38, rightForearm: -38 }, { ...seatedNeutral, torso: 10, leftUpperArm: -62, rightUpperArm: 62, leftForearm: 18, rightForearm: -18 }, false, 'seated'),
  'dead-bug': define('dead-bug', 3100, ['Brace', 'Opposite reach', 'Hold', 'Return'], ['upper-abs', 'lower-abs'], ['hip-flexors'], ['mat'], floor({ leftUpperArm: 92, rightUpperArm: 148, leftForearm: 0, rightForearm: 0, leftThigh: 4, rightThigh: 82, leftShin: 0, rightShin: -82 }), floor({ leftUpperArm: 148, rightUpperArm: 148, leftForearm: 0, rightForearm: 0, leftThigh: 82, rightThigh: 82, leftShin: -82, rightShin: -82 }), false, 'supine'),
  'reverse-crunch': define('reverse-crunch', 2700, ['Set knees', 'Pelvic curl', 'Small lift', 'Lower'], ['lower-abs'], ['upper-abs', 'hip-flexors'], ['mat'], floor({ pelvis: -12, leftThigh: 108, rightThigh: 96, leftShin: -80, rightShin: -72 }), floor({ leftThigh: 78, rightThigh: 72, leftShin: -72, rightShin: -66 }), false, 'supine'),
  'side-plank': define('side-plank', 3600, ['Elbow set', 'Lift hips', 'Breathe', 'Hold'], ['obliques'], ['abductors', 'shoulders'], ['mat'], { ...sidePlankSetup, pelvis: -5 }, sidePlankSetup, true, 'side'),
  'dumbbell-shrug': define('dumbbell-shrug', 2200, ['Arms long', 'Elevate', 'Squeeze', 'Lower'], ['traps'], ['forearms'], ['dumbbells'], { leftUpperArm: -8, rightUpperArm: 8 }),
  'one-arm-dumbbell-row': define('one-arm-dumbbell-row', 2700, ['Bench support', 'Hang', 'Row elbow', 'Lower'], ['lats', 'upper-back'], ['biceps', 'rear-deltoids'], ['bench', 'dumbbell'], { ...rowSetup, rightUpperArm: 60, rightForearm: -100 }, rowSetup, false, 'row'),
  'neutral-grip-lat-pulldown': define('neutral-grip-lat-pulldown', 2800, ['Overhead stretch', 'Pull elbows', 'Upper chest', 'Return'], ['lats'], ['biceps', 'upper-back'], ['cable-machine'], { ...seatedNeutral, leftUpperArm: 78, rightUpperArm: -78, leftForearm: -34, rightForearm: 34 }, { ...seatedNeutral, leftUpperArm: 156, rightUpperArm: -156, leftForearm: 0, rightForearm: 0 }, false, 'seated'),
  'bird-dog': define('bird-dog', 3100, ['Quadruped', 'Opposite reach', 'Hold level', 'Return'], ['lower-back'], ['glutes', 'upper-abs'], ['mat'], { ...quadrupedSetup, leftUpperArm: 88, leftForearm: 0, rightThigh: 0, rightShin: 0 }, quadrupedSetup, false, 'quadruped'),
  'hip-thrust': define('hip-thrust', 2800, ['Bench set', 'Drive hips', 'Glute squeeze', 'Lower'], ['glutes'], ['hamstrings', 'lower-back'], ['bench', 'barbell'], floor({ torso: 0, pelvis: -6, leftThigh: 42, rightThigh: 38, leftShin: 52, rightShin: 56, leftUpperArm: 8, rightUpperArm: 6 }), floor({ torso: 10, pelvis: 8, leftThigh: 48, rightThigh: 44, leftShin: 48, rightShin: 52 }), false, 'hip-thrust'),
  'goblet-squat': define('goblet-squat', 2800, ['Tall set', 'Sit down', 'Bottom', 'Stand'], ['quadriceps'], ['glutes', 'adductors', 'upper-abs'], ['kettlebell'], { torso: 4, pelvis: { rotation: 0, translateY: 42 }, leftThigh: 45, rightThigh: -45, leftShin: -45, rightShin: 45, leftUpperArm: -38, rightUpperArm: 38, leftForearm: -55, rightForearm: 55 }, { ...stand, leftUpperArm: -30, rightUpperArm: 30, leftForearm: -58, rightForearm: 58 }),
  'dumbbell-romanian-deadlift': define('dumbbell-romanian-deadlift', 2800, ['Tall set', 'Hips back', 'Hamstring stretch', 'Stand'], ['hamstrings'], ['glutes', 'lower-back', 'forearms'], ['dumbbells'], { torso: 46, pelvis: -12, leftThigh: 12, rightThigh: -12, leftShin: -8, rightShin: 8 }),
  'standing-calf-raise': define('standing-calf-raise', 2200, ['Feet set', 'Rise toes', 'Pause top', 'Lower'], ['calves'], [], ['floor'], { leftShin: -14, rightShin: 14 }),
  'banded-hip-flexor-march': define('banded-hip-flexor-march', 2600, ['Tall set', 'Lift knee', 'Band tension', 'Lower'], ['hip-flexors'], ['upper-abs', 'glutes'], ['resistance-band'], { leftThigh: -88, leftShin: 44, rightThigh: -3 }),
  'sumo-squat': define('sumo-squat', 2800, ['Wide stance', 'Lower between', 'Bottom', 'Stand'], ['adductors', 'quadriceps'], ['glutes'], ['dumbbell'], { torso: 4, pelvis: { rotation: 0, translateY: 12 }, leftThigh: 58, rightThigh: -58, leftShin: -38, rightShin: 38, leftUpperArm: -42, rightUpperArm: 42, leftForearm: -18, rightForearm: 18 }, { ...stand, leftUpperArm: -20, rightUpperArm: 20, leftForearm: -20, rightForearm: 20 }),
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
