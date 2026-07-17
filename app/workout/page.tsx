'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, Award, Check, CheckCircle2, ChevronRight, Dumbbell, Gauge, HeartPulse, ListRestart, Pause, Play, Plus, RotateCw, ShieldAlert, SkipForward, Sparkles, TimerReset, Trophy, X, Zap } from 'lucide-react';
import MovementDemo from '@/components/exercises/MovementDemo';
import { EXERCISES } from '@/lib/exercises/catalog';
import type { Exercise } from '@/lib/exercises/types';

interface PlanExercise { name: string; sets: number; reps: string | number; restSeconds: number; muscleGroup: string; tip: string; slug?: string; weightKg?: number }
interface PlanDay { day: string; focus?: string; exercises: PlanExercise[] }
interface WorkoutPlan { days: PlanDay[]; mode: string; generatedBy: string; weekOf: string }
interface DraftExercise { exerciseId: string; slug: string; name: string; sets: number; reps: string; weightKg?: number; restSeconds: number; notes?: string }
interface SetLog { reps: string; weight: string; done: boolean }

function demoFor(exercise: PlanExercise): Pick<Exercise, 'name' | 'demoStyle'> {
  const match = EXERCISES.find((item) => item.slug === exercise.slug || item.name.toLowerCase() === exercise.name.toLowerCase());
  if (match) return match;
  const group = exercise.muscleGroup.toLowerCase();
  const demoStyle: Exercise['demoStyle'] = group.includes('leg') || group.includes('quad') ? 'squat' : group.includes('back') ? 'pull' : group.includes('core') ? 'core' : 'push';
  return { name: exercise.name, demoStyle };
}

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [draft, setDraft] = useState<DraftExercise[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [today, setToday] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [painOpen, setPainOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>({});
  const [restSeconds, setRestSeconds] = useState(0);
  const [restPaused, setRestPaused] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const [planRes, draftRes] = await Promise.all([fetch('/api/v1/plan'), fetch('/api/v1/workout-builder')]);
      const planJson = (await planRes.json()) as { data?: { plan: WorkoutPlan | null; completions: string[]; today: string } };
      const draftJson = (await draftRes.json()) as { data?: { workout?: { exercises?: DraftExercise[] } } };
      setPlan(planJson.data?.plan ?? null); setCompleted(planJson.data?.completions ?? []); setToday(planJson.data?.today ?? new Date().toISOString().slice(0,10)); setDraft(draftJson.data?.workout?.exercises ?? []);
    } finally { setLoaded(true); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedDay = plan?.days[selectedDayIndex] ?? plan?.days[0];
  const exercises = useMemo<PlanExercise[]>(() => {
    const base = selectedDay?.exercises ?? [];
    if (selectedDayIndex !== 0) return base;
    return [...base, ...draft.map((item) => ({ name: item.name, sets: item.sets, reps: item.reps, restSeconds: item.restSeconds, muscleGroup: 'Custom', tip: item.notes ?? '', slug: item.slug, weightKg: item.weightKg }))];
  }, [draft, selectedDay, selectedDayIndex]);
  const current = exercises[exerciseIndex];
  const completedCount = exercises.filter((item) => completed.includes(item.name)).length;
  const progressPercent = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0;
  const sessionTotals = useMemo(() => {
    let sets = 0; let volume = 0;
    for (const logs of Object.values(setLogs)) for (const log of logs) if (log.done) {
      sets += 1;
      volume += (Number.parseFloat(log.weight) || 0) * (Number.parseFloat(log.reps) || 0);
    }
    return { sets, volume: Math.round(volume), xp: Math.min(120, completedCount * 20), muscles: [...new Set(exercises.map((item) => item.muscleGroup))].slice(0, 5) };
  }, [completedCount, exercises, setLogs]);

  useEffect(() => {
    if (!current || setLogs[current.name]) return;
    setSetLogs((logs) => ({ ...logs, [current.name]: Array.from({ length: current.sets }, () => ({ reps: String(current.reps), weight: current.weightKg ? String(current.weightKg) : '', done: false })) }));
  }, [current, setLogs]);

  useEffect(() => {
    if (!restSeconds || restPaused) return;
    const timer = window.setInterval(() => setRestSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [restPaused, restSeconds]);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let released = false;
    let lock: { release: () => Promise<void> } | null = null;
    (navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen').then((value) => { if (released) void value.release(); else lock = value; }).catch(() => {});
    return () => { released = true; void lock?.release(); };
  }, [active]);

  async function setCompletion(name: string, done: boolean) {
    setCompleted((items) => done ? [...new Set([...items, name])] : items.filter((item) => item !== name));
    await fetch('/api/v1/plan', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ exerciseName: name, date: today, done }) });
  }

  async function regenerate() { setRegenerating(true); try { await fetch('/api/v1/plan', { method: 'POST' }); setSelectedDayIndex(0); await load(); } finally { setRegenerating(false); } }
  function startSession() { if (!exercises.length) return; setFinished(false); setFeedback(''); setFeedbackMessage(''); setActive(true); setExerciseIndex(0); setSetIndex(0); }
  function showMessage(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2000); }

  async function completeSet() {
    if (!current) return;
    const logs = setLogs[current.name] ?? [];
    const nextLogs = logs.map((log, index) => index === setIndex ? { ...log, done: true } : log);
    setSetLogs((all) => ({ ...all, [current.name]: nextLogs }));
    const lastSet = setIndex >= current.sets - 1;
    if (lastSet) {
      await setCompletion(current.name, true);
      showMessage(`${current.name} complete`);
      if (exerciseIndex < exercises.length - 1) { setExerciseIndex((index) => index + 1); setSetIndex(0); }
      else { setActive(false); setFinished(true); }
    } else {
      setSetIndex((index) => index + 1); setRestSeconds(current.restSeconds); setRestPaused(false);
    }
  }

  async function submitFeedback(value: string) {
    setFeedback(value);
    try {
      const response = await fetch('/api/v1/workout-feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ feedback: value, workoutDate: today }) });
      const json = (await response.json()) as { data?: { message?: string } };
      setFeedbackMessage(json.data?.message ?? 'Your next session will reflect this feedback.');
    } catch { setFeedbackMessage('Feedback saved on this screen. Try again later to sync it.'); }
  }

  if (!loaded) return <div className="workout-loading"><div className="skeleton-block" /><div className="skeleton-block" /></div>;
  if (!plan || plan.days.length === 0) return <div className="state-panel workout-empty"><span><Dumbbell /></span><strong>No workout plan yet</strong><p>Complete your profile so Fitcore can build a plan around your goal, experience, and equipment.</p><Link href="/profile">Set up profile <ArrowRight /></Link></div>;

  if (finished) return <div className="workout-summary-page">
    <header className="workout-summary-hero"><span className="summary-check"><Check /></span><div><span className="eyebrow">Session complete</span><h1>You moved the world forward.</h1><p>Progress comes from repeatable sessions like this one—not from emptying the tank every time.</p></div><span className="summary-xp"><Zap /><strong>+{sessionTotals.xp}</strong><small>verified XP</small></span></header>
    <div className="summary-stat-grid"><div><Activity /><span><small>Completed sets</small><strong>{sessionTotals.sets}</strong></span></div><div><Gauge /><span><small>Training volume</small><strong>{sessionTotals.volume ? `${sessionTotals.volume.toLocaleString()} kg` : 'Bodyweight'}</strong></span></div><div><Dumbbell /><span><small>Muscles trained</small><strong>{sessionTotals.muscles.length}</strong></span></div><div><Award /><span><small>Mission progress</small><strong>Updated</strong></span></div></div>
    <section className="summary-muscles"><div><span className="eyebrow">Training coverage</span><h2>Areas trained</h2></div><div>{sessionTotals.muscles.map((muscle) => <span key={muscle}>{muscle}</span>)}</div></section>
    <section className="effort-feedback"><div><span className="eyebrow">Adaptive difficulty</span><h2>How did that session feel?</h2><p>Fitcore changes one variable at a time. Pain always blocks automatic progression.</p></div><div className="effort-options">{[['too_easy','Too easy'],['appropriate','Appropriate'],['challenging','Challenging'],['too_difficult','Too difficult'],['pain','Pain or discomfort']].map(([value,label]) => <button type="button" key={value} className={feedback === value ? 'active' : value === 'pain' ? 'pain' : ''} onClick={() => void submitFeedback(value)}>{feedback === value && <Check />}{label}</button>)}</div>{feedbackMessage && <aside className={feedback === 'pain' ? 'feedback-result is-pain' : 'feedback-result'}><ShieldAlert />{feedbackMessage}</aside>}</section>
    <section className="summary-recovery"><HeartPulse /><div><span className="eyebrow">Recovery suggestion</span><h2>Refuel, hydrate, and keep the next hour easy.</h2><p>Your readiness check tomorrow will decide whether to build, repeat, or recover.</p></div><Link href="/world">Open Fitness World <ArrowRight /></Link></section>
    <div className="summary-actions"><button type="button" className="button-secondary" onClick={() => setFinished(false)}>Back to plan</button><Link href="/world" className="button-primary"><Trophy />Claim progress</Link></div>
  </div>;

  if (active && current) {
    const logs = setLogs[current.name] ?? [];
    const currentLog = logs[setIndex] ?? { reps: String(current.reps), weight: current.weightKg ? String(current.weightKg) : '', done: false };
    const overallPosition = Math.round(((exerciseIndex + (setIndex + 1) / current.sets) / exercises.length) * 100);
    return <div className="active-workout-shell">
      <header className="active-workout-header"><button type="button" onClick={() => setActive(false)}><X /></button><div><span>Active workout</span><strong>{selectedDay?.focus ?? selectedDay?.day}</strong></div><small>{exerciseIndex + 1}/{exercises.length}</small></header>
      <div className="active-progress"><i style={{ width: `${overallPosition}%` }} /></div>
      <main className="active-workout-grid">
        <section className="active-demo"><MovementDemo exercise={demoFor(current)} /><div className="now-playing"><span><i />Now training</span><strong>{current.muscleGroup}</strong></div></section>
        <section className="active-controls">
          <div className="exercise-counter"><span>Exercise {exerciseIndex + 1} of {exercises.length}</span><button type="button" onClick={() => { setExerciseIndex((index) => Math.min(exercises.length - 1, index + 1)); setSetIndex(0); }}>Skip <SkipForward /></button></div>
          <h1>{current.name}</h1>
          {current.tip && <p className="active-tip"><Sparkles />{current.tip}</p>}
          <div className="set-chip-row">{Array.from({ length: current.sets }, (_, index) => <span key={index} className={logs[index]?.done ? 'done' : index === setIndex ? 'active' : ''}>{logs[index]?.done ? <Check /> : index + 1}</span>)}</div>
          <div className="current-set-card"><div className="set-card-title"><span>Set {setIndex + 1}</span><small>{current.sets} total sets</small></div><div className="set-input-grid"><label><span>Reps</span><input inputMode="numeric" value={currentLog.reps} onChange={(event) => setSetLogs((all) => ({ ...all, [current.name]: logs.map((log,index) => index === setIndex ? { ...log, reps: event.target.value } : log) }))} /></label><label><span>Weight (kg)</span><input inputMode="decimal" placeholder="Bodyweight" value={currentLog.weight} onChange={(event) => setSetLogs((all) => ({ ...all, [current.name]: logs.map((log,index) => index === setIndex ? { ...log, weight: event.target.value } : log) }))} /></label></div><button type="button" className="complete-set-button" onClick={completeSet}><CheckCircle2 />{setIndex === current.sets - 1 ? 'Complete exercise' : 'Complete set'}<ArrowRight /></button></div>
          <div className="previous-performance"><Gauge /><div><small>Previous performance</small><strong>No set history yet</strong></div><span>First logged session</span></div>
          <div className="active-secondary-actions"><Link href={`/exercises?muscle=${encodeURIComponent(current.muscleGroup.toLowerCase())}`}><ListRestart />Replace exercise</Link><button type="button" onClick={() => setRestSeconds(current.restSeconds)}><TimerReset />Start rest</button><button type="button" className="report-pain" onClick={() => setPainOpen(true)}><AlertTriangle />Report pain</button></div>
        </section>
      </main>
      {restSeconds > 0 && <aside className="rest-overlay"><div className="rest-timer"><span>Rest</span><strong>{Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2,'0')}</strong><small>Next: set {Math.min(setIndex + 1, current.sets)} of {current.sets}</small></div><div className="rest-actions"><button type="button" onClick={() => setRestPaused((value) => !value)}>{restPaused ? <Play /> : <Pause />}{restPaused ? 'Resume' : 'Pause'}</button><button type="button" className="skip-rest" onClick={() => setRestSeconds(0)}>Skip rest <ArrowRight /></button></div></aside>}
      {painOpen && <div className="pain-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPainOpen(false)}><section className="pain-sheet" role="dialog" aria-modal="true" aria-labelledby="pain-title"><button type="button" className="pain-close" onClick={() => setPainOpen(false)} aria-label="Close pain guidance"><X /></button><span><AlertTriangle /></span><h2 id="pain-title">Pain changes the plan.</h2><p>Stop this movement if the pain is sharp, sudden, worsening, or affects balance. Fitcore will not progress load from a pain report.</p><ul><li><Check />End the set and unload safely</li><li><Check />Note where and when it hurt</li><li><Check />Choose a pain-free alternative only if appropriate</li></ul><button type="button" className="button-primary" onClick={() => { setPainOpen(false); setActive(false); setFinished(true); void submitFeedback('pain'); }}>End workout safely</button><Link href={`/chat?prompt=${encodeURIComponent(`I felt pain during ${current.name}. Help me stop safely and suggest questions to discuss with a qualified professional. Do not diagnose me.`)}`}>Ask the coach for safe next steps <ArrowRight /></Link><small>Chest pain, fainting, severe shortness of breath, or signs of a serious injury may require urgent medical care.</small></section></div>}
      {toast && <div className="app-toast"><Check />{toast}</div>}
    </div>;
  }

  return <div className="page-stack workout-page">
    <header className="workout-page-header"><div><span className="eyebrow">Living plan</span><h1>Workouts</h1><p>Week of {new Date(plan.weekOf).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })} · {plan.generatedBy === 'ai' ? 'AI personalized' : 'Fitcore foundation plan'}</p></div><button type="button" className="button-secondary" onClick={regenerate} disabled={regenerating}><RotateCw className={regenerating ? 'animate-spin' : ''} />{regenerating ? 'Regenerating…' : 'Regenerate plan'}</button></header>
    <div className="day-tabs">{plan.days.map((day,index) => <button type="button" key={`${day.day}-${index}`} className={selectedDayIndex === index ? 'active' : ''} onClick={() => setSelectedDayIndex(index)}><small>Day {index + 1}</small><strong>{day.focus ?? day.day}</strong>{selectedDayIndex === index && <i />}</button>)}</div>
    <section className="workout-overview-hero"><div><span className="workout-day-icon"><Dumbbell /></span><div><span className="eyebrow">Selected session</span><h2>{selectedDay?.focus ?? selectedDay?.day}</h2><p>{exercises.length} exercises · approximately {Math.max(20, exercises.length * 7)} minutes{draft.length && selectedDayIndex === 0 ? ` · ${draft.length} custom` : ''}</p></div></div><div className="overview-progress"><span><small>Completion</small><strong>{completedCount}/{exercises.length}</strong></span><div><i style={{ width: `${progressPercent}%` }} /></div></div><button type="button" className="button-primary" onClick={startSession}><Play />Start workout</button></section>
    <section className="workout-list-section"><div className="section-heading-row"><div><span className="eyebrow">Session order</span><h2>Exercises</h2></div><Link href="/exercises"><Plus />Add movement</Link></div><div className="workout-exercise-list">{exercises.map((exercise,index) => { const done = completed.includes(exercise.name); return <article key={`${exercise.name}-${index}`} className={done ? 'done' : ''}><button type="button" className="exercise-check" onClick={() => setCompletion(exercise.name,!done)} aria-label={done ? `Mark ${exercise.name} incomplete` : `Mark ${exercise.name} complete`}>{done && <Check />}</button><div className="exercise-order">{String(index + 1).padStart(2,'0')}</div><div className="exercise-list-copy"><strong>{exercise.name}</strong><span>{exercise.muscleGroup} · {exercise.sets} × {exercise.reps} · {exercise.restSeconds}s rest</span>{exercise.tip && <small>{exercise.tip}</small>}</div><button type="button" className="exercise-start" onClick={() => { setExerciseIndex(index); setSetIndex(0); setActive(true); }}><Play /><span>Start</span></button></article>; })}</div></section>
    {progressPercent === 100 && exercises.length > 0 && <aside className="workout-complete-banner"><span><Trophy /></span><div><strong>Session complete</strong><p>Your plan and consistency score have been updated.</p></div><Link href="/progress">View progress <ChevronRight /></Link></aside>}
  </div>;
}
