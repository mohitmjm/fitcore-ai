'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Apple, BarChart3, Bot, ChevronRight, CircleUserRound, Dumbbell, Flame, Home, Moon, Search, Settings, Sun } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Today', href: '/today', icon: Home, mobile: true },
  { name: 'Body & Exercises', href: '/exercises', icon: Search, mobile: true },
  { name: 'Workouts', href: '/workout', icon: Dumbbell },
  { name: 'AI Coach', href: '/chat', icon: Bot, mobile: true },
  { name: 'Nutrition', href: '/diet', icon: Apple },
  { name: 'Progress', href: '/progress', icon: BarChart3, mobile: true },
];
const NO_SHELL = ['/', '/login', '/welcome'];
function active(pathname: string, href: string) { return pathname === href || (href !== '/today' && pathname.startsWith(`${href}/`)); }
function noShell(pathname: string) { return NO_SHELL.includes(pathname) || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'); }

export default function DevNavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const mobileItems = useMemo(() => [...NAV_ITEMS.filter((item) => item.mobile), { name: 'Profile', href: '/profile', icon: CircleUserRound, mobile: true }], []);

  useEffect(() => {
    setMounted(true);
    const initial = (localStorage.getItem('fitcore_theme') as 'dark'|'light'|null) ?? 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('light', initial === 'light');
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('fitcore_theme', next);
    document.documentElement.classList.toggle('light', next === 'light');
  }

  if (!mounted || noShell(pathname)) return <div className="min-h-screen"><main>{children}</main></div>;

  return <div className="app-shell">
    <aside className="desktop-sidebar">
      <Link href="/today" className="app-brand" aria-label="Fitcore AI home"><Image src="/logo.png" width={44} height={44} alt="" /><span><strong>FITCORE</strong><small>TRAIN SMARTER</small></span></Link>
      <div className="sidebar-status"><span className="status-ring"><Flame /></span><div><small>Local preview</small><strong>Ready to train</strong></div><ChevronRight /></div>
      <nav className="desktop-nav" aria-label="Primary navigation"><span className="nav-section-label">Your training</span>{NAV_ITEMS.map((item) => { const Icon=item.icon; const selected=active(pathname,item.href); return <Link key={item.href} href={item.href} className={selected?'active':''} aria-current={selected?'page':undefined}><Icon /><span>{item.name}</span>{selected&&<i />}</Link>; })}</nav>
      <div className="sidebar-footer"><Link href="/profile" className={active(pathname,'/profile')?'profile-link active':'profile-link'}><span className="profile-avatar">A</span><span><strong>Athlete</strong><small>View profile</small></span><Settings /></Link><div className="sidebar-actions"><button type="button" onClick={toggleTheme}>{theme==='dark'?<Sun />:<Moon />}{theme==='dark'?'Light mode':'Dark mode'}</button></div></div>
    </aside>
    <header className="mobile-app-header"><Link href="/today" className="mobile-brand"><Image src="/logo.png" width={40} height={40} alt="Fitcore AI" /></Link><div className="mobile-header-actions"><span><Flame />Ready</span><Link href="/profile" aria-label="Open profile">A</Link></div></header>
    <main className="app-main"><div className="app-content">{children}</div></main>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{mobileItems.map((item) => { const Icon=item.icon; const selected=active(pathname,item.href); return <Link key={item.href} href={item.href} className={selected?'active':''} aria-current={selected?'page':undefined}><span><Icon />{selected&&<i />}</span><small>{item.name==='Body & Exercises'?'Exercises':item.name==='AI Coach'?'Coach':item.name}</small></Link>; })}</nav>
  </div>;
}
