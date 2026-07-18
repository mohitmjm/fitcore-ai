'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  Apple,
  BarChart3,
  Bot,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Flame,
  Home,
  LogOut,
  Moon,
  Orbit,
  Search,
  Settings,
  Sun,
  Zap,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  mobile?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Today', href: '/today', icon: Home, mobile: true },
  { name: 'Momentum', href: '/momentum', icon: Zap, mobile: true },
  { name: 'Explore', href: '/exercises', icon: Search, mobile: true },
  { name: 'Train', href: '/workout', icon: Dumbbell, mobile: true },
  { name: 'World', href: '/world', icon: Orbit },
  { name: 'AI Coach', href: '/chat', icon: Bot },
  { name: 'Nutrition', href: '/diet', icon: Apple },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
];

const NO_SHELL = ['/', '/login', '/welcome', '/story'];
function isNoShell(pathname: string): boolean {
  return NO_SHELL.includes(pathname) || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/today' && pathname.startsWith(`${href}/`));
}

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const shellVisible = !clerkConfigured || Boolean(isSignedIn);
  const appRoute = !isNoShell(pathname);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('fitcore_theme') as 'dark' | 'light' | null;
    const initial = stored ?? 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('light', initial === 'light');
  }, []);

  useEffect(() => {
    if (!clerkConfigured || !isLoaded || !isSignedIn || !appRoute) return;
    let active = true;
    fetch('/api/v1/me', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((json: { data?: { onboarded?: boolean } } | null) => {
        if (active && json?.data && !json.data.onboarded) router.replace('/welcome');
      })
      .catch(() => {});
    return () => { active = false; };
  }, [appRoute, clerkConfigured, isLoaded, isSignedIn, router]);

  const mobileItems = useMemo(() => [
    ...NAV_ITEMS.filter((item) => item.mobile),
    { name: 'Profile', href: '/profile', icon: CircleUserRound, mobile: true },
  ], []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fitcore_theme', next);
    document.documentElement.classList.toggle('light', next === 'light');
  }

  if (!mounted || !appRoute || !shellVisible) {
    return <div className="min-h-screen"><main>{children}</main></div>;
  }

  const displayName = user?.firstName || user?.username || 'Athlete';

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <Link href="/today" className="app-brand" aria-label="Fitcore AI home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" /><span><strong>FITCORE</strong><small>TRAIN SMARTER</small></span>
        </Link>

        <div className="sidebar-status">
          <span className="status-ring"><Flame /></span>
          <div><small>Current rhythm</small><strong>Ready to train</strong></div>
          <ChevronRight />
        </div>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <span className="nav-section-label">Your training</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return <Link key={item.href} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}><Icon /><span>{item.name}</span>{active && <i />}</Link>;
          })}
        </nav>

        <div className="sidebar-footer">
          <Link href="/profile" className={isActive(pathname, '/profile') ? 'profile-link active' : 'profile-link'}>
            <span className="profile-avatar">{displayName[0]?.toUpperCase()}</span><span><strong>{displayName}</strong><small>View profile</small></span><Settings />
          </Link>
          <div className="sidebar-actions">
            <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun /> : <Moon />}{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
            {clerkConfigured && <button type="button" onClick={() => signOut({ redirectUrl: '/' })}><LogOut />Log out</button>}
          </div>
        </div>
      </aside>

      <header className="mobile-app-header">
        <Link href="/today" className="mobile-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Fitcore AI" />
        </Link>
        <div className="mobile-header-actions"><span><Flame />Ready</span><Link href="/profile" aria-label="Open profile">{displayName[0]?.toUpperCase()}</Link></div>
      </header>

      <main className="app-main"><div className="app-content">{children}</div></main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return <Link key={item.href} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}><span><Icon />{active && <i />}</span><small>{item.name}</small></Link>;
        })}
      </nav>
    </div>
  );
}
