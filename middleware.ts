import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

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
