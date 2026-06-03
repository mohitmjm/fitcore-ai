'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Sparkles, Mail, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { localDb } from '@/lib/db';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Auth Steps
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  
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
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Trigger Send OTP API
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

      setStep('otp');
      setResendTimer(60);
      setCanResend(false);
      setSuccessMsg(data.message || 'OTP code sent! Check your email.');
      setIsMockMode(data.mockMode || false);

      // Save OTP to dev helper if returned (only in dev mode)
      if (data.devMode && data.code) {
        setDevOtp(data.code);
      }

      // Clear pin inputs
      setOtpPin(Array(6).fill(''));
      
      // Focus first pin input after step transitions (delay for DOM render)
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 150);

    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Verify OTP API
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

      // Successful verification -> Login
      localStorage.setItem('fitcore_logged_in', 'true');
      
      // Update email in local db profile
      const profile = localDb.getProfile();
      const needsProfileSetup = !profile.goal || profile.name === 'Flex Champion';
      
      localDb.updateProfile({
        email: email.trim(),
        name: profile.name === 'Flex Champion' ? email.split('@')[0] : profile.name
      });

      // Seed default plans if they don't exist
      const w = localDb.getWorkoutPlan();
      const d = localDb.getDietPlan();
      if (!w || !d) {
        seedMockData();
      }

      // Trigger profile reload event across application components
      window.dispatchEvent(new Event('fitcore_profile_updated'));

      setSuccessMsg('Successfully signed in!');
      
      // Redirect based on whether they need custom AI profile setups
      setTimeout(() => {
        if (needsProfileSetup) {
          router.push('/profile');
        } else {
          router.push('/');
        }
      }, 600);

    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid code.');
      // Keep inputs but focus the first one
      pinRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6-Pin input keyboard behavior
  const handlePinChange = (value: string, index: number) => {
    // Only accept numeric digits
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return;

    const newPin = [...otpPin];
    // Take only the last character (in case they write more)
    newPin[index] = numericValue.slice(-1);
    setOtpPin(newPin);

    // Auto-focus next input box
    if (index < 5 && newPin[index]) {
      pinRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are typed
    const combinedOtp = newPin.join('');
    if (combinedOtp.length === 6 && !newPin.includes('')) {
      handleVerifyOtp(combinedOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newPin = [...otpPin];
      
      if (!newPin[index] && index > 0) {
        // Current is already empty, delete previous and focus it
        newPin[index - 1] = '';
        setOtpPin(newPin);
        pinRefs.current[index - 1]?.focus();
      } else {
        // Clear current
        newPin[index] = '';
        setOtpPin(newPin);
      }
      e.preventDefault();
    }
  };

  // Handle clipboard paste of the 6-digit OTP code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setOtpPin(newPin);
      // Auto-submit
      handleVerifyOtp(pastedData);
    }
  };

  // Quick dev mode helper to auto-fill OTP
  const handleDevAutoFill = () => {
    if (devOtp) {
      const pins = devOtp.split('');
      setOtpPin(pins);
      handleVerifyOtp(devOtp);
    }
  };

  // Instant demo account setup (bypasses email validation for evaluation)
  const handleInstantDemo = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('fitcore_logged_in', 'true');
      
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

  // Seed default plans if database has no active records
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

        {/* FEEDBACK STATUS ALERTS */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        {successMsg && !errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* INTERACTIVE FORM SECTIONS */}
        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">Clerk-style Login</span>
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
                  Sending Code...
                </>
              ) : (
                <>
                  Send OTP Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setStep('email');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Edit Email
                </button>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full">
                  Step 2 of 2
                </span>
              </div>
              <p className="text-xs text-gray-400 pt-2 text-center">
                We sent a 6-digit OTP to <strong className="text-white">{email}</strong>
              </p>
            </div>

            {/* 6-DIGIT PIN INPUT COMPONENT */}
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
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>

            {/* DEV AUTOFILL WIDGET */}
            {devOtp && (
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-cyan-400 font-bold uppercase">⚡ Developer Auto-Fill</span>
                  <span className="text-gray-500 italic">Mock terminal logs</span>
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

            {/* OTP RESEND ACTIONS */}
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
