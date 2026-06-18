'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Lock,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  CalendarCheck,
} from 'lucide-react';

interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}
interface Gamification {
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  badges: Badge[];
  consistency: Consistency;
}
interface Consistency {
  currentStreak: number;
  longestStreak: number;
  activeToday: boolean;
  weekPct: number;
  monthPct: number;
  trend: 'up' | 'flat' | 'down';
  momentum: number;
  last7: number;
  last28: number;
  totalActiveDays: number;
}

export default function AchievementsPage() {
  const [game, setGame] = useState<Gamification | null>(null);
  const [c, setC] = useState<Consistency | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Single fetch: gamification returns the consistency snapshot it already computes.
      const g = await fetch('/api/v1/gamification').then((r) => (r.ok ? r.json() : null));
      if (g?.data) {
        const data = g.data as Gamification;
        setGame(data);
        setC(data.consistency);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const earned = game?.badges.filter((b) => b.earned).length ?? 0;
  const total = game?.badges.length ?? 0;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-400" />
          Achievements
        </h1>
        <p className="text-gray-400 mt-1.5 text-sm">Your level, streaks, and badges — earned by showing up.</p>
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
      ) : (
        <>
          {game && (
            <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{game.level}</span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Level {game.level}</p>
                    <h2 className="text-xl font-black text-white">{game.levelTitle}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-lg font-black text-cyan-300">
                    <Zap className="h-4 w-4" />
                    {game.xp} XP
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {earned}/{total} badges
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>
                    {game.xpIntoLevel} / {game.xpForNextLevel} XP
                  </span>
                  <span>Next: Lv {game.level + 1}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                    style={{ width: `${game.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {c && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Flame className="h-5 w-5 text-orange-400" />} label="Current streak" value={`${c.currentStreak}d`} />
              <StatCard icon={<Award className="h-5 w-5 text-yellow-400" />} label="Longest streak" value={`${c.longestStreak}d`} />
              <StatCard icon={<TrendIcon trend={c.trend} />} label="This week" value={`${c.weekPct}%`} />
              <StatCard icon={<CalendarCheck className="h-5 w-5 text-emerald-400" />} label="Active days" value={`${c.totalActiveDays}`} />
            </div>
          )}

          {game && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Badges</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {game.badges.map((b) => (
                  <div
                    key={b.id}
                    className={`glass-panel rounded-2xl p-5 border flex items-center gap-4 ${
                      b.earned ? 'border-yellow-400/30' : 'border-white/8 opacity-60'
                    }`}
                  >
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        b.earned ? 'bg-yellow-400/10 text-yellow-400' : 'bg-white/5 text-gray-500'
                      }`}
                    >
                      {b.earned ? <Award className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{b.label}</h3>
                      <p className="text-[11px] text-gray-400 leading-snug">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel rounded-2xl p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' }) {
  if (trend === 'up') return <TrendingUp className="h-5 w-5 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="h-5 w-5 text-amber-400" />;
  return <Minus className="h-5 w-5 text-gray-400" />;
}
