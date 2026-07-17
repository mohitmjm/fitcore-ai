import { buildContext } from '@/lib/auth/context';
import { fail, ok } from '@/lib/core/http';
import { ReadinessService } from '@/lib/services/readiness/readiness.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    return ok(await ReadinessService.getToday(ctx));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    return ok(await ReadinessService.save(ctx, await req.json()));
  } catch (error) {
    return fail(error);
  }
}
