import { buildContext } from '@/lib/auth/context';
import { privateOk, fail } from '@/lib/core/http';
import { enforceRateLimit } from '@/lib/core/rate-limit';
import { GenerateWeeklyStorySchema } from '@/lib/services/weekly-story/schemas';
import { WeeklyStoryService } from '@/lib/services/weekly-story/weekly-story.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    await enforceRateLimit(`weekly-story:generate:${ctx.clerkUserId}`, 10, 10 * 60 * 1000);
    const input = GenerateWeeklyStorySchema.parse(await req.json().catch(() => ({})));
    const story = await WeeklyStoryService.generate(ctx, input);
    return privateOk({ story, status: story ? 'ready' : 'forming' });
  } catch (error) {
    return fail(error);
  }
}
