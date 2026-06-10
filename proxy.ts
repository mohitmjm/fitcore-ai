import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",              // landing / marketing page
  "/welcome(.*)",   // legacy welcome page
  "/login(.*)",     // auth page
  "/api/auth/(.*)", // auth API routes
]);

// clerkMiddleware returns a Next.js-compatible function.
// In Next.js 16 the file must export a named "proxy" function.
export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // Unauthenticated user hits a protected route → redirect to login
  if (!userId && !isPublicRoute(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static assets and Next.js internals
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js)).*)",
    "/(api|trpc)(.*)",
  ],
};
