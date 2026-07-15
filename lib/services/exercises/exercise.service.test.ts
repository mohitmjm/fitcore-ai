import { describe, expect, it } from 'vitest';
import { EXERCISES } from '@/lib/exercises/catalog';
import { ANATOMICAL_REGIONS, BODY_SILHOUETTES } from '@/lib/exercises/anatomy';
import { MUSCLES } from '@/lib/exercises/muscles';
import { ExerciseService } from './exercise.service';

describe('exercise catalog', () => {
  it('uses unique stable ids and slugs', () => {
    expect(new Set(EXERCISES.map((item) => item.id)).size).toBe(EXERCISES.length);
    expect(new Set(EXERCISES.map((item) => item.slug)).size).toBe(EXERCISES.length);
  });

  it('covers every selectable body-map muscle', () => {
    expect(MUSCLES.filter((muscle) => ExerciseService.list({ muscles: [muscle.id] }).length === 0)).toEqual([]);
  });

  it('ships front and back anatomy for both body types with mapped regions', () => {
    expect(Object.keys(BODY_SILHOUETTES).sort()).toEqual(['female-back', 'female-front', 'male-back', 'male-front']);
    const renderedRegionIds = Object.values(ANATOMICAL_REGIONS).flatMap((regions) => regions.map((region) => region.id));
    expect(renderedRegionIds.filter((muscle) => ExerciseService.list({ muscles: [muscle] }).length === 0)).toEqual([]);
  });

  it('ships complete scannable exercise guidance', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.instructions.length).toBeGreaterThanOrEqual(4);
      expect(exercise.formTips.length).toBeGreaterThanOrEqual(2);
      expect(exercise.commonMistakes.length).toBeGreaterThanOrEqual(2);
      expect(exercise.safetyTips.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('ExerciseService filters', () => {
  it('filters by selected muscle across primary and secondary muscles', () => {
    const results = ExerciseService.list({ muscles: ['triceps'] });
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((item) => [...item.primaryMuscles, ...item.secondaryMuscles].includes('triceps'))).toBe(true);
  });

  it('combines equipment, difficulty, and location filters', () => {
    const results = ExerciseService.list({ equipment: ['Bodyweight'], difficulty: ['beginner'], location: 'home' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.difficulty === 'beginner' && item.locations.includes('home'))).toBe(true);
  });

  it('searches names, descriptions, tags, and target muscles', () => {
    expect(ExerciseService.list({ search: 'posture' }).map((item) => item.slug)).toContain('band-reverse-fly');
    expect(ExerciseService.list({ search: 'romanian' }).map((item) => item.slug)).toContain('dumbbell-romanian-deadlift');
  });
});
