'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Dumbbell, CheckCircle2, Clock, Info, RotateCw, Sparkles, Award } from 'lucide-react';

interface PlanExercise {
  name: string;
  sets: number;
  reps: string | number;
  restSeconds: number;
  muscleGroup: string;
  tip: string;
}
interface PlanDay {
  day: string;
  focus?: string;
  exercises: PlanExercise[];
}
interface WorkoutPlan {
  days: PlanDay[];
  mode: string;
  generatedBy: string;
  weekOf: string;
}

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [today, setToday] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/plan');
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { plan: WorkoutPlan | null; completions: string[]; today: string };
      };
      setPlan(json.data?.plan ?? null);
      setCompleted(json.data?.completions ?? []);
      setToday(json.data?.today ?? new Date().toISOString().slice(0, 10));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleExercise(name: string, done: boolean) {
    // Optimistic update.
    setCompleted((prev) => (done ? [...prev, name] : prev.filter((n) => n !== name)));
    await fetch('/api/v1/plan', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ exerciseName: name, date: today, done }),
    });
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      await fetch('/api/v1/plan', { method: 'POST' });
      setSelectedDayIndex(0);
      await load();
    } finally {
      setRegenerating(false);
    }
  }

  if (!loaded) return <div className="text-center py-10 text-gray-400">Loading your plan…</div>;

  if (!plan || plan.days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-[fadeIn_0.4s_ease-out]">
        <div className="h-16 w-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center shadow-lg">
          <Dumbbell className="h-8 w-8 text-cyan-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">No workout plan yet</h2>
          <p className="text-gray-400 text-sm">Set your goal, experience, and equipment to generate a plan.</p>
        </div>
        <Link
          href="/profile"
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Set up profile &amp; generate plan
        </Link>
      </div>
    );
  }

  const selectedDay = plan.days[selectedDayIndex] ?? plan.days[0];
  const exercises = selectedDay?.exercises ?? [];
  const completedCount = exercises.filter((ex) => completed.includes(ex.name)).length;
  const progressPercent = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-cyan-400" />
            Training{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Workout Plan</span>
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm capitalize">
            {plan.mode !== 'normal' ? `${plan.mode} mode • ` : ''}Week of {new Date(plan.weekOf).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={regenerate}
          disabled={regenerating}
          className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating…' : 'Regenerate Plan'}
        </button>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto border-b border-[rgba(255,255,255,0.06)]">
        {plan.days.map((dayItem, index) => (
          <button
            key={index}
            onClick={() => setSelectedDayIndex(index)}
            className={`px-5 py-3 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${
              selectedDayIndex === index
                ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-400 text-cyan-400 shadow-md'
                : 'bg-white/2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {dayItem.focus ? `${dayItem.focus}` : `Day ${index + 1}`}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Today&apos;s Progress</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Completed {completedCount} of {exercises.length} exercises
            </p>
          </div>
        </div>
        <div className="w-full md:w-80 flex items-center gap-3">
          <div className="flex-1 h-3.5 bg-[#0b0e14] rounded-full border border-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-cyan-400 shrink-0 w-8 text-right">{progressPercent}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {exercises.map((exercise, index) => {
          const isCompleted = completed.includes(exercise.name);
          return (
            <div
              key={index}
              className={`glass-panel rounded-2xl p-5 md:p-6 transition-all duration-300 border ${
                isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[rgba(255,255,255,0.06)] hover:border-cyan-500/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleExercise(exercise.name, !isCompleted)}
                  className={`mt-1 h-6 w-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 hover:border-cyan-400 bg-white/2'
                  }`}
                >
                  {isCompleted && <CheckCircle2 className="h-4 w-4 stroke-white" />}
                </button>
                <div className="space-y-1.5 flex-1">
                  <h3 className={`text-base md:text-lg font-bold transition-all ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                    {exercise.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full font-medium">
                      {exercise.muscleGroup}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Dumbbell className="h-3 w-3" />
                      {exercise.sets} × {exercise.reps}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock className="h-3 w-3" />
                      {exercise.restSeconds}s rest
                    </span>
                  </div>
                  {exercise.tip && (
                    <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-start gap-2 text-xs text-gray-400">
                      <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <span className="font-semibold text-gray-300">Coach tip:</span> {exercise.tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {progressPercent === 100 && exercises.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-400/30 flex flex-col items-center justify-center text-center space-y-2 animate-[fadeIn_0.5s_ease-out]">
          <Award className="h-10 w-10 text-emerald-400 animate-bounce" />
          <h3 className="text-lg font-bold text-white">Day complete!</h3>
          <p className="text-xs text-gray-300 max-w-sm">Nice work. Log your meals and water to lock in the results.</p>
        </div>
      )}
    </div>
  );
}
