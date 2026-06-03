'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 items-center justify-center shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-3">
            FITCORE <span className="text-cyan-400">AI</span>
          </h2>
          <p className="text-xs text-gray-400">Your AI-Powered Personal Fitness Ecosystem</p>
        </div>
      </div>
    </div>
  );
}
