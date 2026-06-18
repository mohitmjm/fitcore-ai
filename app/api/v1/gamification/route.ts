import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { GamificationService } from '@/lib/services/gamification/gamification.service';

export const runtime = 'nodejs';

/** GET /api/v1/gamification → xp, level, level title, progress to next level, badges. */
export async function GET() {
  try {
    const ctx = await buildContext('web');
    const data = await GamificationService.getSummary(ctx.clerkUserId);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
