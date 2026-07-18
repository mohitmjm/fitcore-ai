import { buildContext } from '@/lib/auth/context';
import { privateOk, fail } from '@/lib/core/http';
import { StoryViewedSchema } from '@/lib/services/weekly-story/schemas';
import { WeeklyStoryService } from '@/lib/services/weekly-story/weekly-story.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const input = StoryViewedSchema.parse(await req.json());
    await WeeklyStoryService.markViewed(ctx, input.snapshotId);
    return privateOk({ viewed: true });
  } catch (error) {
    return fail(error);
  }
}
