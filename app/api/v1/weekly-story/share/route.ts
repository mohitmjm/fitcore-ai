import { buildContext } from '@/lib/auth/context';
import { privateOk, fail } from '@/lib/core/http';
import { enforceRateLimit } from '@/lib/core/rate-limit';
import { StoryShareEventSchema } from '@/lib/services/weekly-story/schemas';
import { WeeklyStoryService } from '@/lib/services/weekly-story/weekly-story.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    await enforceRateLimit(`weekly-story:share:${ctx.clerkUserId}`, 30, 60 * 60 * 1000);
    const input = StoryShareEventSchema.parse(await req.json());
    await WeeklyStoryService.recordShare(ctx, input.snapshotId, input.action, input.configuration);
    return privateOk({ recorded: true });
  } catch (error) {
    return fail(error);
  }
}
