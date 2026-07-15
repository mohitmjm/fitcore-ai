import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { ExerciseService } from '@/lib/services/exercises/exercise.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    return ok({ ids: await ExerciseService.getSavedIds(ctx.clerkUserId) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const input = await req.json();
    await ExerciseService.save(ctx.clerkUserId, input);
    return ok({ saved: true });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await buildContext('web');
    const input = await req.json();
    await ExerciseService.unsave(ctx.clerkUserId, input);
    return ok({ saved: false });
  } catch (error) {
    return fail(error);
  }
}
