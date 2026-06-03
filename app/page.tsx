'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Dumbbell, 
  Apple, 
  LineChart, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Flame, 
  Target,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { localDb, UserProfile, WorkoutPlan, DietPlan, ProgressLog } from '@/lib/db';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [latestLog, setLatestLog] = useState<ProgressLog | null>(null);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayStr(today);
    
    // Load local DB states
    setProfile(localDb.getProfile());
    setWorkoutPlan(localDb.getWorkoutPlan());
    setDietPlan(localDb.getDietPlan());
    
    const logs = localDb.getProgressLogs();
    if (logs.length > 0) {
      setLatestLog(logs[logs.length - 1]);
    }
  }, []);

  // Quick fallback messages for user advice based on goals
  const getAiCoachAdvice = (goal: string) => {
    switch(goal) {
      case 'weight loss':
        return "Coach Tip: Drink 500ml water before meals. Keep your training intensity high and focus on compound lifts to maximize calorie burn.";
      case 'muscle gain':
        return "Coach Tip: Prioritize protein syntax. Aim for at least 30g protein in breakfast to kickstart muscle protein synthesis.";
      case 'endurance':
        return "Coach Tip: Focus on breathing cadences. Add steady-state cardio after weights to build aerobic capacity without burning muscle.";
      case 'flexibility':
        return "Coach Tip: Hold your static stretches for at least 30 seconds post-workout. Never stretch cold muscles.";
      default:
        return "Coach Tip: Consistency is the mother of mastery. Even a 20-minute workout beats a zero-minute workout.";
    }
  };

  const hasPlans = workoutPlan && dietPlan;

  if (!hasPlans) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center text-center space-y-8 max-w-2xl mx-auto px-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full scale-125" />
          <div className="relative h-20 w-20 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
            <Zap className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Welcome to <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">FitCore AI</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed">
            Your personal AI Fitness Companion. Create custom workouts, log meal plans, and chart your body progression with our self-hosted Llama coach.
          </p>
        </div>

        <div className="glass-panel border-white/5 rounded-2xl p-6 text-left space-y-4 w-full">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            AI Blueprint Ready For Generation
          </h2>
          <ul className="text-xs text-gray-400 space-y-2.5">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              Custom workout plan matching your experience and equipment
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              Indian meal plan mapped to calorie & macro requirements
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              AI coach chatbot for instant form advice and motivation
            </li>
          </ul>
        </div>

        <Link
          href="/profile"
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate My AI Blueprint
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Calculate workout metrics
  // We look at Day 1 exercises by default or today's checklist
  const todayExercises = workoutPlan.plan_data[0]?.exercises || [];
  const completedTodayList = workoutPlan.completed_exercises?.[todayStr] || [];
  const exercisesCompletedCount = todayExercises.filter(ex => completedTodayList.includes(ex.name)).length;
  
  // Calculate diet metrics
  const dietDay = dietPlan.plan_data[0]; // Display Monday or Day 1 as active dashboard logs
  const totalCals = 
    (dietDay?.breakfast?.calories || 0) + 
    (dietDay?.lunch?.calories || 0) + 
    (dietDay?.dinner?.calories || 0) + 
    (dietDay?.snacks?.calories || 0);
  const totalProtein = 
    (dietDay?.breakfast?.protein_g || 0) + 
    (dietDay?.lunch?.protein_g || 0) + 
    (dietDay?.dinner?.protein_g || 0) + 
    (dietDay?.snacks?.protein_g || 0);

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* WELCOMING ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Hello, <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{profile?.name || 'Flex Champion'}</span>!
          </h1>
          <p className="text-gray-400 text-sm mt-1">Ready to dominate today? Here is your personalized fitness outlook.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 px-4 py-2 rounded-xl text-xs text-gray-300 font-semibold uppercase tracking-wider">
          <Target className="h-4 w-4 text-cyan-400 animate-pulse" />
          Target: {profile?.goal}
        </div>
      </div>

      {/* HIGHLIGHT DETAILS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workout Card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                Workout
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white">Today's AI Workout</h3>
              <p className="text-xs text-gray-400 mt-1">Custom routine for {profile?.equipment} setup</p>
            </div>
            
            <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>{exercisesCompletedCount} of {todayExercises.length} Exercises Smashed</span>
            </div>
          </div>
          
          <Link 
            href="/workout" 
            className="mt-6 flex items-center gap-1.5 text-xs font-bold text-cyan-400 group hover:underline"
          >
            Start Session
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Diet Card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                <Apple className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                Nutrition
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white">Diet Breakdown</h3>
              <p className="text-xs text-gray-400 mt-1">Daily targeted meal structures</p>
            </div>

            <div className="flex gap-4 text-xs text-gray-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{totalCals} kcal</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>{totalProtein}g Protein</span>
              </div>
            </div>
          </div>
          
          <Link 
            href="/diet" 
            className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-400 group hover:underline"
          >
            View Meal Plan
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* TRACKING PROGRESS SPARK & AI COACH ADVICE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric Spark Card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between lg:col-span-1">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Scale Stats</span>
            <h3 className="text-lg font-bold text-white">Bodyweight Logger</h3>
          </div>
          
          <div className="my-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{latestLog ? `${latestLog.weight_kg} kg` : `${profile?.weight_kg || 'N/A'} kg`}</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              Active
            </span>
          </div>

          <Link
            href="/progress"
            className="flex items-center gap-1 text-xs font-bold text-purple-400 group hover:underline"
          >
            Log Weight Entries
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* AI COACH PROACTIVE TIPS */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse-neon" />
              <h3 className="text-lg font-bold text-white">Coach Desk Bulletins</h3>
            </div>
            <p className="text-xs text-gray-400">Proactive recommendation generated based on your fitness goals.</p>
          </div>

          <blockquote className="p-4 rounded-xl border border-white/5 bg-white/2 text-sm text-cyan-200 italic leading-relaxed">
            "{getAiCoachAdvice(profile?.goal || '')}"
          </blockquote>

          <Link
            href="/chat"
            className="w-fit flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Ask AI Coach a question
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>

      {/* QUICK QUICK ACTIONS PANEL */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Console Console</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/workout"
            className="flex flex-col items-center p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-center gap-2"
          >
            <Dumbbell className="h-5 w-5 text-cyan-400" />
            <span className="text-xs font-semibold text-gray-300">Workout Plan</span>
          </Link>

          <Link
            href="/diet"
            className="flex flex-col items-center p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-center gap-2"
          >
            <Apple className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-semibold text-gray-300">Diet Meals</span>
          </Link>

          <Link
            href="/progress"
            className="flex flex-col items-center p-4 rounded-xl border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all text-center gap-2"
          >
            <LineChart className="h-5 w-5 text-purple-400" />
            <span className="text-xs font-semibold text-gray-300">Log Metrics</span>
          </Link>

          <Link
            href="/chat"
            className="flex flex-col items-center p-4 rounded-xl border border-white/5 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all text-center gap-2"
          >
            <MessageSquare className="h-5 w-5 text-yellow-400" />
            <span className="text-xs font-semibold text-gray-300">Ask Llama</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
