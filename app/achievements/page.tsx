'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, CalendarCheck, Check, Flame, LockKeyhole, Shield, Sparkles, Zap } from 'lucide-react';

interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  progress: number;
  target: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}
interface Consistency { currentStreak: number; longestStreak: number; activeToday: boolean; weekPct: number; monthPct: number; trend: 'up' | 'flat' | 'down'; momentum: number; last7: number; last28: number; totalActiveDays: number }
interface Gamification { xp: number; level: number; levelTitle: string; xpIntoLevel: number; xpForNextLevel: number; progressPct: number; badges: Badge[]; consistency: Consistency }

export default function AchievementsPage() {
  const [game, setGame] = useState<Gamification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/v1/gamification');
      const json = (await response.json()) as { data?: Gamification; error?: { message?: string } };
      if (!response.ok || !json.data) throw new Error(json.error?.message ?? 'Achievements could not load.');
      setGame(json.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Achievements could not load.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <div className="achievement-loading"><div className="skeleton-block" /><div className="skeleton-block" /></div>;
  if (error || !game) return <div className="state-panel error-state"><strong>Achievements unavailable</strong><p>{error}</p><button type="button" onClick={() => void load()}>Try again</button></div>;

  const earned = game.badges.filter((badge) => badge.earned);
  const upcoming = game.badges.filter((badge) => !badge.earned).sort((a, b) => (b.progress / b.target) - (a.progress / a.target));
  const c = game.consistency;

  return (
    <div className="page-stack achievements-page">
      <header className="achievement-header"><div><Link href="/world" className="back-link"><ArrowLeft />Fitness World</Link><span className="eyebrow">Meaningful milestones</span><h1>Achievements</h1><p>Recognition for showing up, improving safely, recovering well, and coming back. No reward requires extreme behavior.</p></div><div className="achievement-total"><Award /><span><strong>{earned.length}/{game.badges.length}</strong><small>badges earned</small></span></div></header>

      <section className="achievement-level-hero">
        <div className="achievement-level-mark"><span>{game.level}</span><i style={{ '--level-ring': `${game.progressPct * 3.6}deg` } as React.CSSProperties} /></div>
        <div className="achievement-level-copy"><span className="eyebrow">Level {game.level}</span><h2>{game.levelTitle}</h2><p>Your identity level is built from verified fitness actions with daily caps and duplicate protection.</p><div className="achievement-xp-bar"><span><strong>{game.xp.toLocaleString()} total XP</strong><small>{game.xpIntoLevel}/{game.xpForNextLevel} to level {game.level + 1}</small></span><div><i style={{ width: `${game.progressPct}%` }} /></div></div></div>
        <div className="achievement-rhythm"><div><Flame /><span><strong>{c.currentStreak}</strong><small>current rhythm</small></span></div><div><Shield /><span><strong>{c.longestStreak}</strong><small>longest rhythm</small></span></div><div><CalendarCheck /><span><strong>{c.totalActiveDays}</strong><small>active days</small></span></div></div>
      </section>

      {upcoming.length > 0 && <section className="upcoming-achievement"><span><Sparkles /></span><div><small>Closest unlock</small><h2>{upcoming[0].label}</h2><p>{upcoming[0].description}</p><div><i style={{ width: `${Math.round((upcoming[0].progress / upcoming[0].target) * 100)}%` }} /></div></div><strong>{upcoming[0].progress}/{upcoming[0].target}</strong></section>}

      <section className="achievement-library"><div className="world-section-heading"><div><span className="eyebrow">Your badge library</span><h2>Progress worth remembering</h2></div><span className="achievement-safety"><Shield />Consistency over intensity</span></div><div className="achievement-grid">{game.badges.map((badge) => { const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100)); return <article key={badge.id} className={`achievement-card rarity-${badge.rarity} ${badge.earned ? 'is-earned' : 'is-locked'}`}><div className="achievement-badge-visual">{badge.earned ? <Award /> : <LockKeyhole />}<span>{badge.rarity}</span></div><div className="achievement-card-copy"><div><span>{badge.earned ? <><Check />Unlocked</> : `${pct}% complete`}</span><small><Zap />+{badge.xpReward} XP</small></div><h3>{badge.label}</h3><p>{badge.description}</p><div className="badge-progress"><i style={{ width: `${pct}%` }} /></div><small>{badge.progress} / {badge.target}</small></div></article>; })}</div></section>

      <aside className="healthy-streak-note"><Flame /><div><strong>Your rhythm is protected.</strong><p>Rest days, recovery choices, and returning after a missed week are part of a healthy fitness identity. Fitcore never uses shame to preserve a number.</p></div><Link href="/today">View today <ArrowLeft /></Link></aside>
    </div>
  );
}
