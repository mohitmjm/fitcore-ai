import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { DietService } from '@/lib/services/diet/diet.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    const plan = await DietService.getCurrent(ctx.clerkUserId);
    return ok(plan);
  } catch (e) {
    return fail(e);
  }
}

/** Regenerate the 7-day meal plan from the user's stored diet preferences. */
export async function POST() {
  try {
    const ctx = await buildContext('web');
    const plan = await DietService.generate(ctx.clerkUserId);
    return ok(plan);
  } catch (e) {
    return fail(e);
  }
}
