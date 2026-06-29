import { ok, fail } from '@/lib/core/http';
import { ExerciseService } from '@/lib/services/exercises/exercise.service';
import type { ExerciseDifficulty } from '@/lib/services/exercises/types';

export const runtime = 'nodejs';

function asDifficulty(value: string | null): ExerciseDifficulty | 'all' | undefined {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'all') {
    return value;
  }
  return undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const exercises = await ExerciseService.list({
      query: url.searchParams.get('q') ?? undefined,
      muscle: url.searchParams.get('muscle') ?? undefined,
      equipment: url.searchParams.get('equipment') ?? undefined,
      difficulty: asDifficulty(url.searchParams.get('difficulty')),
    });
    return ok({ exercises });
  } catch (e) {
    return fail(e);
  }
}
