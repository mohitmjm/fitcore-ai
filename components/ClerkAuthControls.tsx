'use client';

import { usePathname } from 'next/navigation';
import {
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/nextjs';

/**
 * Clerk auth controls, rendered fixed top-right on the in-app pages.
 *
 * Hidden on pages that already provide their own auth entry points — the marketing landing
 * (its nav has Sign in / Get started), Clerk's own /sign-in & /sign-up pages, and the /welcome
 * onboarding — to avoid duplicate sign-in buttons. On app pages it shows the signed-in account
 * menu (UserButton), complementing the sidebar.
 */
const HIDE_EXACT = ['/', '/login', '/welcome'];

function shouldHide(pathname: string): boolean {
  return (
    HIDE_EXACT.includes(pathname) ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up')
  );
}

export default function ClerkAuthControls() {
  const pathname = usePathname();
  if (shouldHide(pathname)) return null;

  return (
    <div className="fixed top-3 right-3 z-[60] flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal" forceRedirectUrl="/today">
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 border border-cyan-500/30 bg-[#0b0e14]/80 hover:bg-[#0b0e14] hover:border-cyan-400/60 transition-all">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl="/welcome">
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-all">
            Sign up
          </button>
        </SignUpButton>
      </SignedOut>
    </div>
  );
}
