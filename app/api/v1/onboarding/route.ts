import { buildContext } from '@/lib/auth/context';
import { fail, privateOk } from '@/lib/core/http';
import { completeOnboarding } from '@/lib/services/onboarding/onboarding.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ctx = await buildContext('web');
    const data = await completeOnboarding(ctx, await req.json());
    return privateOk(data);
  } catch (e) {
    return fail(e);
  }
}
