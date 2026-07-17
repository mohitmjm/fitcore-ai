import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { WorkoutFeedbackService } from '@/lib/services/workouts/feedback.service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ctx = await buildContext('web');
    return ok(await WorkoutFeedbackService.save(ctx, await request.json()));
  } catch (error) {
    return fail(error);
  }
}
