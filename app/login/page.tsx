'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Sparkles, User, Lock, Phone, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { localDb } from '@/lib/db';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Input fields
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (localStorage.getItem('fitcore_logged_in') === 'true') {
      router.push('/');
      return;
    }

    // Read pre-selected mode from query param
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
  }, [searchParams, router]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Set session logged in
      localStorage.setItem('fitcore_logged_in', 'true');
      
      // Ensure profile and default plans exist so they don't see empty dashboard
      const profile = localDb.getProfile();
      if (!profile.name || profile.name === 'Flex Champion') {
        localDb.updateProfile({
          name: emailOrPhone.split('@')[0] || 'Champion',
          email: emailOrPhone.includes('@') ? emailOrPhone : 'user@fitcore.ai',
          phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined
        });
      }

      // Check if plans exist, if not, generate default mock plans to avoid blank screens
      const w = localDb.getWorkoutPlan();
      const d = localDb.getDietPlan();
      if (!w || !d) {
        // Seed default plans
        seedMockData();
      }

      // Dispatch event to update navbar/wrapper
      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setIsSubmitting(false);
      router.push('/');
    }, 800);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      // Set session logged in
      localStorage.setItem('fitcore_logged_in', 'true');
      
      // Update name and email/phone in profile
      localDb.updateProfile({
        name: name,
        email: emailOrPhone.includes('@') ? emailOrPhone : 'user@fitcore.ai',
        phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined
      });

      // Dispatch profile updated event
      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setIsSubmitting(false);
      
      // Redirect to profile setup to generate custom AI plans
      router.push('/profile');
    }, 800);
  };

  const handleInstantDemo = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('fitcore_logged_in', 'true');
      
      // Save default profile parameters
      localDb.updateProfile({
        name: 'Flex Champion',
        email: 'demo@fitcore.ai',
        goal: 'muscle gain',
        experience: 'intermediate',
        equipment: 'gym',
        days_per_week: 4,
        weight_kg: 75,
        height_cm: 180,
        language: 'english'
      });
      
      seedMockData();
      
      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setIsSubmitting(false);
      router.push('/');
    }, 500);
  };

  const seedMockData = () => {
    const mockWorkout = [
      {
        day: "Day 1 - Push Day",
        exercises: [
          { name: "Bench Press", sets: 4, reps: "8-10", rest_seconds: 90, muscle_group: "Chest", tip: "Arch your lower back slightly and drive feet into the floor." },
          { name: "Overhead Shoulder Press", sets: 3, reps: "10", rest_seconds: 75, muscle_group: "Shoulders", tip: "Keep core tight, don't flare elbows out." },
          { name: "Incline Dumbbell Flyes", sets: 3, reps: "12", rest_seconds: 60, muscle_group: "Chest", tip: "Maintain a slight bend in elbows throughout." },
          { name: "Tricep Pushdowns", sets: 3, reps: "12-15", rest_seconds: 60, muscle_group: "Triceps", tip: "Lock your elbows to your sides." }
        ]
      },
      {
        day: "Day 2 - Pull Day",
        exercises: [
          { name: "Lat Pulldown", sets: 4, reps: "10", rest_seconds: 90, muscle_group: "Back", tip: "Pull down to your upper chest, squeezing shoulder blades." },
          { name: "Barbell Rows", sets: 3, reps: "8", rest_seconds: 75, muscle_group: "Back", tip: "Keep torso at 45 degrees, pull bar to navel." },
          { name: "Bicep Barbell Curls", sets: 3, reps: "10-12", rest_seconds: 60, muscle_group: "Biceps", tip: "Keep chest up and elbows pinned to waist." }
        ]
      }
    ];
    localDb.saveWorkoutPlan(mockWorkout, 'intermediate');

    const mockDiet = [
      {
        day: "Monday",
        breakfast: { name: "Oatmeal with Almonds & Honey + 3 Egg Whites", calories: 450, protein_g: 30, carbs_g: 50, fat_g: 12 },
        lunch: { name: "Grilled Chicken Breast with Brown Rice & Broccoli", calories: 550, protein_g: 45, carbs_g: 60, fat_g: 8 },
        dinner: { name: "Paneer Stir Fry with Mixed Vegetables & Quinoa", calories: 500, protein_g: 25, carbs_g: 40, fat_g: 18 },
        snacks: { name: "Whey Protein Shake + 1 Banana", calories: 250, protein_g: 28, carbs_g: 30, fat_g: 3 }
      }
    ];
    localDb.saveDietPlan(mockDiet);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="absolute inset-0 -top-40 bg-gradient-radial-neon opacity-30 pointer-events-none -z-10" />
      
      <div className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 h-28 w-28 bg-cyan-500/10 blur-2xl rounded-full" />
        
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 items-center justify-center shadow-lg">
            <Zap className="h-6 w-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-3">
            FITCORE <span className="text-cyan-400">AI</span>
          </h2>
          <p className="text-xs text-gray-400">Your AI-Powered Personal Fitness Ecosystem</p>
        </div>

        {/* TABS CONTROLLER */}
        <div className="flex bg-[#0b0e14]/60 border border-white/5 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-cyan-400 shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-3 text-center rounded-xl text-xs font-bold transition-all ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-cyan-400 shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* FORM SECTION */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email or Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or user@fitcore.ai"
                  className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none transition-colors"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password (Optional)</label>
                <span className="text-[9px] text-cyan-500 font-semibold italic">No password needed</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank or enter dummy password"
                  className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-3 text-xs text-white outline-none transition-colors"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none transition-colors"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email or Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="e.g. rahul@gmail.com or +91 99999 88888"
                  className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none transition-colors"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password (Optional)</label>
                <span className="text-[9px] text-cyan-500 font-semibold italic">No password needed</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Configure password (any text is accepted)"
                  className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-3 text-xs text-white outline-none transition-colors"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account & Continue'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* MOCK DEMO GATEWAY */}
        <div className="border-t border-white/5 pt-5 space-y-3.5 text-center">
          <p className="text-[10px] text-gray-500">Want to test the app features directly?</p>
          <button
            onClick={handleInstantDemo}
            disabled={isSubmitting}
            className="w-full py-3 bg-white/5 border border-white/10 hover:border-cyan-500/30 rounded-xl text-xs font-bold text-gray-300 hover:text-cyan-400 hover:bg-[#0b0e14]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            Try Instant Demo Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-gray-400">Loading auth screen...</div>}>
      <LoginContent />
    </Suspense>
  );
}
