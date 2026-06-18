'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ComponentType } from 'react';
import {
  Dumbbell,
  Utensils,
  Droplet,
  Scale,
  Sparkles,
  RefreshCw,
  HeartPulse,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Moon,
  Footprints,
  Brain,
  Activity,
  Send,
  Trophy,
} from 'lucide-react';

// ---- Local DTOs (never import server services into a client component) -----------------
interface Exercise {
  name: string;
  sets: number;
  reps: string | number;
}
interface Consistency {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  weekPct: number;
  monthPct: number;
  trend: 'up' | 'flat' | 'down';
  momentum: number;
}
interface TodayCard {
  date: string;
  mode: string;
  greeting: string;
  primaryAction: { kind: string; title: string; durationMin: number; exercises: Exercise[] };
  why: string;
  quickLogs: string[];
  momentum: { label: string; level: number };
  insight?: string;
  consistency?: Consistency;
}
interface HabitState {
  habit: string;
  value: number;
  goal: number;
  unit: string;
  label: string;
  step: number;
  done: boolean;
}
interface HabitDay {
  date: string;
  habits: HabitState[];
}
interface Gamification {
  xp: number;
  level: number;
  levelTitle: string;
  progressPct: number;
}

type ViewState = 'loading' | 'card' | 'needsPlan' | 'auth' | 'error';

const QUICK_LOG_META: Record<string, { icon: ComponentType<{ className?: string }>; label: string }> = {
  workout: { icon: Dumbbell, label: 'Workout' },
  meal: { icon: Utensils, label: 'Meal' },
  water: { icon: Droplet, label: 'Water' },
  weight: { icon: Scale, label: 'Weight' },
};

const HABIT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  water: Droplet,
  sleep: Moon,
  steps: Footprints,
  meditation: Brain,
  stretch: Activity,
};

// ---- Consistency ring -------------------------------------------------------------------
function Ring({ pct, size = 92 }: { pct: number; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = c - (clamped / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-amber-400" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
}

export default function TodayPage() {
  const [view, setView] = useState<ViewState>('loading');
  const [card, setCard] = useState<TodayCard | null>(null);
  const [habits, setHabits] = useState<HabitState[]>([]);
  const [game, setGame] = useState<Gamification | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [goal, setGoal] = useState('muscle gain');
  const [coachMsg, setCoachMsg] = useState('');
  const [coachReply, setCoachReply] = useState('');
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1600);
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/habits');
      const json = (await res.json()) as { data?: HabitDay };
      if (json.data?.habits) setHabits(json.data.habits);
    } catch {
      /* habits are non-critical for the Today render */
    }
  }, []);

  const loadGame = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/gamification');
      const json = (await res.json()) as { data?: Gamification };
      if (json.data) setGame(json.data);
    } catch {
      /* gamification is non-critical for the Today render */
    }
  }, []);

  const loadToday = useCallback(async () => {
    setView('loading');
    try {
      const res = await fetch('/api/v1/today');
      if (res.status === 401) {
        setView('auth');
        return;
      }
      const json = (await res.json()) as {
        data?: TodayCard | { needsPlan?: boolean };
        error?: { message: string };
      };
      if (json.error || !json.data) {
        setView('error');
        return;
      }
      if ('needsPlan' in json.data && json.data.needsPlan) {
        setView('needsPlan');
        return;
      }
      setCard(json.data as TodayCard);
      setView('card');
      loadHabits();
      loadGame();
    } catch {
      setView('error');
    }
  }, [loadHabits, loadGame]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  async function generatePlan() {
    setBusy(true);
    await fetch('/api/v1/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ goal, experience: 'beginner', equipment: ['bodyweight'], daysPerWeek: 3 }),
    });
    setBusy(false);
    loadToday();
  }

  async function quickLog(type: string) {
    showToast(`Logged ${type}`);
    await fetch('/api/v1/logs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    loadToday();
  }

  async function tapHabit(habit: string) {
    // optimistic bump
    setHabits((prev) =>
      prev.map((h) => (h.habit === habit ? { ...h, value: h.value + h.step, done: h.value + h.step >= h.goal } : h)),
    );
    try {
      const res = await fetch('/api/v1/habits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ habit, action: 'increment' }),
      });
      const json = (await res.json()) as { data?: HabitDay };
      if (json.data?.habits) setHabits(json.data.habits);
    } catch {
      /* keep optimistic value */
    }
  }

  async function askCoach() {
    if (!coachMsg.trim()) return;
    setBusy(true);
    setCoachReply('');
    try {
      const res = await fetch('/api/v1/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: coachMsg }),
      });
      const json = (await res.json()) as { data?: { reply: string }; error?: { message: string } };
      setCoachReply(json.data?.reply ?? json.error?.message ?? 'No reply.');
    } catch {
      setCoachReply('Something went wrong.');
    }
    setBusy(false);
  }

  const c = card?.consistency;
  const prettyDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">{prettyDate}</p>
          {game ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full">
              <Trophy className="h-3 w-3" /> Lv {game.level} · {game.levelTitle}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">FitCore AI</span>
          )}
        </div>
        <h1 className="text-2xl font-black text-white">
          {view === 'card' && card ? card.greeting : 'Today'}
        </h1>
      </header>

      {view === 'loading' && (
        <div className="space-y-3">
          <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      )}

      {view === 'auth' && (
        <div className="glass-panel rounded-2xl border border-white/10 p-6 text-center space-y-2">
          <p className="text-white font-bold">Sign in to see your Today</p>
          <p className="text-sm text-gray-400">Use the Sign up button (top-right) to create your account.</p>
        </div>
      )}

      {view === 'error' && (
        <div className="glass-panel rounded-2xl border border-red-500/20 p-6 text-sm text-red-300">
          Couldn&apos;t load Today. Try refreshing.
        </div>
      )}

      {view === 'needsPlan' && (
        <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="h-5 w-5" />
            <span className="font-bold">Let&apos;s build your first plan</span>
          </div>
          <p className="text-sm text-gray-400">Pick your main goal and I&apos;ll generate a starter plan in seconds.</p>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="muscle gain">Build muscle</option>
            <option value="weight loss">Lose fat</option>
            <option value="endurance">Improve endurance</option>
            <option value="general fitness">General fitness</option>
          </select>
          <button
            onClick={generatePlan}
            disabled={busy}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-black text-sm rounded-xl disabled:opacity-60"
          >
            {busy ? 'Generating…' : 'Generate my plan'}
          </button>
        </div>
      )}

      {view === 'card' && card && (
        <div className="space-y-5">
          {/* Consistency hero — the North Star, front and center */}
          {c && (
            <div className="glass-panel rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center">
                  <Ring pct={c.monthPct} />
                  <div className="absolute flex flex-col items-center">
                    <span className="flex items-center gap-1 text-2xl font-black text-white leading-none">
                      <Flame className={`h-5 w-5 ${c.currentStreak > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
                      {c.currentStreak}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-0.5">day streak</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">This week</span>
                    <span className="text-sm font-bold text-cyan-300">{c.weekPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                      style={{ width: `${c.weekPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">This month</span>
                    <span className="text-sm font-bold text-purple-300">{c.monthPct}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-gray-400">
                    <TrendIcon trend={c.trend} />
                    <span>
                      {c.trend === 'up' ? 'Trending up' : c.trend === 'down' ? 'Easing off' : 'Holding steady'} · best{' '}
                      {c.longestStreak}d
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coach Insight */}
          {card.insight && (
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 p-4 flex gap-3">
              <Sparkles className="h-5 w-5 text-purple-300 shrink-0 mt-0.5" />
              <p className="text-sm text-purple-50 leading-relaxed font-medium">{card.insight}</p>
            </div>
          )}

          {/* Primary action — "what should I do right now?" */}
          <div className="glass-panel rounded-2xl border border-cyan-500/20 p-5 space-y-4 shadow-[0_0_25px_rgba(6,182,212,0.08)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-purple-300 font-bold">
                {card.mode === 'normal' ? 'Today’s focus' : `${card.mode} mode`}
              </span>
              <span className="text-xs text-gray-400">{card.primaryAction.durationMin} min</span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              {card.primaryAction.kind === 'recovery' ? (
                <HeartPulse className="h-5 w-5 text-emerald-400" />
              ) : (
                <Dumbbell className="h-5 w-5 text-cyan-400" />
              )}
              {card.primaryAction.title}
            </h2>

            {card.primaryAction.exercises.length > 0 && (
              <ul className="space-y-1.5">
                {card.primaryAction.exercises.map((ex, i) => (
                  <li key={i} className="flex justify-between text-sm border-b border-white/5 pb-1.5">
                    <span className="text-gray-200">{ex.name}</span>
                    <span className="text-gray-400 font-mono text-xs">
                      {ex.sets} × {ex.reps}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-3">
              <a
                href="/workout"
                className="flex-1 text-center py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm rounded-xl hover:scale-[1.01] transition-transform"
              >
                Start session
              </a>
              <button
                onClick={() => setShowWhy((s) => !s)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-2"
              >
                {showWhy ? 'Hide' : 'Why this?'}
              </button>
            </div>
            {showWhy && <p className="text-sm text-gray-400 leading-relaxed">{card.why}</p>}
          </div>

          {/* Habits */}
          {habits.length > 0 && (
            <div className="glass-panel rounded-2xl border border-white/10 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Daily habits</span>
              <div className="grid grid-cols-5 gap-2">
                {habits.map((h) => {
                  const Icon = HABIT_ICONS[h.habit] ?? Activity;
                  const pct = Math.min(100, Math.round((h.value / h.goal) * 100));
                  return (
                    <button
                      key={h.habit}
                      onClick={() => tapHabit(h.habit)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                        h.done
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                          : 'border-white/10 hover:border-cyan-400/40 text-gray-300 hover:text-cyan-300'
                      }`}
                      title={`${h.label}: ${h.value}/${h.goal} ${h.unit} (tap +${h.step})`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-semibold">{h.label}</span>
                      <span className="text-[9px] text-gray-500">
                        {h.value}/{h.goal}
                      </span>
                      <div className="h-1 w-8 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${h.done ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick logs */}
          <div className="grid grid-cols-4 gap-2">
            {card.quickLogs.map((t) => {
              const meta = QUICK_LOG_META[t];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <button
                  key={t}
                  onClick={() => quickLog(t)}
                  className="flex flex-col items-center gap-1.5 py-3 glass-panel rounded-xl border border-white/10 hover:border-cyan-400/40 text-gray-300 hover:text-cyan-300 transition-all"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Coach */}
          <div className="glass-panel rounded-2xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Ask your coach</span>
            </div>
            <div className="flex gap-2">
              <input
                value={coachMsg}
                onChange={(e) => setCoachMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askCoach()}
                placeholder="e.g. I only have 15 minutes today"
                className="flex-1 bg-[#0b0e14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
              />
              <button
                onClick={askCoach}
                disabled={busy}
                className="px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-1"
              >
                {busy ? '…' : <Send className="h-4 w-4" />}
              </button>
            </div>
            {coachReply && <p className="text-sm text-gray-300 leading-relaxed">{coachReply}</p>}
          </div>

          <button
            onClick={loadToday}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 py-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-cyan-500 text-black text-xs font-bold shadow-lg">
          {toast} ✓
        </div>
      )}
    </div>
  );
}
