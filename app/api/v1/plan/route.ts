import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { AppError } from '@/lib/core/errors';
import { PlanService } from '@/lib/services/plan/plan.service';
import { UsersService } from '@/lib/services/users/users.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    const today = new Date().toISOString().slice(0, 10);
    const [plan, completions] = await Promise.all([
      PlanService.getCurrent(ctx.clerkUserId),
      PlanService.getCompletions(ctx.clerkUserId, today),
    ]);
    return ok({ plan, completions, today });
  } catch (e) {
    return fail(e);
  }
}

/** Regenerate the Living Plan from the user's stored profile. */
export async function POST() {
  try {
    const ctx = await buildContext('web');
    const user = await UsersService.getByClerkId(ctx.clerkUserId);
    const plan = await PlanService.generate(ctx.clerkUserId, {
      goal: user?.profile?.goal,
      experience: user?.profile?.experience,
      equipment: user?.profile?.equipment,
    });
    return ok(plan);
  } catch (e) {
    return fail(e);
  }
}

/** Toggle exercise completion for a date. */
export async function PATCH(req: Request) {
  try {
    const ctx = await buildContext('web');
    const body = (await req.json()) as { exerciseName?: string; date?: string; done?: boolean };
    if (!body.exerciseName) throw new AppError('VALIDATION', 'exerciseName is required', 422);
    await PlanService.setCompletion(ctx, {
      exerciseName: body.exerciseName,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      done: !!body.done,
    });
    return ok({ saved: true });
  } catch (e) {
    return fail(e);
  }
}
