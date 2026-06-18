import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { recordLog } from '@/lib/services/logging/logging.service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const data = await recordLog(ctx, await req.json());
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
