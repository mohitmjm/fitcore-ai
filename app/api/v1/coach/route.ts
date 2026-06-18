import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { askCoach, getHistory, clearHistory } from '@/lib/services/coach/coach.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    const messages = await getHistory(ctx.clerkUserId);
    return ok({ messages });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const data = await askCoach(ctx, await req.json());
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE() {
  try {
    const ctx = await buildContext('web');
    await clearHistory(ctx.clerkUserId);
    return ok({ cleared: true });
  } catch (e) {
    return fail(e);
  }
}
