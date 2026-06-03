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
  Award,
  X,
  Shuffle
} from 'lucide-react';
import { localDb, WorkoutPlan, WorkoutDay, WorkoutExercise } from '@/lib/db';

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [todayStr, setTodayStr] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // AI Swap Modal States
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swappingExercise, setSwappingExercise] = useState<WorkoutExercise | null>(null);
  const [swapAlternatives, setSwapAlternatives] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [swapError, setSwapError] = useState('');

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

  const handleOpenSwapModal = async (exercise: WorkoutExercise) => {
    setSwappingExercise(exercise);
    setIsSwapModalOpen(true);
    setLoadingAlternatives(true);
    setSwapAlternatives([]);
    setSwapError('');

    try {
      const profile = localDb.getProfile();
      const res = await fetch('/api/swap-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: exercise.name,
          muscleGroup: exercise.muscle_group,
          goal: profile.goal || 'muscle gain',
          language: profile.language || 'english'
        })
      });
      
      const data = await res.json();
      if (res.ok && data.alternatives) {
        setSwapAlternatives(data.alternatives);
      } else {
        throw new Error(data.error || 'Failed to fetch alternative exercises');
      }
    } catch (err: any) {
      console.warn("Swap exercise API failed, using client-side generator:", err);
      const profile = localDb.getProfile();
      
      // Seed 3 biomechanically matched exercises client side
      const list = [
        {
          name: `Dumbbell ${exercise.name} Alternate`,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          type: 'Free Weight',
          tip: profile.language === 'hinglish' 
            ? 'Stabilizers ko target karein. Spine straight aur abdominal core squeeze rakhein.' 
            : 'Target stabilizers. Keep spine straight and abdominal core tight.'
        },
        {
          name: `Machine / Cable ${exercise.name} Swapped`,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.rest_seconds,
          type: 'Machine/Cable',
          tip: profile.language === 'hinglish' 
            ? 'Cable control aur constant resistance tension squeeze par focus karein.' 
            : 'Focus on cable control and constant mechanical tension throughout execution.'
        },
        {
          name: `Bodyweight Joint-Friendly ${exercise.name}`,
          sets: exercise.sets,
          reps: "12-15",
          rest_seconds: 60,
          type: 'Bodyweight/Joint-Friendly',
          tip: profile.language === 'hinglish' 
            ? 'Joint tension drop karne ke liye slow negatives use karein. Form correct rakhein.' 
            : 'Use slow negatives to drop joint tension. Maintain correct form.'
        }
      ];
      setSwapAlternatives(list);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleSelectSwap = (alternative: any) => {
    if (!plan || !swappingExercise) return;

    // Replace selected exercise in plan_data
    const updatedPlanData = plan.plan_data.map((dayItem, dIdx) => {
      if (dIdx !== selectedDayIndex) return dayItem;

      return {
        ...dayItem,
        exercises: dayItem.exercises.map(ex => {
          if (ex.name !== swappingExercise.name) return ex;

          return {
            name: alternative.name,
            sets: Number(alternative.sets) || ex.sets,
            reps: alternative.reps || ex.reps,
            rest_seconds: Number(alternative.rest_seconds) || ex.rest_seconds,
            muscle_group: ex.muscle_group,
            tip: alternative.tip || ex.tip
          };
        })
      };
    });

    const updatedPlan: WorkoutPlan = {
      ...plan,
      plan_data: updatedPlanData,
      updated_at: new Date().toISOString()
    };

    // Save back to local cache & React state
    localStorage.setItem('fitcore_workout_plan', JSON.stringify(updatedPlan));
    setPlan(updatedPlan);
    
    // Close modal
    setIsSwapModalOpen(false);
    setSwappingExercise(null);
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

                {/* AI SWAP TRIGGER BUTTON */}
                <button
                  onClick={() => handleOpenSwapModal(exercise)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 hover:border-cyan-500/40 text-[10px] font-bold text-cyan-400 uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                >
                  <Shuffle className="h-3 w-3 animate-[spin-slow_4s_linear_infinite]" />
                  <span>AI Swap</span>
                </button>
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

      {/* BIOMECHANICAL SWAP MODAL */}
      {isSwapModalOpen && swappingExercise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden p-6 md:p-8 space-y-6 relative border border-white/10 animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shuffle className="h-5 w-5 text-cyan-400" />
                  AI Exercise Swapper
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Biomechanically equivalent plateau-busters for <span className="text-cyan-400 font-semibold">{swappingExercise.name}</span> ({swappingExercise.muscle_group}).
                </p>
              </div>
              <button 
                onClick={() => setIsSwapModalOpen(false)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingAlternatives ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <RotateCw className="h-8 w-8 text-cyan-400 animate-spin" />
                <p className="text-xs text-cyan-300 italic animate-pulse">Consulting AI coach... mapping target load paths...</p>
              </div>
            ) : swapError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {swapError}
              </div>
            ) : (
              <div className="space-y-3.5">
                {swapAlternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSwap(alt)}
                    className="p-4 rounded-2xl bg-white/3 hover:bg-cyan-500/5 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-bold uppercase tracking-wider">
                          {alt.type || 'Alternative'}
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors mt-1">
                          {alt.name}
                        </h4>
                      </div>
                      
                      <div className="text-right text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        <p>{alt.sets} Sets x {alt.reps} Reps</p>
                        <p className="mt-0.5">{alt.rest_seconds}s Rest</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-2.5 pt-2.5 border-t border-white/5 leading-relaxed italic">
                      "Coach Tip: {alt.tip}"
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
