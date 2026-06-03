'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Dumbbell, 
  CheckCircle2, 
  Clock, 
  Info, 
  RotateCw,
  Sparkles,
  HelpCircle,
  Calendar,
  Award
} from 'lucide-react';
import { localDb, WorkoutPlan, WorkoutDay, WorkoutExercise } from '@/lib/db';

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [todayStr, setTodayStr] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    // Get today's date formatted as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setTodayStr(today);
    
    // Load workout plan
    setPlan(localDb.getWorkoutPlan());
  }, []);

  const handleToggleExercise = (exerciseName: string, isChecked: boolean) => {
    if (!plan) return;
    
    const updated = localDb.completeExercise(exerciseName, todayStr, isChecked);
    if (updated) {
      setPlan(updated);
    }
  };

  const handleQuickRegenerate = async () => {
    setRegenerating(true);
    const profile = localDb.getProfile();
    
    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: profile.days_per_week || 4,
          experience: profile.experience || 'intermediate',
          goal: profile.goal || 'muscle gain',
          equipment: profile.equipment || 'gym',
          userId: profile.id
        })
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        const newPlan = localDb.saveWorkoutPlan(data.plan, profile.experience || 'intermediate');
        setPlan(newPlan);
        setSelectedDayIndex(0);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.warn("API regeneration failed, using local mock fallback:", err);
      // Client-side fallback
      const aiModule = await import('@/lib/ai');
      const wPrompt = `workout plan goal: ${profile.goal} level ${profile.experience} ${profile.days_per_week}-day equipment: ${profile.equipment}`;
      const wRaw = await aiModule.callAI(wPrompt);
      const parsed = JSON.parse(wRaw);
      const newPlan = localDb.saveWorkoutPlan(parsed, profile.experience || 'intermediate');
      setPlan(newPlan);
      setSelectedDayIndex(0);
    } finally {
      setRegenerating(false);
    }
  };

  if (!plan || !plan.plan_data || plan.plan_data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-[fadeIn_0.4s_ease-out]">
        <div className="h-16 w-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <Dumbbell className="h-8 w-8 text-cyan-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">No Workout Plan Found</h2>
          <p className="text-gray-400 text-sm">
            Setup your fitness goal, experience, and equipment to generate a customized training routine powered by AI.
          </p>
        </div>
        <Link
          href="/profile"
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Setup Profile & Generate Plan
        </Link>
      </div>
    );
  }

  const selectedDay: WorkoutDay = plan.plan_data[selectedDayIndex];
  const exercises: WorkoutExercise[] = selectedDay?.exercises || [];
  
  // Track how many exercises are completed for today in the active day view
  const completedTodayList = plan.completed_exercises?.[todayStr] || [];
  
  const completedCount = exercises.filter(ex => completedTodayList.includes(ex.name)).length;
  const progressPercent = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-cyan-400" />
            Training <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Workout Plan</span>
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm capitalize">
            Level: {plan.intensity_level} • Updated {new Date(plan.updated_at).toLocaleDateString()}
          </p>
        </div>
        
        <button
          onClick={handleQuickRegenerate}
          disabled={regenerating}
          className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating...' : 'Regenerate Plan'}
        </button>
      </div>

      {/* PLAN DAYS TABS SELECTOR */}
      <div className="flex gap-2 pb-2 overflow-x-auto border-b border-[rgba(255,255,255,0.06)]">
        {plan.plan_data.map((dayItem, index) => {
          const isSelected = selectedDayIndex === index;
          return (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-400 text-cyan-400 shadow-md'
                  : 'bg-white/2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              Day {index + 1}
            </button>
          );
        })}
      </div>

      {/* PROGRESS TRACKER */}
      <div className="glass-panel rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-5 justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Daily Workout Progress</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Completed {completedCount} of {exercises.length} exercises scheduled for today
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full md:w-80 flex items-center gap-3">
          <div className="flex-1 h-3.5 bg-[#0b0e14] rounded-full border border-white/5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-cyan-400 shrink-0 w-8 text-right">{progressPercent}%</span>
        </div>
      </div>

      {/* EXERCISES CHECKLIST GRID */}
      <div className="space-y-4">
        {exercises.map((exercise, index) => {
          const isCompleted = completedTodayList.includes(exercise.name);
          return (
            <div 
              key={index}
              className={`glass-panel rounded-2xl p-5 md:p-6 transition-all duration-300 border ${
                isCompleted 
                  ? 'border-emerald-500/30 bg-emerald-500/5 shadow-md shadow-emerald-950/10' 
                  : 'border-[rgba(255,255,255,0.06)] hover:border-cyan-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* CHECKBOX */}
                  <button
                    onClick={() => handleToggleExercise(exercise.name, !isCompleted)}
                    className={`mt-1 h-6 w-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                      isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-white/20 hover:border-cyan-400 bg-white/2'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="h-4 w-4 fill-emerald-500 stroke-white" />}
                  </button>
                  
                  <div className="space-y-1.5">
                    <h3 className={`text-base md:text-lg font-bold transition-all ${
                      isCompleted ? 'text-gray-400 line-through' : 'text-white'
                    }`}>
                      {exercise.name}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full font-medium">
                        {exercise.muscle_group}
                      </span>
                      
                      <span className="flex items-center gap-1 text-gray-400">
                        <Dumbbell className="h-3 w-3" />
                        {exercise.sets} Sets x {exercise.reps} Reps
                      </span>
                      
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-3 w-3" />
                        {exercise.rest_seconds}s Rest
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* TIP DROPDOWN */}
              {exercise.tip && (
                <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.04)] flex items-start gap-2 text-xs text-gray-400">
                  <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-semibold text-gray-300">Coach Form Tip:</span> {exercise.tip}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* SUCCESS CONFETTI CELEBRATION BOX */}
      {progressPercent === 100 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-400/30 flex flex-col items-center justify-center text-center space-y-2 animate-[fadeIn_0.5s_ease-out]">
          <Award className="h-10 w-10 text-emerald-400 animate-bounce" />
          <h3 className="text-lg font-bold text-white">Daily Routine Completed!</h3>
          <p className="text-xs text-gray-300 max-w-sm">
            Awesome job! You smashed today's workout. Make sure to log your meals and hydration to optimize your results.
          </p>
        </div>
      )}
    </div>
  );
}
