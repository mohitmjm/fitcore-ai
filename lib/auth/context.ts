import { auth } from '@clerk/nextjs/server';
import { Errors } from '@/lib/core/errors';
import type { AuthContext, Source } from '@/lib/core/context';
import { UsersService } from '@/lib/services/users/users.service';

const DEV_USER_ID = 'dev-user';

/**
 * Build the AuthContext for a web/mobile request.
 *
 * - If Clerk is configured: reads the Clerk session; throws UNAUTHENTICATED if not signed in.
 * - If Clerk is NOT configured (e.g. local dev without keys): falls back to a stable dev
 *   identity so the product remains runnable offline.
 *
 * Role + plan are loaded from the persisted user profile (Supabase when configured).
 */
export async function buildContext(source: Source = 'web'): Promise<AuthContext> {
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  let clerkUserId: string;
  if (clerkConfigured) {
    const { userId } = await auth();
    if (!userId) throw Errors.unauthenticated();
    clerkUserId = userId;
  } else {
    clerkUserId = DEV_USER_ID;
  }

  const user = await UsersService.getByClerkId(clerkUserId);
  return {
    clerkUserId,
    role: user?.role ?? 'user',
    plan: user?.subscription?.plan ?? 'free',
    source,
  };
}
