import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { WorldService } from '@/lib/services/world/world.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    return ok(await WorldService.get(ctx));
  } catch (error) {
    return fail(error);
  }
}
