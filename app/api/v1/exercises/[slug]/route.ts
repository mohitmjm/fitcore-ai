import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { AppError } from '@/lib/core/errors';
import { ExerciseService } from '@/lib/services/exercises/exercise.service';

export const runtime = 'nodejs';

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    await buildContext('web');
    const { slug } = await context.params;
    const exercise = ExerciseService.getBySlug(slug);
    if (!exercise) throw new AppError('NOT_FOUND', 'Exercise not found', 404);
    const similar = ExerciseService.list({ muscles: exercise.primaryMuscles })
      .filter((item) => item.id !== exercise.id)
      .slice(0, 4);
    return ok({ exercise, similar });
  } catch (error) {
    return fail(error);
  }
}
