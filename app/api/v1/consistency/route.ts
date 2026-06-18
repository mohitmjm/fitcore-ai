import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { ConsistencyService } from '@/lib/services/consistency/consistency.service';

export const runtime = 'nodejs';

/** GET /api/v1/consistency → streaks + 7d/28d consistency %, trend, momentum level. */
export async function GET() {
  try {
    const ctx = await buildContext('web');
    const data = await ConsistencyService.getSummary(ctx.clerkUserId);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
