import { buildContext } from '@/lib/auth/context';
import { enforceRateLimit } from '@/lib/core/rate-limit';
import { fail, privateOk } from '@/lib/core/http';
import {
  DeleteWeeklyStorySchema,
  WeeklyStoryQuerySchema,
} from '@/lib/services/weekly-story/schemas';
import { WeeklyStoryService } from '@/lib/services/weekly-story/weekly-story.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ctx = await buildContext('web');
    const query = WeeklyStoryQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    if (query.preview === '1') return privateOk(await WeeklyStoryService.preview(ctx, query));
    await enforceRateLimit(`weekly-story:get:${ctx.clerkUserId}`, 30, 60 * 60 * 1000);
    const story = await WeeklyStoryService.get(ctx, query);
    return privateOk({ story, status: story ? 'ready' : 'forming' });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await buildContext('web');
    const input = DeleteWeeklyStorySchema.parse(await req.json());
    await WeeklyStoryService.delete(ctx, input.snapshotId);
    return privateOk({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}
