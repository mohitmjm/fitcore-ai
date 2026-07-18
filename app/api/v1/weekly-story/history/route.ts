import { buildContext } from '@/lib/auth/context';
import { privateOk, fail } from '@/lib/core/http';
import { StoryHistoryQuerySchema } from '@/lib/services/weekly-story/schemas';
import { WeeklyStoryService } from '@/lib/services/weekly-story/weekly-story.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ctx = await buildContext('web');
    const query = StoryHistoryQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    return privateOk(await WeeklyStoryService.history(ctx, query.limit, query.cursor));
  } catch (error) {
    return fail(error);
  }
}
