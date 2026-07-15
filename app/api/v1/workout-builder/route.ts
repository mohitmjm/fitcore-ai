import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { WorkoutBuilderService } from '@/lib/services/exercises/workout-builder.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    return ok({ workout: await WorkoutBuilderService.getToday(ctx.clerkUserId) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const workout = await WorkoutBuilderService.addExercise(ctx.clerkUserId, await req.json());
    return ok({ workout }, 201);
  } catch (error) {
    return fail(error);
  }
}
