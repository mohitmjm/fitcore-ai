import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { EQUIPMENT_OPTIONS } from '@/lib/exercises/catalog';
import { MUSCLES } from '@/lib/exercises/muscles';
import type { ExerciseCategory, ExerciseDifficulty, ExerciseLocation, MuscleId } from '@/lib/exercises/types';
import { ExerciseService } from '@/lib/services/exercises/exercise.service';

export const runtime = 'nodejs';

function listParam(params: URLSearchParams, key: string): string[] | undefined {
  const values = params.getAll(key).flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean);
  return values.length ? values : undefined;
}

export async function GET(req: Request) {
  try {
    await buildContext('web');
    const params = new URL(req.url).searchParams;
    const page = Math.max(1, Number(params.get('page') ?? 1));
    const limit = Math.min(48, Math.max(1, Number(params.get('limit') ?? 24)));
    const items = ExerciseService.list({
      search: params.get('search') ?? undefined,
      muscles: listParam(params, 'muscle') as MuscleId[] | undefined,
      equipment: listParam(params, 'equipment'),
      difficulty: listParam(params, 'difficulty') as ExerciseDifficulty[] | undefined,
      category: listParam(params, 'category') as ExerciseCategory[] | undefined,
      location: (params.get('location') ?? undefined) as ExerciseLocation | undefined,
      trainingType: (params.get('type') ?? undefined) as 'compound' | 'isolation' | undefined,
    });
    const start = (page - 1) * limit;
    return ok({
      items: items.slice(start, start + limit),
      total: items.length,
      page,
      hasMore: start + limit < items.length,
      filters: { muscles: MUSCLES, equipment: EQUIPMENT_OPTIONS },
    });
  } catch (error) {
    return fail(error);
  }
}
