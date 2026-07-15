'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Brain,
  Flame,
  Camera,
  CalendarCheck,
  LineChart,
  ArrowRight,
  Check,
  Sparkles,
  Trophy,
  ShieldCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'A coach that remembers you',
    body: 'FitCore learns your goals, schedule, injuries, and what actually keeps you going — then adapts every day instead of handing you a static PDF.',
  },
  {
    icon: CalendarCheck,
    title: 'An adaptive “Today”',
    body: 'One screen that answers “what should I do right now?” — the right session for your energy, time, and momentum. No decision fatigue.',
  },
  {
    icon: Flame,
    title: 'Streaks that build consistency',
    body: 'Consistency is the whole game. Streaks, weekly/monthly rhythm, and a comeback system that picks you up instead of punishing a missed day.',
  },
  {
    icon: Camera,
    title: 'AI meal-photo logging',
    body: 'Snap your plate and get instant calorie + macro estimates with a healthier swap. Logging takes seconds, not minutes.',
  },
  {
    icon: Trophy,
    title: 'Habits, XP & achievements',
    body: 'Water, sleep, steps, mobility — tracked in a tap. Earn XP, levels, and badges for showing up, not for being perfect.',
  },
  {
    icon: LineChart,
    title: 'Progress you can see',
    body: 'Weight, measurements, and photos plotted over time so the slow, real changes stay visible and motivating.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Sign up in seconds',
    body: 'Create your account — no long forms, no credit card.',
  },
  {
    n: '02',
    title: '60-second setup',
    body: 'Tell us your goal, experience, equipment, and diet. The coach handles the rest, progressively.',
  },
  {
    n: '03',
    title: 'Just show up',
    body: 'Open Today, do the session, log a meal. FitCore adapts tomorrow based on what you did.',
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && <SignedInRedirect />}
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-20 -right-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-5">
        {/* Nav */}
        <nav className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="FitCore AI" className="h-12 w-auto object-contain" />
          </div>
          <div className="hidden sm:flex items-center gap-7 text-sm text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:scale-[1.03] transition-transform"
            >
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-10 items-center pt-12 pb-20">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              Your AI coach for staying consistent
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Fitness that adapts to
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> your real life.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
              FitCore AI is a coach that remembers you, plans your day, and keeps you consistent — through busy weeks,
              travel, and motivation dips. Not another tracker you abandon in three weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/sign-up"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_25px_rgba(6,182,212,0.25)]"
              >
                <Zap className="h-4 w-4" />
                Start free
              </Link>
              <a
                href="#how"
                className="px-6 py-3.5 rounded-xl border border-white/15 text-gray-200 font-bold flex items-center justify-center gap-2 hover:border-white/30 transition-colors"
              >
                See how it works
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Free to start · No credit card · Your data stays yours
            </div>
          </div>

          {/* Product mock: the Today card */}
          <div className="relative">
            <div className="glass-panel rounded-3xl border border-white/10 p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Today</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full">
                  <Trophy className="h-3 w-3" /> Lv 4 · Consistent
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                    <circle
                      cx="40"
                      cy="40"
                      r="33"
                      fill="none"
                      stroke="url(#g)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 33}
                      strokeDashoffset={2 * Math.PI * 33 * 0.25}
                      transform="rotate(-90 40 40)"
                    />
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="flex items-center gap-0.5 text-lg font-black text-white leading-none">
                      <Flame className="h-4 w-4 text-orange-400" />12
                    </span>
                    <span className="text-[8px] uppercase text-gray-400">streak</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">Upper body · 35 min</p>
                  <p className="text-xs text-gray-400 mt-0.5">Bench, rows, shoulders + core finisher</p>
                  <div className="mt-2 rounded-xl border border-purple-500/20 bg-purple-500/10 p-2.5 flex gap-2">
                    <Sparkles className="h-4 w-4 text-purple-300 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-purple-50 leading-snug">
                      A full week locked in. Showing up is the hard part — and you’re doing it.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['Water', 'Sleep', 'Steps', 'Mobility'].map((h) => (
                  <div key={h} className="rounded-xl border border-white/10 py-2 text-center">
                    <CalendarCheck className="h-4 w-4 mx-auto text-cyan-300" />
                    <span className="text-[9px] text-gray-400">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-white/8 py-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Bring your own AI</span>
          <div className="flex items-center gap-5 text-sm font-semibold text-gray-300">
            <span>OpenAI GPT</span>
            <span className="text-gray-600">·</span>
            <span>Anthropic Claude</span>
            <span className="text-gray-600">·</span>
            <span>Google Gemini</span>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white">Everything you need to actually stick with it</h2>
            <p className="text-gray-400">The app does the thinking. You just show up.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-panel rounded-2xl border border-white/10 p-6 space-y-3 hover:border-cyan-400/30 transition-colors">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-20 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-white">From signup to consistent in one day</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="glass-panel rounded-2xl border border-white/10 p-6 space-y-3">
                <span className="text-4xl font-black text-white/10">{s.n}</span>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Consistency differentiator */}
        <section className="py-16">
          <div className="glass-panel rounded-3xl border border-white/10 p-8 md:p-12 text-center space-y-4 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
            <Flame className="h-8 w-8 text-orange-400 mx-auto" />
            <h2 className="text-2xl md:text-4xl font-black text-white max-w-2xl mx-auto">
              Most apps optimize for workouts. We optimize for <span className="text-cyan-400">consistency.</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Results come from showing up over months, not from a perfect week you can’t repeat. FitCore is built around
              that one truth — and it’s why people stay.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-white">Start free. Upgrade when you’re ready.</h2>
            <p className="text-gray-400">No surprises, cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="glass-panel rounded-3xl border border-white/10 p-8 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white">Free</h3>
                <p className="text-3xl font-black text-white mt-2">₹0</p>
                <p className="text-xs text-gray-500">Everything you need to build the habit</p>
              </div>
              <ul className="space-y-2.5 text-sm text-gray-300">
                {['Adaptive Today screen', 'AI coach chat', 'Workout & meal plans', 'Streaks, habits & achievements', 'Progress tracking'].map((x) => (
                  <li key={x} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    {x}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block text-center py-3 rounded-xl bg-white text-black font-bold hover:scale-[1.02] transition-transform">
                Start free
              </Link>
            </div>

            <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/5 p-8 space-y-5 relative">
              <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-500/25 px-2 py-1 rounded-full">
                Coming soon
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Premium</h3>
                <p className="text-3xl font-black text-white mt-2">
                  ₹299<span className="text-sm font-medium text-gray-400">/mo</span>
                </p>
                <p className="text-xs text-gray-500">For when you want the full coach</p>
              </div>
              <ul className="space-y-2.5 text-sm text-gray-300">
                {['Everything in Free', 'Advanced AI coaching & memory', 'AI meal-photo analysis', 'WhatsApp coaching', 'Priority support'].map((x) => (
                  <li key={x} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    {x}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block text-center py-3 rounded-xl border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-500/10 transition-colors">
                Start free, upgrade later
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="rounded-3xl bg-gradient-to-r from-cyan-500 to-purple-500 p-8 md:p-14 text-center space-y-5">
            <h2 className="text-3xl md:text-5xl font-black text-white">Your most consistent year starts today.</h2>
            <p className="text-white/80 max-w-xl mx-auto">Join FitCore AI and let your coach handle the planning. You just have to show up.</p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-black text-white font-bold hover:scale-[1.03] transition-transform"
            >
              <Zap className="h-5 w-5 text-yellow-300" />
              Get started — it’s free
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-400">
            <Zap className="h-4 w-4" />
            FITCORE AI
          </span>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-gray-300">Features</a>
            <a href="#pricing" className="hover:text-gray-300">Pricing</a>
            <Link href="/sign-in" className="hover:text-gray-300">Sign in</Link>
          </div>
          <p>© 2026 FitCore AI</p>
        </footer>
      </div>
    </div>
  );
}

function SignedInRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/today');
  }, [isLoaded, isSignedIn, router]);
  return null;
}
