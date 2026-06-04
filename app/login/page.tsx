'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  Activity,
  Dumbbell,
  Apple
} from 'lucide-react';
import { localDb } from '@/lib/db';

function LoginContent() {
  const router = useRouter();
  
  // Auth Tab Selection
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign In credentials state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign Up flow state
  const [signUpStep, setSignUpStep] = useState<'email' | 'otp' | 'credentials' | 'profile'>('email');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Profile onboarding details during Sign Up
  const [name, setName] = useState('');
  const [weightKg, setWeightKg] = useState('72');
  const [heightCm, setHeightCm] = useState('178');
  const [goal, setGoal] = useState<'weight loss' | 'muscle gain' | 'endurance' | 'flexibility'>('muscle gain');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [equipment, setEquipment] = useState<'home' | 'gym' | 'none'>('gym');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [dietType, setDietType] = useState<'veg' | 'non-veg' | 'vegan'>('non-veg');
  const [dietGoal, setDietGoal] = useState<'lose fat' | 'gain muscle' | 'maintain'>('gain muscle');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(4);

  // OTP Pin Inputs: 6 digits
  const [otpPin, setOtpPin] = useState<string[]>(Array(6).fill(''));
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Dev Helper State
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    if (localStorage.getItem('fitcore_logged_in') === 'true') {
      router.push('/');
      return;
    }
  }, [router]);

  // Handle OTP timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'signup' && signUpStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [activeTab, signUpStep, resendTimer]);

  // Handle standard credentials Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both your username/email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: loginId.trim(),
          password: loginPassword.trim()
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      // Store in localStorage
      localStorage.setItem('fitcore_logged_in', 'true');
      localDb.updateProfile(data.user);

      // Seed default plans if missing
      const w = localDb.getWorkoutPlan();
      const d = localDb.getDietPlan();
      if (!w || !d) {
        seedMockData();
      }

      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setSuccessMsg('Logged in successfully!');
      
      setTimeout(() => {
        router.push('/');
      }, 600);

    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up: Step 1 - Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setDevOtp(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setSignUpStep('otp');
      setResendTimer(60);
      setCanResend(false);
      setSuccessMsg(data.message || 'OTP code sent! Check your email.');
      setIsMockMode(data.mockMode || false);

      if (data.devMode && data.code) {
        setDevOtp(data.code);
      }

      setOtpPin(Array(6).fill(''));
      
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 150);

    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up: Step 2 - Verify OTP
  const handleVerifyOtp = async (enteredOtp?: string) => {
    const finalOtp = enteredOtp || otpPin.join('');
    
    if (finalOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: finalOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code. Please check and try again.');
      }

      setSignUpStep('credentials');
      setSuccessMsg('Email verified successfully! Now choose a unique username and password.');
      setErrorMsg('');

    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid code.');
      pinRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up: Step 3 - Submit Username & Password (Local Check)
  const handleRegisterCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username and Password are required.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Check if username already exists locally
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), username: username.trim(), password: password.trim(), checkOnly: true })
    }).then(async res => {
      const data = await res.json();
      if (!res.ok && data.error && data.error.includes('taken')) {
        setErrorMsg(data.error);
      } else {
        setErrorMsg('');
        setName(username);
        setSignUpStep('profile');
        setSuccessMsg('Credentials verified! Please fill out your fitness parameters for custom AI Coaching.');
      }
    }).catch(() => {
      // Offline fallback: allow proceeding
      setErrorMsg('');
      setName(username);
      setSignUpStep('profile');
    });
  };

  // Sign Up: Step 4 - Submit Profile details & complete signup
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('Saving profile and contacting AI Trainer...');

    const allergies = allergiesInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          name: name.trim() || username.trim(),
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
          language: 'english'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      // Successful registration -> Auto Login
      localStorage.setItem('fitcore_logged_in', 'true');
      localDb.updateProfile(data.user);

      // Seed default plans locally as a fallback immediately to prevent landing screen crash
      seedMockData();

      // Trigger background AI customization
      try {
        await Promise.all([
          fetch('/api/workout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              days: Number(daysPerWeek),
              experience: experience,
              goal: goal,
              equipment: equipment,
              userId: data.user.id,
              language: 'english'
            })
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
              allergies: allergies,
              meals_per_day: Number(mealsPerDay),
              userId: data.user.id,
              language: 'english'
            })
          }).then(async r => {
            const dData = await r.json();
            if (r.ok && dData.plan) localDb.saveDietPlan(dData.plan);
          })
        ]);
        
        // Add a default welcome message to AI Coach
        localDb.clearChat();
        const welcomeMsg = `I have generated your custom training and meal plans! Based on your target to ${goal} using ${equipment} equipment ${daysPerWeek} days a week, I've designed a brand-new plan. What would you like to discuss first?`;
        localDb.addChatMessage('ai', welcomeMsg);
      } catch (aiErr) {
        console.warn("Background AI customization failed, fallback seed active:", aiErr);
      }

      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setSuccessMsg('Account created and customized successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard and paste handlers for OTP pins
  const handlePinChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return;

    const newPin = [...otpPin];
    newPin[index] = numericValue.slice(-1);
    setOtpPin(newPin);

    if (index < 5 && newPin[index]) {
      pinRefs.current[index + 1]?.focus();
    }

    const combinedOtp = newPin.join('');
    if (combinedOtp.length === 6 && !newPin.includes('')) {
      handleVerifyOtp(combinedOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newPin = [...otpPin];
      if (!newPin[index] && index > 0) {
        newPin[index - 1] = '';
        setOtpPin(newPin);
        pinRefs.current[index - 1]?.focus();
      } else {
        newPin[index] = '';
        setOtpPin(newPin);
      }
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setOtpPin(newPin);
      handleVerifyOtp(pastedData);
    }
  };

  const handleDevAutoFill = () => {
    if (devOtp) {
      const pins = devOtp.split('');
      setOtpPin(pins);
      handleVerifyOtp(devOtp);
    }
  };

  // Instant demo account setup (evaluation bypass)
  const handleInstantDemo = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('fitcore_logged_in', 'true');
      
      localDb.updateProfile({
        name: 'Flex Champion',
        email: 'demo@fitcore.ai',
        username: 'flexchampion',
        goal: 'muscle gain',
        experience: 'intermediate',
        equipment: 'gym',
        days_per_week: 4,
        weight_kg: 75,
        height_cm: 180,
        language: 'english',
        is_subscribed: true
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

        {/* FEEDBACK STATUS ALERTS */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span className="text-left">{errorMsg}</span>
          </div>
        )}
        
        {successMsg && !errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 animate-bounce" />
            <span className="text-left">{successMsg}</span>
          </div>
        )}

        {/* AUTH MODE NAVIGATION TABS */}
        {!(activeTab === 'signup' && signUpStep !== 'email') && (
          <div className="flex bg-[#0b0e14]/60 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'signin' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setSignUpStep('email');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'signup' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* INTERACTIVE FORM SECTIONS */}
        {activeTab === 'signin' ? (
          /* SIGN IN FORM */
          <form onSubmit={handleSignIn} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Username or Email</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. flexchampion or demo@fitcore.ai"
                  className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white outline-none transition-colors"
                />
                <User className="absolute left-3.5 top-4 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white outline-none transition-colors"
                />
                <Lock className="absolute left-3.5 top-4 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* SIGN UP FLOW */
          <div className="space-y-4">
            
            {/* SIGN UP STEP 1: EMAIL ADDRESS INPUT */}
            {signUpStep === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                    <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">First Step: Verify Email</span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      disabled={isSubmitting}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@domain.com"
                      className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white outline-none transition-colors"
                    />
                    <Mail className="absolute left-3.5 top-4 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      Send Email Verification Code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SIGN UP STEP 2: ENTER OTP PIN CODE */}
            {signUpStep === 'otp' && (
              <div className="space-y-5 text-left">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSignUpStep('email');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Email
                  </button>
                  <p className="text-xs text-gray-400 pt-2 text-center">
                    We sent a 6-digit OTP code to <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <div className="flex justify-between gap-2.5 my-4" onPaste={handlePaste}>
                  {otpPin.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={isSubmitting}
                      ref={(el) => {
                        pinRefs.current[idx] = el;
                      }}
                      value={digit}
                      onChange={(e) => handlePinChange(e.target.value, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      className="w-12 h-14 bg-[#0b0e14]/60 border-2 border-white/8 focus:border-cyan-500 rounded-xl text-center text-lg font-black text-cyan-400 outline-none transition-all focus:shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={isSubmitting || otpPin.includes('')}
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      Verify Verification Code
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>

                {devOtp && (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-cyan-400 font-bold uppercase">⚡ Developer Auto-Fill</span>
                      <span className="text-gray-500 italic">Mock logs</span>
                    </div>
                    <button
                      onClick={handleDevAutoFill}
                      disabled={isSubmitting}
                      className="w-full py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[11px] font-black text-cyan-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Inject OTP Code ({devOtp})
                    </button>
                  </div>
                )}

                <div className="text-center">
                  {canResend ? (
                    <button
                      onClick={() => handleSendOtp()}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Resend OTP Code
                    </button>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Resend code in <strong className="text-gray-300">{resendTimer}s</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SIGN UP STEP 3: SET USERNAME AND PASSWORD */}
            {signUpStep === 'credentials' && (
              <form onSubmit={handleRegisterCredentials} className="space-y-4 text-left animate-[fadeIn_0.3s_ease]">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Choose Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      minLength={3}
                      disabled={isSubmitting}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. flexchampion"
                      className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white outline-none transition-colors font-semibold"
                    />
                    <User className="absolute left-3.5 top-4 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Choose Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={4}
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white outline-none transition-colors"
                    />
                    <Lock className="absolute left-3.5 top-4 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      disabled={isSubmitting}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full bg-[#0b0e14]/50 border border-white/8 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white outline-none transition-colors"
                    />
                    <KeyRound className="absolute left-3.5 top-4 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue to Profile Setup
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* SIGN UP STEP 4: PHYSICAL & NUTRITION PROFILE ONBOARDING */}
            {signUpStep === 'profile' && (
              <form onSubmit={handleRegister} className="space-y-4 text-left animate-[fadeIn_0.3s_ease]">
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold border-b border-white/5 pb-1.5 mb-2.5">
                  <Activity className="h-4 w-4" />
                  <span>Physical & Nutrition Parameters</span>
                </div>

                {/* SCROLLABLE WIZARD FORM PANEL */}
                <div className="max-h-[360px] overflow-y-auto pr-1.5 space-y-4 scrollbar-thin">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Display Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none transition-colors"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={weightKg} 
                        onChange={(e) => setWeightKg(e.target.value)}
                        required
                        min="30"
                        max="250"
                        disabled={isSubmitting}
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Height (cm)</label>
                      <input 
                        type="number" 
                        value={heightCm} 
                        onChange={(e) => setHeightCm(e.target.value)}
                        required
                        min="100"
                        max="250"
                        disabled={isSubmitting}
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fitness Goal</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['weight loss', 'muscle gain', 'endurance', 'flexibility'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setGoal(g as any)}
                          className={`px-3 py-2 rounded-xl border text-[11px] capitalize transition-all text-center ${
                            goal === g
                              ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                              : 'bg-[#0b0e14] border-white/8 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Experience Level</label>
                      <select 
                        value={experience} 
                        onChange={(e) => setExperience(e.target.value as any)}
                        disabled={isSubmitting}
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-xs outline-none transition-colors"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Weekly Days</label>
                      <select 
                        value={daysPerWeek} 
                        onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                        disabled={isSubmitting}
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-xs outline-none transition-colors"
                      >
                        <option value={2}>2 Days / Week</option>
                        <option value={3}>3 Days / Week</option>
                        <option value={4}>4 Days / Week</option>
                        <option value={5}>5 Days / Week</option>
                        <option value={6}>6 Days / Week</option>
                        <option value={7}>7 Days / Week</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Available Equipment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'gym', label: 'Gym' },
                        { id: 'home', label: 'Home' },
                        { id: 'none', label: 'Bodyweight' }
                      ].map((eq) => (
                        <button
                          key={eq.id}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setEquipment(eq.id as any)}
                          className={`py-2 rounded-xl border text-[11px] transition-all text-center ${
                            equipment === eq.id
                              ? 'bg-purple-500/10 border-purple-400 text-purple-400'
                              : 'bg-[#0b0e14] border-white/8 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {eq.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <Apple className="h-4 w-4" />
                    <span>Nutrition Details</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Diet Type</label>
                      <select 
                        value={dietType} 
                        onChange={(e) => setDietType(e.target.value as any)}
                        disabled={isSubmitting}
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-xs outline-none transition-colors"
                      >
                        <option value="veg">Vegetarian</option>
                        <option value="non-veg">Non-Vegetarian</option>
                        <option value="vegan">Vegan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Diet Goal</label>
                      <select 
                        value={dietGoal} 
                        onChange={(e) => setDietGoal(e.target.value as any)}
                        disabled={isSubmitting}
                        className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-xs outline-none transition-colors"
                      >
                        <option value="lose fat">Lose Fat</option>
                        <option value="gain muscle">Gain Muscle</option>
                        <option value="maintain">Maintain</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Allergies / Exclusions</label>
                    <input 
                      type="text" 
                      value={allergiesInput} 
                      onChange={(e) => setAllergiesInput(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none transition-colors"
                      placeholder="e.g. peanuts, dairy (comma separated)"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Meals per Day</label>
                    <select 
                      value={mealsPerDay} 
                      onChange={(e) => setMealsPerDay(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full bg-[#0b0e14] border border-white/8 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white text-xs outline-none transition-colors"
                    >
                      <option value={2}>2 Meals + Snacks</option>
                      <option value={3}>3 Meals</option>
                      <option value={4}>3 Meals + 1 Snack</option>
                      <option value={5}>4 Meals + 1 Snack</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2.5 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:scale-[1.01] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating Account & Generating Plans...
                    </>
                  ) : (
                    <>
                      Complete Sign Up & Generate Plans
                      <Sparkles className="h-4 w-4 text-yellow-300" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* DEMO BYPASS GATEWAY */}
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
