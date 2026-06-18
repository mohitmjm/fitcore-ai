import { buildContext } from '@/lib/auth/context';
import { ok, fail } from '@/lib/core/http';
import { completeOnboarding } from '@/lib/services/onboarding/onboarding.service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const data = await completeOnboarding(ctx, await req.json());
    return ok(data);
  } catch (e) {
    return fail(e);
  }
}
