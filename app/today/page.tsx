'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Bot, Check, Clock3, Droplet, Dumbbell, Flame, Footprints, Moon, Plus, RefreshCw, Scale, Sparkles, Trophy, Utensils } from 'lucide-react';
import type { ReadinessInput, ReadinessSnapshot } from '@/lib/services/readiness/types';

interface Exercise { name: string; sets: number; reps: string | number }
interface Consistency { currentStreak: number; longestStreak: number; activeToday: boolean; weekPct: number; monthPct: number; trend: 'up' | 'flat' | 'down'; momentum: number }
interface TodayCard { date: string; mode: string; greeting: string; primaryAction: { kind: string; title: string; durationMin: number; exercises: Exercise[] }; why: string; quickLogs: string[]; momentum: { label: string; level: number }; insight?: string; consistency?: Consistency; readiness?: ReadinessSnapshot | null }
interface HabitState { habit: string; value: number; goal: number; unit: string; label: string; step: number; done: boolean }
interface Gamification { xp: number; level: number; levelTitle: string; progressPct: number }
type ViewState = 'loading' | 'card' | 'needsPlan' | 'auth' | 'error';

const HABIT_ICONS = { water: Droplet, sleep: Moon, steps: Footprints, meditation: Sparkles, stretch: Activity };
const LOG_META = { workout: { icon: Dumbbell, label: 'Workout' }, meal: { icon: Utensils, label: 'Meal' }, water: { icon: Droplet, label: 'Water' }, weight: { icon: Scale, label: 'Weight' } };
const DEFAULT_READINESS: ReadinessInput = { energy: 3, sleepHours: 7, soreness: 2, stress: 2, timeMinutes: 30 };
const ENERGY_LABELS = ['Empty', 'Low', 'Okay', 'Good', 'Flying'];
const SORENESS_LABELS = ['Fresh', 'Light', 'Noticeable', 'Very sore', 'Maxed'];
const STRESS_LABELS = ['Calm', 'Light', 'Some', 'High', 'Overloaded'];

function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return <div className="today-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} /><circle className="value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} /></svg><div><strong>{value}%</strong><small>{label}</small></div></div>;
}

export default function TodayPage() {
  const [view, setView] = useState<ViewState>('loading');
  const [card, setCard] = useState<TodayCard | null>(null);
  const [habits, setHabits] = useState<HabitState[]>([]);
  const [game, setGame] = useState<Gamification | null>(null);
  const [draftCount, setDraftCount] = useState(0);
  const [goal, setGoal] = useState('muscle gain');
  const [busy, setBusy] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [readinessBusy, setReadinessBusy] = useState(false);
  const [readinessDraft, setReadinessDraft] = useState<ReadinessInput>(DEFAULT_READINESS);
  const [toast, setToast] = useState('');

  const showToast = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); }, []);
  const load = useCallback(async () => {
    setView('loading');
    try {
      const [todayRes, habitsRes, gameRes, draftRes] = await Promise.all([
        fetch('/api/v1/today'), fetch('/api/v1/habits'), fetch('/api/v1/gamification'), fetch('/api/v1/workout-builder'),
      ]);
      if (todayRes.status === 401) { setView('auth'); return; }
      const todayJson = (await todayRes.json()) as { data?: TodayCard | { needsPlan?: boolean } };
      if (!todayJson.data) { setView('error'); return; }
      if ('needsPlan' in todayJson.data && todayJson.data.needsPlan) setView('needsPlan');
      else {
        const nextCard = todayJson.data as TodayCard;
        setCard(nextCard);
        if (nextCard.readiness?.checkin) setReadinessDraft(nextCard.readiness.checkin);
        setView('card');
      }
      const habitsJson = (await habitsRes.json()) as { data?: { habits?: HabitState[] } };
      const gameJson = (await gameRes.json()) as { data?: Gamification };
      const draftJson = (await draftRes.json()) as { data?: { workout?: { exercises?: unknown[] } } };
      setHabits(habitsJson.data?.habits ?? []); setGame(gameJson.data ?? null); setDraftCount(draftJson.data?.workout?.exercises?.length ?? 0);
    } catch { setView('error'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function generatePlan() {
    setBusy(true);
    try { await fetch('/api/v1/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ goal, experience: 'beginner', equipment: ['bodyweight'], daysPerWeek: 3 }) }); await load(); }
    finally { setBusy(false); }
  }

  async function quickLog(type: string) {
    showToast(`${type[0].toUpperCase()}${type.slice(1)} logged`);
    await fetch('/api/v1/logs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type }) });
    load();
  }

  async function tapHabit(habit: string) {
    setHabits((current) => current.map((item) => item.habit === habit ? { ...item, value: item.value + item.step, done: item.value + item.step >= item.goal } : item));
    const response = await fetch('/api/v1/habits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ habit, action: 'increment' }) });
    const json = (await response.json()) as { data?: { habits?: HabitState[] } };
    if (json.data?.habits) setHabits(json.data.habits);
  }

  async function saveReadiness() {
    setReadinessBusy(true);
    try {
      const response = await fetch('/api/v1/readiness', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(readinessDraft) });
      const json = (await response.json()) as { data?: ReadinessSnapshot };
      if (!response.ok || !json.data) throw new Error();
      setReadinessDraft(json.data.checkin);
      setReadinessOpen(false);
      await load();
      showToast(json.data.band === 'push' ? 'You’re cleared for the full session' : 'Today’s session has been adjusted');
    } catch {
      showToast('Could not save your readiness check-in');
    } finally {
      setReadinessBusy(false);
    }
  }

  const c = card?.consistency;
  const prettyDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page-stack today-page">
      <header className="today-header"><div><span className="eyebrow">{prettyDate}</span><h1>{card?.greeting ?? 'Your training day'}</h1><p>One focused action at a time. Fitcore adapts the rest.</p></div>{game && <div className="level-pill"><Trophy /><span><small>Level {game.level}</small><strong>{game.levelTitle}</strong></span><i style={{ '--level-progress': `${game.progressPct}%` } as React.CSSProperties} /></div>}</header>

      {view === 'loading' && <div className="today-loading"><div className="skeleton-block" /><div className="skeleton-block" /><div className="skeleton-block" /></div>}
      {view === 'error' && <div className="state-panel error-state"><strong>Today could not load</strong><p>Your data is safe. Check your connection and try again.</p><button type="button" onClick={load}><RefreshCw />Try again</button></div>}
      {view === 'auth' && <div className="state-panel"><strong>Sign in to see your plan</strong><p>Your workouts and consistency data are tied to your Fitcore profile.</p><Link href="/sign-in">Sign in</Link></div>}
      {view === 'needsPlan' && <section className="plan-setup-card"><span className="setup-icon"><Sparkles /></span><div><span className="eyebrow">First session</span><h2>Let’s build your starting plan.</h2><p>Choose your main goal. Fitcore will create a sensible beginner plan and adapt it as you log sessions.</p></div><label><span>Main goal</span><select value={goal} onChange={(event) => setGoal(event.target.value)}><option value="muscle gain">Build muscle</option><option value="weight loss">Lose fat</option><option value="endurance">Improve endurance</option><option value="general fitness">General fitness</option></select></label><button type="button" className="button-primary" onClick={generatePlan} disabled={busy}>{busy ? 'Building your plan…' : 'Generate my plan'}<ArrowRight /></button></section>}

      {view === 'card' && card && <>
        <section className="today-hero-grid">
          <article className="workout-hero-card">
            <div className="workout-hero-top"><span><i />{card.mode === 'normal' ? 'Today’s primary session' : `${card.mode} mode`}</span><strong><Clock3 />{card.primaryAction.durationMin} min</strong></div>
            <div className="workout-hero-title"><span><Dumbbell /></span><div><h2>{card.primaryAction.title}</h2><p>{card.primaryAction.exercises.length} movements planned{draftCount > 0 ? ` · ${draftCount} custom added` : ''}</p></div></div>
            <div className="workout-preview-list">{card.primaryAction.exercises.slice(0, 4).map((exercise, index) => <div key={`${exercise.name}-${index}`}><span>{String(index + 1).padStart(2,'0')}</span><strong>{exercise.name}</strong><small>{exercise.sets} × {exercise.reps}</small></div>)}{card.primaryAction.exercises.length === 0 && <p className="recovery-copy">A lighter recovery action is scheduled today. Follow the session guidance and keep the effort comfortable.</p>}</div>
            <div className="workout-hero-actions"><Link href="/workout" className="button-primary">Start session <ArrowRight /></Link><button type="button" className="button-secondary" onClick={() => setShowWhy((current) => !current)}>{showWhy ? 'Hide reason' : 'Why this workout?'}</button></div>
            {showWhy && <p className="why-copy"><Sparkles />{card.why}</p>}
          </article>

          <aside className="consistency-card"><div className="consistency-title"><span className="eyebrow">Consistency</span><Flame /></div>{c ? <><div className="consistency-main"><ProgressRing value={c.monthPct} label="this month" /><div><strong>{c.currentStreak}</strong><span>day streak</span><small>Personal best: {c.longestStreak} days</small></div></div><div className="week-progress"><span><small>This week</small><strong>{c.weekPct}%</strong></span><div><i style={{ width: `${c.weekPct}%` }} /></div></div><p className="trend-copy">{c.activeToday ? 'You have already moved today.' : c.trend === 'up' ? 'Your rhythm is improving.' : c.trend === 'down' ? 'A short session can protect your rhythm.' : 'You are holding a steady rhythm.'}</p></> : <p className="empty-copy">Complete your first activity to start tracking consistency.</p>}</aside>
        </section>

        <section className={`readiness-card ${card.readiness ? `is-${card.readiness.band}` : ''}`} aria-labelledby="readiness-title">
          <div className="readiness-summary">
            <span className="readiness-icon"><Activity /></span>
            <div><span className="eyebrow">Adaptive training</span><h2 id="readiness-title">{card.readiness?.title ?? 'How ready do you feel?'}</h2><p>{card.readiness?.message ?? 'A quick check-in makes today’s workout match your actual energy, recovery, and time.'}</p></div>
            {card.readiness ? <div className="readiness-score" aria-label={`Readiness score ${card.readiness.score} out of 100`}><strong>{card.readiness.score}</strong><small>ready</small></div> : null}
            <button type="button" className="readiness-toggle" onClick={() => setReadinessOpen((current) => !current)}>{readinessOpen ? 'Close' : card.readiness ? 'Update' : 'Check in'}</button>
          </div>

          {readinessOpen && <form className="readiness-form" onSubmit={(event) => { event.preventDefault(); void saveReadiness(); }}>
            <div className="readiness-field"><span>Energy</span><div className="readiness-scale">{ENERGY_LABELS.map((label, index) => { const value = (index + 1) as ReadinessInput['energy']; return <button type="button" key={label} className={readinessDraft.energy === value ? 'active' : ''} onClick={() => setReadinessDraft((current) => ({ ...current, energy: value }))} aria-pressed={readinessDraft.energy === value}><b>{value}</b><small>{label}</small></button>; })}</div></div>
            <div className="readiness-field"><span>Sleep last night</span><div className="readiness-options">{[[4, 'Under 5h'], [6, '5–6h'], [7, '7–8h'], [9, '8h+']].map(([hours, label]) => <button type="button" key={label} className={readinessDraft.sleepHours === hours ? 'active' : ''} onClick={() => setReadinessDraft((current) => ({ ...current, sleepHours: hours as number }))} aria-pressed={readinessDraft.sleepHours === hours}>{label}</button>)}</div></div>
            <div className="readiness-field"><span>Muscle soreness</span><div className="readiness-options readiness-options-wide">{SORENESS_LABELS.map((label, index) => { const value = (index + 1) as ReadinessInput['soreness']; return <button type="button" key={label} className={readinessDraft.soreness === value ? 'active' : ''} onClick={() => setReadinessDraft((current) => ({ ...current, soreness: value }))} aria-pressed={readinessDraft.soreness === value}>{label}</button>; })}</div></div>
            <div className="readiness-field"><span>Stress</span><div className="readiness-options readiness-options-wide">{STRESS_LABELS.map((label, index) => { const value = (index + 1) as ReadinessInput['stress']; return <button type="button" key={label} className={readinessDraft.stress === value ? 'active' : ''} onClick={() => setReadinessDraft((current) => ({ ...current, stress: value }))} aria-pressed={readinessDraft.stress === value}>{label}</button>; })}</div></div>
            <div className="readiness-field"><span>Time you have</span><div className="readiness-options">{[15, 30, 45, 60].map((minutes) => <button type="button" key={minutes} className={readinessDraft.timeMinutes === minutes ? 'active' : ''} onClick={() => setReadinessDraft((current) => ({ ...current, timeMinutes: minutes as ReadinessInput['timeMinutes'] }))} aria-pressed={readinessDraft.timeMinutes === minutes}>{minutes} min</button>)}</div></div>
            <div className="readiness-form-footer"><small>Training guidance only — not a medical score.</small><button type="submit" className="button-primary" disabled={readinessBusy}>{readinessBusy ? 'Adapting…' : 'Adapt my session'}<ArrowRight /></button></div>
          </form>}
        </section>

        {card.insight && <aside className="coach-insight"><span><Bot /></span><div><small>Fitcore AI recommendation</small><p>{card.insight}</p></div><Link href="/chat">Ask coach <ArrowRight /></Link></aside>}

        <section className="today-secondary-grid">
          <article className="habit-card"><div className="section-heading-row"><div><span className="eyebrow">Daily foundation</span><h2>Habits</h2></div><span className="habit-complete-count">{habits.filter((habit) => habit.done).length}/{habits.length || 0} complete</span></div>{habits.length ? <div className="habit-grid">{habits.map((habit) => { const Icon = HABIT_ICONS[habit.habit as keyof typeof HABIT_ICONS] ?? Activity; const pct = Math.min(100, Math.round((habit.value / habit.goal) * 100)); return <button type="button" key={habit.habit} className={habit.done ? 'done' : ''} onClick={() => tapHabit(habit.habit)}><span><Icon />{habit.done && <Check />}</span><strong>{habit.label}</strong><small>{habit.value}/{habit.goal} {habit.unit}</small><div><i style={{ width: `${pct}%` }} /></div></button>; })}</div> : <p className="empty-copy">Habit tracking will appear after your profile is ready.</p>}</article>
          <article className="quick-log-card"><div><span className="eyebrow">Keep data useful</span><h2>Quick log</h2><p>Small updates make tomorrow’s recommendations smarter.</p></div><div className="quick-log-grid">{card.quickLogs.map((type) => { const meta = LOG_META[type as keyof typeof LOG_META]; if (!meta) return null; const Icon = meta.icon; return <button type="button" key={type} onClick={() => quickLog(type)}><span><Icon /></span><strong>{meta.label}</strong><Plus /></button>; })}</div><Link href="/progress">View all progress <ArrowRight /></Link></article>
        </section>
      </>}

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
    </div>
  );
}
