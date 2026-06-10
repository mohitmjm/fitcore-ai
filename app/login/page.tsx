'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/nextjs';

function LoginContent() {
  // Auth Tab Selection — default to 'signup' (Get Started)
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'signin' || tab === 'signup') {
        setActiveTab(tab);
      }
    }
  }, []);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="absolute inset-0 -top-40 bg-gradient-radial-neon opacity-30 pointer-events-none -z-10" />
      
      <div className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
        <div className="absolute -top-10 -right-10 h-28 w-28 bg-cyan-500/10 blur-2xl rounded-full" />
        
        {/* BRAND HEADER */}
        <div className="text-center space-y-2 w-full">
          <div className="flex justify-center py-2">
            <img src="/logo.png" alt="FitCore AI" className="h-24 w-auto object-contain" />
          </div>
          <p className="text-xs text-gray-400">Your AI-Powered Personal Fitness Ecosystem</p>
        </div>

        {/* AUTH MODE NAVIGATION TABS */}
        <div className="flex bg-[#0b0e14]/60 border border-white/5 p-1 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'signin' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'signup' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Get Started
          </button>
        </div>

        {/* CLERK EMBEDDED AUTH FORM */}
        <div className="w-full flex justify-center animate-[fadeIn_0.3s_ease]">
          {activeTab === 'signin' ? (
            <SignIn 
              routing="hash" 
              fallbackRedirectUrl="/"
              signUpUrl="/login?tab=signup"
            />
          ) : (
            <SignUp 
              routing="hash" 
              fallbackRedirectUrl="/onboarding"
              signInUrl="/login?tab=signin"
            />
          )}
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
