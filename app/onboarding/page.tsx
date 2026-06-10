'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  Zap,
  User,
  Activity,
  Apple,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Dumbbell,
  Utensils,
  Phone,
  Calendar,
  Weight,
  Ruler
} from 'lucide-react';
import { localDb, supabase } from '@/lib/db';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, color: 'cyan' },
  { id: 2, title: 'Fitness Goals', icon: Dumbbell, color: 'purple' },
  { id: 3, title: 'Nutrition', icon: Utensils, color: 'emerald' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();

  const [step, setStep] = useState(1);

  // Step 1 — Personal Info
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Step 2 — Fitness Goals
  const [goal, setGoal] = useState<'weight loss' | 'muscle gain' | 'endurance' | 'flexibility'>('muscle gain');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [equipment, setEquipment] = useState<'home' | 'gym' | 'none'>('gym');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [activityType, setActivityType] = useState<'gym' | 'badminton' | 'cricket' | 'football' | 'yoga'>('gym');

  // Step 3 — Nutrition
  const [dietType, setDietType] = useState<'veg' | 'non-veg' | 'vegan'>('non-veg');
  const [dietGoal, setDietGoal] = useState<'lose fat' | 'gain muscle' | 'maintain'>('gain muscle');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(4);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isUserLoaded && user) {
      setName(user.fullName || user.username || '');
    }
  }, [user, isUserLoaded]);

  const validateStep1 = () => {
    if (!name.trim()) { setErrorMsg('Please enter your display name.'); return false; }
    if (!dob) { setErrorMsg('Please enter your date of birth.'); return false; }
    if (!weightKg || Number(weightKg) < 30) { setErrorMsg('Please enter a valid weight (min 30 kg).'); return false; }
    if (!heightCm || Number(heightCm) < 100) { setErrorMsg('Please enter a valid height (min 100 cm).'); return false; }
    return true;
  };

  const goNext = () => {
    setErrorMsg('');
    if (step === 1 && !validateStep1()) return;
    if (step < 3) setStep(s => s + 1);
  };

  const goBack = () => {
    setErrorMsg('');
    if (step > 1) setStep(s => s - 1);
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('Saving your profile...');

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) {
      setErrorMsg('No email address associated with your account.');
      setIsSubmitting(false);
      return;
    }

    const allergies = allergiesInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const onboardingProfile = {
      email: email.toLowerCase().trim(),
      username: user.username || email.split('@')[0],
      name: name.trim() || user.fullName || 'User',
      phone: phone.trim() || undefined,
      gender,
      dob,
      weight_kg: Number(weightKg),
      height_cm: Number(heightCm),
      goal,
      experience,
      equipment,
      days_per_week: Number(daysPerWeek),
      diet_type: dietType,
      diet_goal: dietGoal,
      allergies,
      meals_per_day: Number(mealsPerDay),
      language: 'english' as const,
      activity_type: activityType,
      is_subscribed: true,
      subscription_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      localDb.updateProfile(onboardingProfile);

      let dbUserId = 'local-user-123';
      if (supabase) {
        const { data, error } = await supabase.from('users').upsert({
          email: onboardingProfile.email,
          name: onboardingProfile.name,
          phone: onboardingProfile.phone || null,
          gender: onboardingProfile.gender,
          dob: onboardingProfile.dob,
          goal: onboardingProfile.goal,
          experience: onboardingProfile.experience,
          equipment: onboardingProfile.equipment,
          days_per_week: onboardingProfile.days_per_week,
          diet_type: onboardingProfile.diet_type,
          diet_goal: onboardingProfile.diet_goal,
          allergies: onboardingProfile.allergies,
          meals_per_day: onboardingProfile.meals_per_day,
          weight_kg: onboardingProfile.weight_kg,
          height_cm: onboardingProfile.height_cm,
          is_subscribed: true,
          subscription_expires_at: onboardingProfile.subscription_expires_at,
          activity_type: onboardingProfile.activity_type,
        }, { onConflict: 'email' }).select('id').single();

        if (error) {
          console.warn('Supabase onboarding failed (offline mode):', error.message);
        } else if (data?.id) {
          dbUserId = data.id;
          localDb.updateProfile({ id: dbUserId });
        }
      }

      setSuccessMsg('Generating your custom AI workout & meal plans...');

      try {
        await Promise.all([
          fetch('/api/workout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              days: Number(daysPerWeek),
              experience,
              goal,
              equipment,
              userId: dbUserId,
              language: 'english',
              activity_type: activityType,
            }),
          }).then(async r => {
            const wData = await r.json();
            if (r.ok && wData.plan) localDb.saveWorkoutPlan(wData.plan, experience);
          }),
          fetch('/api/diet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              diet_type: dietType,
              goal: dietGoal,
              weight_kg: Number(weightKg),
              height_cm: Number(heightCm),
              allergies,
              meals_per_day: Number(mealsPerDay),
              userId: dbUserId,
              language: 'english',
              activity_type: activityType,
            }),
          }).then(async r => {
            const dData = await r.json();
            if (r.ok && dData.plan) localDb.saveDietPlan(dData.plan);
          }),
        ]);

        localDb.clearChat();
        localDb.addChatMessage(
          'ai',
          `Welcome ${name.trim()}! I've generated your custom ${goal} plan using ${equipment} equipment for ${daysPerWeek} days a week. Ready to crush your goals? What would you like to start with?`
        );
      } catch (aiErr) {
        console.warn('AI plan generation failed:', aiErr);
      }

      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setSuccessMsg('All set! Taking you to your dashboard...');
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration.');
      setIsSubmitting(false);
    }
  };

  if (!isUserLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 blur-xl opacity-40 animate-pulse" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  const progressPct = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/8 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/8 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* ── HEADER ── */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="FitCore AI" className="h-24 w-auto object-contain" />
          </div>
          <p className="text-sm text-gray-400 mt-1">Set up your personalized fitness profile</p>
        </div>

        {/* ── STEP INDICATORS ── */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 text-xs font-bold ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400'
                    : isDone
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border border-white/10 text-gray-500'
                }`}>
                  {isDone
                    ? <Check className="h-3.5 w-3.5" />
                    : <Icon className="h-3.5 w-3.5" />
                  }
                  <span className="hidden sm:block">{s.title}</span>
                  <span className="sm:hidden">{s.id}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-px w-8 transition-all duration-500 ${step > s.id ? 'bg-emerald-500/60' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="h-0.5 bg-white/8 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPct + 34}%` }}
          />
        </div>

        {/* ── CARD ── */}
        <div className="glass-panel rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-32 w-32 bg-cyan-500/8 blur-2xl rounded-full pointer-events-none" />

          {/* Status alerts */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 mb-5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && !errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 mb-5">
              <Sparkles className="h-4 w-4 shrink-0 animate-bounce text-yellow-300" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ──────────── STEP 1: Personal Info ──────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
                <User className="h-4 w-4" />
                <span>Personal Information</span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-[#1e2433] border border-white/10 focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-gray-600"
                  placeholder="Your full name"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Gender *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2.5 rounded-xl border text-xs capitalize transition-all font-semibold ${
                        gender === g
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                          : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                    </button>
                  ))}
                </div>
              </div>

              {/* DOB & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    max={new Date(Date.now() - 12 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    required
                    className="w-full bg-[#1e2433] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-3 text-white text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#1e2433] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-3 text-white text-sm outline-none transition-colors placeholder:text-gray-600"
                    placeholder="+91 98765..."
                  />
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Weight className="h-3 w-3" /> Weight (kg) *
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    min="30"
                    max="250"
                    required
                    className="w-full bg-[#1e2433] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-3 text-white text-sm outline-none transition-colors placeholder:text-gray-600"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Ruler className="h-3 w-3" /> Height (cm) *
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    min="100"
                    max="250"
                    required
                    className="w-full bg-[#1e2433] border border-white/10 focus:border-cyan-500 rounded-xl px-3 py-3 text-white text-sm outline-none transition-colors placeholder:text-gray-600"
                    placeholder="178"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────── STEP 2: Fitness Goals ──────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-1">
                <Activity className="h-4 w-4" />
                <span>Fitness Goals & Training</span>
              </div>

              {/* Primary Goal */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Primary Goal *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'weight loss', label: 'Weight Loss', emoji: '🔥' },
                    { id: 'muscle gain', label: 'Muscle Gain', emoji: '💪' },
                    { id: 'endurance', label: 'Endurance', emoji: '🏃' },
                    { id: 'flexibility', label: 'Flexibility', emoji: '🧘' },
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id as any)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-xs transition-all font-semibold ${
                        goal === g.id
                          ? 'bg-purple-500/15 border-purple-400 text-purple-300'
                          : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base">{g.emoji}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Primary Sport / Activity *</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'gym', label: 'Gym', emoji: '🏋️' },
                    { id: 'badminton', label: 'Badminton', emoji: '🏸' },
                    { id: 'cricket', label: 'Cricket', emoji: '🏏' },
                    { id: 'football', label: 'Football', emoji: '⚽' },
                    { id: 'yoga', label: 'Yoga', emoji: '🧘' },
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActivityType(act.id as any)}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-[10px] transition-all text-center ${
                        activityType === act.id
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <span className="text-lg">{act.emoji}</span>
                      <span className="leading-tight">{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience & Equipment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Experience</label>
                  <div className="flex flex-col gap-1.5">
                    {(['beginner', 'intermediate', 'advanced'] as const).map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setExperience(ex)}
                        className={`py-2 px-3 rounded-xl border text-xs capitalize transition-all font-medium text-left ${
                          experience === ex
                            ? 'bg-purple-500/15 border-purple-400 text-purple-300 font-bold'
                            : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {ex === 'beginner' ? '🌱 Beginner' : ex === 'intermediate' ? '⚡ Intermediate' : '🔥 Advanced'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Equipment</label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'gym', label: '🏋️ Gym' },
                      { id: 'home', label: '🏠 Home Setup' },
                      { id: 'none', label: '🤸 Bodyweight' },
                    ].map(eq => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => setEquipment(eq.id as any)}
                        className={`py-2 px-3 rounded-xl border text-xs transition-all font-medium text-left ${
                          equipment === eq.id
                            ? 'bg-purple-500/15 border-purple-400 text-purple-300 font-bold'
                            : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {eq.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Days Per Week */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Training Days Per Week</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6, 7].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaysPerWeek(d)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        daysPerWeek === d
                          ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                          : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{daysPerWeek} day{daysPerWeek !== 1 ? 's' : ''} / week selected</p>
              </div>
            </div>
          )}

          {/* ──────────── STEP 3: Nutrition ──────────── */}
          {step === 3 && (
            <form onSubmit={handleOnboarding} className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <Apple className="h-4 w-4" />
                <span>Nutrition Preferences</span>
              </div>

              {/* Diet Type */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Diet Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'non-veg', label: '🍗 Non-Veg' },
                    { id: 'veg', label: '🥦 Vegetarian' },
                    { id: 'vegan', label: '🌱 Vegan' },
                  ].map(dt => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDietType(dt.id as any)}
                      className={`py-3 rounded-xl border text-xs transition-all font-semibold ${
                        dietType === dt.id
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                          : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diet Goal */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Diet Goal *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lose fat', label: '🔥 Lose Fat' },
                    { id: 'gain muscle', label: '💪 Gain Muscle' },
                    { id: 'maintain', label: '⚖️ Maintain' },
                  ].map(dg => (
                    <button
                      key={dg.id}
                      type="button"
                      onClick={() => setDietGoal(dg.id as any)}
                      className={`py-3 rounded-xl border text-xs transition-all font-semibold ${
                        dietGoal === dg.id
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                          : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {dg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meals per Day */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Meals Per Day</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 2, label: '2\nMeals' },
                    { val: 3, label: '3\nMeals' },
                    { val: 4, label: '3+1\nSnack' },
                    { val: 5, label: '4+1\nSnack' },
                  ].map(m => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setMealsPerDay(m.val)}
                      className={`py-3 rounded-xl border text-[10px] font-bold transition-all whitespace-pre-line leading-tight ${
                        mealsPerDay === m.val
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                          : 'bg-white/3 border-white/8 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Food Allergies / Exclusions</label>
                <input
                  type="text"
                  value={allergiesInput}
                  onChange={e => setAllergiesInput(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#1e2433] border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-gray-600"
                  placeholder="e.g. peanuts, dairy (comma separated)"
                />
              </div>

              {/* Summary before submit */}
              <div className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-2 text-xs">
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-2">Your Profile Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300">
                  <span className="text-gray-500">Name:</span><span className="font-medium">{name}</span>
                  <span className="text-gray-500">Goal:</span><span className="font-medium capitalize">{goal}</span>
                  <span className="text-gray-500">Weight:</span><span className="font-medium">{weightKg} kg</span>
                  <span className="text-gray-500">Height:</span><span className="font-medium">{heightCm} cm</span>
                  <span className="text-gray-500">Sport:</span><span className="font-medium capitalize">{activityType}</span>
                  <span className="text-gray-500">Diet:</span><span className="font-medium capitalize">{dietType}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating Custom AI Plans...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    Complete Setup & Generate Plans
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── NAVIGATION BUTTONS (Steps 1 & 2) ── */}
          {step < 3 && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/8 transition-all text-xs font-bold"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.01] shadow-[0_0_16px_rgba(6,182,212,0.25)]"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Back button on step 3 */}
          {step === 3 && !isSubmitting && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-all text-xs font-bold"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to Fitness Goals
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-4">
          Your data is encrypted and stored securely. We never sell your information.
        </p>
      </div>
    </div>
  );
}
