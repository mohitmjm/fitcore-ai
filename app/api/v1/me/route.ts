import { buildContext } from '@/lib/auth/context';
import { fail, privateOk } from '@/lib/core/http';
import { UsersService } from '@/lib/services/users/users.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns whether the signed-in user has completed onboarding. Drives the first-run redirect. */
export async function GET() {
  try {
    const ctx = await buildContext('web');
    const user = await UsersService.getByClerkId(ctx.clerkUserId);
    const onboarded = !!(user?.onboardingCompletedAt || user?.profile?.goal);
    return privateOk({ onboarded, role: ctx.role, plan: ctx.plan, name: user?.name ?? null });
  } catch (e) {
    return fail(e);
  }
}
