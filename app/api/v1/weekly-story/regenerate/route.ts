import { buildContext } from '@/lib/auth/context';
import { privateOk, fail } from '@/lib/core/http';
import { enforceRateLimit } from '@/lib/core/rate-limit';
import { RegenerateWeeklyStorySchema } from '@/lib/services/weekly-story/schemas';
import { WeeklyStoryService } from '@/lib/services/weekly-story/weekly-story.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    await enforceRateLimit(`weekly-story:regenerate:${ctx.clerkUserId}`, 3, 60 * 60 * 1000);
    const input = RegenerateWeeklyStorySchema.parse(await req.json().catch(() => ({})));
    const story = await WeeklyStoryService.generate(ctx, { ...input, force: true });
    return privateOk({ story, status: story ? 'ready' : 'forming' });
  } catch (error) {
    return fail(error);
  }
}
