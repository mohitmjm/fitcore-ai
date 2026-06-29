'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';
import {
  BookOpen,
  Dumbbell,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  MessageSquare,
  Moon,
  Sun,
  Trophy,
  User,
  Utensils,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Today', href: '/today', icon: Home },
  { name: 'Workouts', href: '/workout', icon: Dumbbell },
  { name: 'Exercises', href: '/exercises', icon: BookOpen },
  { name: 'Diet', href: '/diet', icon: Utensils },
  { name: 'Progress', href: '/progress', icon: LineChart },
  { name: 'Awards', href: '/achievements', icon: Trophy },
  { name: 'Coach', href: '/chat', icon: MessageSquare },
  { name: 'Profile', href: '/profile', icon: User },
];

// Pages rendered WITHOUT the app shell (marketing, Clerk auth pages, onboarding).
const NO_SHELL = ['/', '/login', '/welcome'];
function isNoShell(pathname: string): boolean {
  return NO_SHELL.includes(pathname) || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
}

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setMounted(true);
    const stored = (typeof window !== 'undefined' ? localStorage.getItem('fitcore_theme') : null) as
      | 'dark'
      | 'light'
      | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('light', stored === 'light');
    }
  }, []);

  // First-run gate: signed in but no profile yet → lightweight onboarding.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || pathname === '/welcome') return;
    let active = true;
    fetch('/api/v1/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: { onboarded?: boolean } } | null) => {
        if (active && j?.data && !j.data.onboarded) router.replace('/welcome');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, pathname, router]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fitcore_theme', next);
    document.documentElement.classList.toggle('light', next === 'light');
  }

  // Plain render on marketing/auth/onboarding pages, before mount, or when signed out.
  if (!mounted || isNoShell(pathname) || !isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col" suppressHydrationWarning>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  const displayName = user?.firstName || user?.username || 'Athlete';

  return (
    <div className="flex min-h-screen flex-col md:flex-row" suppressHydrationWarning>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 fixed h-screen z-20">
        <div className="p-4 border-b border-white/5 flex items-center justify-center">
          <Link href="/today">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="FitCore AI" className="h-16 w-auto object-contain" />
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-white">
              {displayName[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-gray-200 truncate">{displayName}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center px-3 py-2 rounded-xl text-gray-400 hover:bg-white/5"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 text-xs font-semibold"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:pl-64 min-h-screen pb-20 md:pb-6">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-white/8 py-2.5 px-2 flex items-center gap-1 overflow-x-auto z-30">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[64px] flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl ${
                active ? 'text-cyan-400' : 'text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
