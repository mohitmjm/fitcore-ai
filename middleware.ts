import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Clerk authentication middleware (Next.js 15). Protects app routes; leaves marketing, the
 * Clerk auth pages, and API routes public. API routes under /api/v1 authenticate themselves
 * via buildContext() so they return a clean JSON 401 instead of a redirect.
 * See docs/architecture/07-clerk-auth.md.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/login',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

function localDevMiddleware() {
  return NextResponse.next();
}

// Keep the documented zero-credential local preview working. Production builds are expected to
// provide Clerk keys and therefore use the protected branch.
const localPreview = process.env.FITCORE_PREVIEW === '1';
export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !localPreview ? protectedMiddleware : localDevMiddleware;

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
    // Clerk auto-proxy path.
    '/__clerk/:path*',
  ],
};
