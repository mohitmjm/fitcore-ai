'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, User, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { localDb } from '@/lib/db';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Input fields
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('fitcore_logged_in', 'true');
      const profile = localDb.getProfile();
      if (!profile.name || profile.name === 'Flex Champion') {
        localDb.updateProfile({
          name: emailOrPhone.split('@')[0] || 'Champion',
          email: emailOrPhone.includes('@') ? emailOrPhone : 'user@fitcore.ai',
          phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined
        });
      }
      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setIsSubmitting(false);
      router.push('/');
    }, 800);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('fitcore_logged_in', 'true');
      localDb.updateProfile({
        name: name,
        email: emailOrPhone.includes('@') ? emailOrPhone : 'user@fitcore.ai',
        phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined
      });
      window.dispatchEvent(new Event('fitcore_profile_updated'));
      setIsSubmitting(false);
      router.push('/profile');
    }, 800);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
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
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account & Continue'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
