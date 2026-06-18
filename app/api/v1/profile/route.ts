import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { ProfileService } from '@/lib/services/profile/profile.service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await buildContext('web');
    const profile = await ProfileService.get(ctx.clerkUserId);
    return ok(profile);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await buildContext('web');
    await ProfileService.update(ctx, await req.json());
    return ok({ saved: true });
  } catch (e) {
    return fail(e);
  }
}
