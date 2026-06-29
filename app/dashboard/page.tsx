'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Apple,
  ArrowRight,
  BarChart3,
  BookOpen,
  Dumbbell,
  Flame,
  LineChart,
  MessageSquare,
  Sparkles,
  User,
} from 'lucide-react';

interface MeResponse {
  onboarded?: boolean;
  role?: string;
  plan?: string;
  name?: string | null;
}

interface TodayResponse {
  consistency?: {
    currentStreak: number;
    weekPct: number;
    monthPct: number;
  };
  primaryAction?: {
    title: string;
    durationMin: number;
  };
}

interface GameResponse {
  level: number;
  levelTitle: string;
  xp: number;
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [game, setGame] = useState<GameResponse | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/v1/me').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/v1/today').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/v1/gamification').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([meJson, todayJson, gameJson]) => {
        if (!active) return;
        setMe(meJson?.data ?? null);
        setToday(todayJson?.data?.needsPlan ? null : todayJson?.data ?? null);
        setGame(gameJson?.data ?? null);
      })
      .catch(() => {
        if (!active) return;
        setMe(null);
        setToday(null);
        setGame(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayName = me?.name || 'Athlete';
  const streak = today?.consistency?.currentStreak ?? 0;
  const weekPct = today?.consistency?.weekPct ?? 0;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <section className="glass-panel rounded-2xl p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Dashboard</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              {displayName}, keep the plan moving.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              One place for the foundation flow: Today, training, diet, progress, exercise reference, coach, and profile.
            </p>
          </div>

          <div className="grid min-w-full grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-[#0b0e14]/60 p-3 text-center lg:min-w-[360px]">
            <Metric icon={Flame} label="Streak" value={`${streak}d`} />
            <Metric icon={BarChart3} label="Week" value={`${weekPct}%`} />
            <Metric icon={Sparkles} label="Level" value={game ? `${game.level}` : '1'} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActionCard
          href="/today"
          icon={Flame}
          title="Today"
          tone="cyan"
          description={today?.primaryAction ? `${today.primaryAction.title} · ${today.primaryAction.durationMin} min` : 'Open your adaptive daily plan.'}
        />
        <ActionCard
          href="/workout"
          icon={Dumbbell}
          title="Workout Planner"
          tone="purple"
          description="Review weekly training, check off exercises, and regenerate the plan."
        />
        <ActionCard
          href="/exercises"
          icon={BookOpen}
          title="Exercise Library"
          tone="emerald"
          description="Search movement instructions by muscle, equipment, and difficulty."
        />
        <ActionCard
          href="/diet"
          icon={Apple}
          title="Meal Planner"
          tone="emerald"
          description="Generate Indian meal plans, recipes, and meal-photo macro estimates."
        />
        <ActionCard
          href="/progress"
          icon={LineChart}
          title="Progress Logs"
          tone="cyan"
          description="Track bodyweight, measurements, and progress photos."
        />
        <ActionCard
          href="/chat"
          icon={MessageSquare}
          title="AI Coach"
          tone="purple"
          description="Ask for schedule changes, motivation, and plan adjustments."
        />
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-gray-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profile and setup</h2>
              <p className="text-xs text-gray-400">
                {me?.onboarded ? 'Onboarding complete. Edit goals anytime.' : 'Finish onboarding to unlock plans.'}
              </p>
            </div>
          </div>
          <Link
            href={me?.onboarded ? '/profile' : '/welcome'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-gray-200 hover:bg-white/10"
          >
            {me?.onboarded ? 'Edit profile' : 'Finish setup'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <Icon className="mx-auto h-4 w-4 text-cyan-300" />
      <p className="mt-1 text-lg font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}

function ActionCard({
  description,
  href,
  icon: Icon,
  title,
  tone,
}: {
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  tone: 'cyan' | 'purple' | 'emerald';
}) {
  const color =
    tone === 'cyan'
      ? 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10'
      : tone === 'purple'
        ? 'text-purple-300 border-purple-500/20 bg-purple-500/10'
        : 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10';

  return (
    <Link href={href} className="glass-panel rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div className={`rounded-xl border p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-gray-500" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{description}</p>
    </Link>
  );
}
