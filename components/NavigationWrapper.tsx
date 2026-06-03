'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  LineChart, 
  MessageSquare, 
  User,
  Zap,
  Menu,
  X,
  Target,
  Globe,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { localDb, UserProfile, isSupabaseConfigured, syncFromSupabase, supabase } from '@/lib/db';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Daily summary & quick tasks' },
  { name: 'Workouts', href: '/workout', icon: Dumbbell, description: 'AI generated exercise plan' },
  { name: 'Diet Planner', href: '/diet', icon: Utensils, description: 'AI meal logs & macro breakdown' },
  { name: 'Progress', href: '/progress', icon: LineChart, description: 'Weight, metrics & photo logger' },
  { name: 'AI Coach', href: '/chat', icon: MessageSquare, description: 'Chat with DeepSeek V4 Pro Coach' },
  { name: 'Profile', href: '/profile', icon: User, description: 'Adjust goals & preference' },
];

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<'english' | 'hinglish'>('english');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const logged = localStorage.getItem('fitcore_logged_in') === 'true';
    setIsLoggedIn(logged);
    
    // Security redirect gate
    if (!logged && pathname !== '/' && pathname !== '/login') {
      router.push('/login');
    }

    // Load profile
    const currentProfile = localDb.getProfile();
    setProfile(currentProfile);
    if (currentProfile?.language) {
      setLanguage(currentProfile.language);
    }

    // Sync with Supabase on session start
    if (logged && isSupabaseConfigured && currentProfile?.email) {
      syncFromSupabase(currentProfile.email).then((hasCloudProfile) => {
        if (!hasCloudProfile && supabase) {
          // If profile doesn't exist on Supabase, let's create it and migrate local storage data!
          const prof = localDb.getProfile();
          supabase.from('users').insert({
            email: prof.email.toLowerCase().trim(),
            name: prof.name,
            gender: prof.gender || null,
            dob: prof.dob || null,
            goal: prof.goal || null,
            experience: prof.experience || null,
            equipment: prof.equipment || null,
            days_per_week: prof.days_per_week || null,
            diet_type: prof.diet_type || null,
            diet_goal: prof.diet_goal || null,
            allergies: prof.allergies || [],
            meals_per_day: prof.meals_per_day || null,
            weight_kg: prof.weight_kg || null,
            height_cm: prof.height_cm || null
          }).select('id').single().then(({ data, error }) => {
            if (data && data.id) {
              localDb.updateProfile({ id: data.id });
              import('@/lib/db').then(({ syncToSupabaseOnSignup }) => {
                syncToSupabaseOnSignup(prof, data.id);
              });
            }
            if (error) console.error("Supabase initial user insertion failed:", error);
          });
        }
      });
    }
    
    // Load theme preference
    const storedTheme = localStorage.getItem('fitcore_theme') as 'dark' | 'light' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
    
    // Add event listener to refresh profile when updated on profile page
    const handleProfileUpdate = () => {
      const updatedProfile = localDb.getProfile();
      setProfile(updatedProfile);
      if (updatedProfile?.language) {
        setLanguage(updatedProfile.language);
      }
      const loggedInNow = localStorage.getItem('fitcore_logged_in') === 'true';
      setIsLoggedIn(loggedInNow);
    };
    window.addEventListener('fitcore_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('fitcore_profile_updated', handleProfileUpdate);
    };
  }, [pathname]);

  const toggleLanguage = () => {
    const nextLang = language === 'english' ? 'hinglish' : 'english';
    setLanguage(nextLang);
    localDb.updateProfile({ language: nextLang });
    window.dispatchEvent(new Event('fitcore_profile_updated'));
    window.dispatchEvent(new CustomEvent('fitcore_language_changed', { detail: nextLang }));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('fitcore_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    window.dispatchEvent(new CustomEvent('fitcore_theme_changed', { detail: nextTheme }));
  };

  const handleLogout = () => {
    localStorage.removeItem('fitcore_logged_in');
    setIsLoggedIn(false);
    
    // Optional: Clear active plans on logout if desired
    // localStorage.removeItem('fitcore_workout_plan');
    // localStorage.removeItem('fitcore_diet_plan');
    
    window.dispatchEvent(new Event('fitcore_profile_updated'));
    router.push('/');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen bg-transparent text-[var(--foreground)] flex-col" suppressHydrationWarning>
        <main className="flex-1 min-h-screen flex flex-col">
          <div className="flex-1 w-full mx-auto">
            {children}
          </div>
        </main>
        
        {/* FLOATING PREFERENCES SWITCHER AT BOTTOM RIGHT */}
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center h-10 w-10 rounded-full glass-panel border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#0b0e14]/90 text-cyan-400 shadow-lg hover:scale-105 transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-yellow-400 animate-spin-slow" /> : <Moon className="h-4.5 w-4.5 text-purple-400" />}
          </button>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-panel border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#0b0e14]/90 text-cyan-400 font-semibold text-xs tracking-wider shadow-lg hover:scale-105 transition-all"
          >
            <Globe className="h-4 w-4 text-cyan-400" />
            <span>{language === 'english' ? 'English' : 'Hinglish'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent text-[var(--foreground)] flex-col md:flex-row" suppressHydrationWarning>
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-[rgba(255,255,255,0.06)] fixed h-screen z-20">
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-wider">
            <Zap className="h-6 w-6 text-cyan-400 animate-pulse" />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">FITCORE AI</span>
          </Link>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* PROFILE SUMMARY & LOGOUT IN SIDEBAR BOTTOM */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-white/2 space-y-3">
          {profile && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-md">
                {profile.name ? profile.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-200">{profile.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-cyan-400 capitalize">
                  <Target className="h-3 w-3" />
                  <span className="truncate">{profile.goal || 'No Goal'}</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all font-semibold text-xs tracking-wider uppercase"
          >
            <LogOut className="h-4.5 w-4.5 text-gray-500 hover:text-red-400" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 glass-panel border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Zap className="h-5 w-5 text-cyan-400" />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">FITCORE AI</span>
        </Link>
        
        <div className="flex items-center gap-3.5">
          {profile && (
            <Link href="/profile" className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
              {profile.name ? profile.name[0].toUpperCase() : 'U'}
            </Link>
          )}
          
          <button 
            onClick={handleLogout}
            className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-lg transition-all"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:pl-64 min-h-screen flex flex-col pb-20 md:pb-6">
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-[rgba(255,255,255,0.08)] py-2.5 px-2 flex justify-around items-center z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.4)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-cyan-400 font-semibold' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-gray-400'}`} />
              <span className="text-[10px] tracking-tight">{item.name === 'AI Coach' ? 'Coach' : item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* FLOATING PREFERENCES SWITCHER AT BOTTOM RIGHT */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center h-10 w-10 rounded-full glass-panel border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#0b0e14]/90 text-cyan-400 shadow-lg hover:scale-105 transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-yellow-400 animate-spin-slow" /> : <Moon className="h-4.5 w-4.5 text-purple-400" />}
        </button>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-panel border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#0b0e14]/90 text-cyan-400 font-semibold text-xs tracking-wider shadow-lg hover:scale-105 transition-all"
        >
          <Globe className="h-4 w-4 text-cyan-400" />
          <span>{language === 'english' ? 'English' : 'Hinglish'}</span>
        </button>
      </div>
      
    </div>

  );
}
