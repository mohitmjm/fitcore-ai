import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { EXERCISE_ANIMATIONS, FALLBACK_ANIMATION, RIG_JOINTS, getExerciseAnimation, interpolatePose, transformFor } from './animation';

describe('exercise SVG animation catalogue', () => {
  it('has one exact animation for every catalogue exercise', () => {
    expect(EXERCISES.map((exercise) => exercise.slug).sort()).toEqual(Object.keys(EXERCISE_ANIMATIONS).sort());
  });

  it('uses only joints supported by the nested SVG rig', () => {
    for (const animation of Object.values(EXERCISE_ANIMATIONS)) {
      for (const frame of animation.frames) expect(Object.keys(frame.pose).every((joint) => RIG_JOINTS.includes(joint as typeof RIG_JOINTS[number]))).toBe(true);
    }
  });

  it('gives every known exercise a visible movement away from setup', () => {
    for (const animation of Object.values(EXERCISE_ANIMATIONS)) {
      const setup = JSON.stringify(animation.frames[0].pose);
      expect(animation.frames.some((frame) => JSON.stringify(frame.pose) !== setup)).toBe(true);
      expect(animation.phases.length).toBeGreaterThan(1);
    }
  });

  it('interpolates transforms without snapping and preserves defaults', () => {
    const animation = EXERCISE_ANIMATIONS['goblet-squat'];
    const pose = interpolatePose(animation, 0.21);
    const pelvis = transformFor(pose.pelvis);
    expect(pelvis.rotation).toBeGreaterThan(0);
    expect(pelvis.scaleX).toBe(1);
  });

  it('uses the labelled safe fallback only for an unknown slug', () => {
    expect(getExerciseAnimation({ slug: 'not-a-real-exercise' })).toBe(FALLBACK_ANIMATION);
    expect(getExerciseAnimation({ slug: 'push-up' })).toBe(EXERCISE_ANIMATIONS['push-up']);
  });

  it('provides renderable equipment metadata for every animation', () => {
    const supportedEquipment = new Set(['floor', 'mat', 'bench', 'incline-bench', 'upright-bench', 'dumbbell', 'dumbbells', 'kettlebell', 'barbell', 'resistance-band', 'cable-machine']);
    for (const animation of Object.values(EXERCISE_ANIMATIONS)) expect(animation.equipment.every((item) => supportedEquipment.has(item))).toBe(true);
  });
});
