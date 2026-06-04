'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  LogOut,
  CreditCard,
  QrCode,
  Check,
  Lock,
  Loader2,
  AlertCircle
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

  // Subscription states
  const [payTab, setPayTab] = useState<'card' | 'upi'>('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentError, setPaymentError] = useState('');

  const syncedRef = useRef(false);

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
    if (logged && isSupabaseConfigured && currentProfile?.email && !syncedRef.current) {
      syncedRef.current = true;
      syncFromSupabase(currentProfile.email).then((hasCloudProfile) => {
        if (!hasCloudProfile && supabase) {
          // If profile doesn't exist on Supabase, let's create it and migrate local storage data!
          const prof = localDb.getProfile();
          supabase.from('users').upsert({
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
            height_cm: prof.height_cm || null,
            is_subscribed: prof.is_subscribed ?? true,
            wallet_balance: prof.wallet_balance ?? 100,
            referrals: prof.referrals ?? [],
            whatsapp_enabled: prof.whatsapp_enabled ?? true,
            sms_enabled: prof.sms_enabled ?? false,
            email_enabled: prof.email_enabled ?? true
          }, { onConflict: 'email' }).select('id').single().then(({ data, error }) => {
            if (data && data.id) {
              localDb.updateProfile({ id: data.id });
              import('@/lib/db').then(({ syncToSupabaseOnSignup }) => {
                syncToSupabaseOnSignup(prof, data.id);
              });
            }
            if (error) {
              console.warn("Supabase initial user insertion failed (falling back to offline mode):", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
            }
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

  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\//g, '').replace(/[^0-9]/gi, '');
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.substring(0, 2)}/${clean.substring(2, 4)}`;
    }
    setCardExpiry(formatted.substring(0, 5));
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    
    if (payTab === 'card') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        setPaymentError('Invalid Card Number. Must be 16 digits.');
        return;
      }
      if (cardExpiry.length !== 5) {
        setPaymentError('Invalid Expiry Date (MM/YY).');
        return;
      }
      if (cardCvv.length !== 3) {
        setPaymentError('Invalid CVV (3 digits).');
        return;
      }
    } else {
      if (!upiId || !upiId.includes('@')) {
        setPaymentError('Please enter a valid UPI ID (e.g. user@upi).');
        return;
      }
    }
    
    setPaymentStep('processing');
    
    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        localDb.updateProfile({ 
          is_subscribed: true,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        window.dispatchEvent(new Event('fitcore_profile_updated'));
        setPaymentStep('form');
      }, 1500);
    }, 2500);
  };

  const handleUpiQrVerify = () => {
    setPaymentError('');
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        localDb.updateProfile({ 
          is_subscribed: true,
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        window.dispatchEvent(new Event('fitcore_profile_updated'));
        setPaymentStep('form');
      }, 1500);
    }, 2500);
  };

  const isSubscriptionActive = profile?.is_subscribed && (
    !profile?.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date()
  );

  if (isLoggedIn && !isSubscriptionActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--background)]">
        <div className="absolute inset-0 -top-40 bg-gradient-radial-neon opacity-30 pointer-events-none -z-10" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-purple-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
        
        <div className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl relative">
          <div className="absolute -top-10 -right-10 h-28 w-28 bg-cyan-500/10 blur-2xl rounded-full" />
          
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 items-center justify-center shadow-lg animate-bounce">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-3 flex items-center justify-center gap-2">
              FITCORE <span className="text-cyan-400">AI</span>
            </h2>
            <p className="text-xs text-gray-400 text-center">Active Subscription Required</p>
          </div>

          {paymentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-[fadeIn_0.3s_ease]">
              <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white">Processing Secure Payment...</p>
                <p className="text-[11px] text-gray-500">Verifying transaction with gateway, please wait.</p>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-[scaleIn_0.3s_ease]">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-emerald-400">Payment Successful!</p>
                <p className="text-[11px] text-gray-400">Activating your AI Personal Trainer dashboard...</p>
              </div>
            </div>
          )}

          {paymentStep === 'form' && (
            <div className="space-y-6">
              {/* Product Info Block */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-bold">FitCore AI All-Access Pass</span>
                  <span className="text-cyan-400 font-black">₹99 / month</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal text-left">
                  Unlock unlimited custom workout generators, 7-day Indian meal plans, body metrics progress logs, and your personal Llama 3.2 AI Fitness Coach chatbot.
                </p>
              </div>

              {paymentError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* TABS */}
              <div className="flex bg-[#0b0e14]/60 border border-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setPayTab('card')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    payTab === 'card' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Card Payment
                </button>
                <button
                  onClick={() => setPayTab('upi')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    payTab === 'upi' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  UPI / QR
                </button>
              </div>

              {payTab === 'card' ? (
                <form onSubmit={handlePaymentSubmit} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Vikram Singh"
                      className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono tracking-widest"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">CVV (3 Digits)</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="***"
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.01] flex items-center justify-center gap-1.5"
                  >
                    <Lock className="h-4 w-4" />
                    Pay ₹99 Securely
                  </button>
                </form>
              ) : (
                <div className="space-y-5 text-center">
                  <p className="text-[11px] text-gray-400">Scan this mock UPI QR code to complete the verification</p>
                  
                  <div className="relative inline-block">
                    <svg width="150" height="150" viewBox="0 0 100 100" className="mx-auto bg-white p-2 rounded-2xl border border-white/10 shadow-lg">
                      <rect x="5" y="5" width="25" height="25" fill="#0b0e14" />
                      <rect x="10" y="10" width="15" height="15" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="#0b0e14" />

                      <rect x="70" y="5" width="25" height="25" fill="#0b0e14" />
                      <rect x="75" y="10" width="15" height="15" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="#0b0e14" />

                      <rect x="5" y="70" width="25" height="25" fill="#0b0e14" />
                      <rect x="10" y="75" width="15" height="15" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="#0b0e14" />

                      <rect x="40" y="10" width="5" height="10" fill="#0b0e14" />
                      <rect x="50" y="5" width="10" height="5" fill="#0b0e14" />
                      <rect x="45" y="20" width="15" height="5" fill="#0b0e14" />
                      
                      <rect x="10" y="40" width="10" height="5" fill="#0b0e14" />
                      <rect x="5" y="50" width="5" height="10" fill="#0b0e14" />
                      <rect x="20" y="45" width="5" height="15" fill="#0b0e14" />

                      <rect x="40" y="40" width="20" height="20" fill="#6366f1" opacity="0.8" />
                      <rect x="45" y="45" width="10" height="10" fill="white" />
                      
                      <rect x="70" y="40" width="10" height="10" fill="#0b0e14" />
                      <rect x="85" y="45" width="5" height="15" fill="#0b0e14" />
                      <rect x="80" y="35" width="15" height="5" fill="#0b0e14" />

                      <rect x="35" y="70" width="15" height="5" fill="#0b0e14" />
                      <rect x="40" y="80" width="5" height="10" fill="#0b0e14" />
                      <rect x="50" y="75" width="15" height="5" fill="#0b0e14" />

                      <rect x="70" y="70" width="10" height="5" fill="#0b0e14" />
                      <rect x="85" y="75" width="10" height="10" fill="#0b0e14" />
                      <rect x="75" y="85" width="5" height="10" fill="#0b0e14" />
                    </svg>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Merchant UPI ID</span>
                      <span className="text-xs font-mono text-white font-bold select-all bg-[#0b0e14] border border-white/5 px-3 py-1.5 rounded-lg inline-block">fitcore@ybl</span>
                    </div>

                    <button
                      onClick={handleUpiQrVerify}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    >
                      Simulate QR Payment Success
                    </button>
                  </div>
                </div>
              )}

              {/* LOGOUT */}
              <div className="border-t border-white/5 pt-4 text-center">
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  Cancel & Log Out
                </button>
              </div>
            </div>
          )}
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
            <div className="space-y-2.5">
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
              {profile.subscription_expires_at && (
                <div className="text-[10px] text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between gap-1">
                  <span className="text-cyan-400 font-bold shrink-0">Sub Expiry:</span>
                  <span className="truncate font-mono text-gray-300">
                    {new Date(profile.subscription_expires_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              )}
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
