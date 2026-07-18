import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { getToday } from '@/lib/services/today/today.service';
import type { CheckinInput } from '@/lib/services/today/types';
import { ReadinessService } from '@/lib/services/readiness/readiness.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    const data = await getToday(ctx);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const body = (await req.json().catch(() => ({}))) as { checkin?: CheckinInput };
    const readiness = body.checkin ? await ReadinessService.save(ctx, body.checkin) : null;
    const data = await getToday(ctx, readiness?.checkin);
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
