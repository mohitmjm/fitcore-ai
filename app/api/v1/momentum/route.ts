import { buildContext } from '@/lib/auth/context';
import { fail, privateOk } from '@/lib/core/http';
import { enforceRateLimit } from '@/lib/core/rate-limit';
import { MomentumService } from '@/lib/services/momentum/momentum.service';
import { CompleteMomentumQuestSchema, MomentumQuerySchema } from '@/lib/services/momentum/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ctx = await buildContext('web');
    const query = MomentumQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    return privateOk(await MomentumService.getState(ctx, query.timezone));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    await enforceRateLimit(`momentum:complete:${ctx.clerkUserId}`, 6, 60 * 60 * 1000);
    const input = CompleteMomentumQuestSchema.parse(await req.json());
    return privateOk(await MomentumService.complete(ctx, input.timezone, input.questId));
  } catch (error) {
    return fail(error);
  }
}
