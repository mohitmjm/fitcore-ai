'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Apple, 
  RotateCw, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  ChevronRight, 
  Egg,
  Soup,
  Beef,
  Coffee,
  Clock
} from 'lucide-react';
import { localDb, DietPlan, DietDay, DietMeal } from '@/lib/db';

export default function DietPage() {
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  // Fridge AI builder states
  const [ingredients, setIngredients] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<any | null>(null);
  const [buildingRecipe, setBuildingRecipe] = useState(false);
  const [recipeError, setRecipeError] = useState('');

  useEffect(() => {
    // Load diet plan
    setPlan(localDb.getDietPlan());
  }, []);

  const handleQuickRegenerate = async () => {
    setRegenerating(true);
    const profile = localDb.getProfile();
    
    try {
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diet_type: profile.diet_type || 'non-veg',
          goal: profile.diet_goal || 'gain muscle',
          weight_kg: profile.weight_kg || 72,
          height_cm: profile.height_cm || 178,
          allergies: profile.allergies || [],
          meals_per_day: profile.meals_per_day || 4,
          userId: profile.id
        })
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        const newPlan = localDb.saveDietPlan(data.plan);
        setPlan(newPlan);
        setSelectedDayIndex(0);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.warn("API regeneration failed, using local mock fallback:", err);
      // Client-side fallback
      const aiModule = await import('@/lib/ai');
      const dPrompt = `diet: ${profile.diet_type} goal: ${profile.diet_goal} ${profile.weight_kg} kg`;
      const dRaw = await aiModule.callAI(dPrompt);
      const parsed = JSON.parse(dRaw);
      const newPlan = localDb.saveDietPlan(parsed);
      setPlan(newPlan);
      setSelectedDayIndex(0);
    } finally {
      setRegenerating(false);
    }
  };

  const handleBuildRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim()) return;

    setBuildingRecipe(true);
    setGeneratedRecipe(null);
    setRecipeError('');

    try {
      const profile = localDb.getProfile();
      const res = await fetch('/api/fridge-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients,
          targetGoal: profile.diet_goal || 'gain muscle',
          language: profile.language || 'english'
        })
      });

      const data = await res.json();
      if (res.ok && data.recipe) {
        setGeneratedRecipe(data.recipe);
      } else {
        throw new Error(data.error || 'Failed to generate recipe from ingredients');
      }
    } catch (err: any) {
      console.warn("Recipe API failed, using client-side generator:", err);
      const profile = localDb.getProfile();
      // Generate clean mock recipe client-side if Hugging Face API is offline
      const mock = {
        recipeName: `High-Protein ${ingredients.split(',')[0] || 'Fridge'} Bowl`,
        calories: 380,
        protein_g: 28,
        carbs_g: 15,
        fat_g: 10,
        prep_time_minutes: 15,
        instructions: profile.language === 'hinglish' 
          ? [
              `1. Sabse pehle apne available ingredients (${ingredients}) ko ache se wash karke prepare kar lein.`,
              "2. Ek non-stick pan me thoda light oil ya ghee garam karein.",
              "3. In components ko moderate hit par light brown hone tak pakayein.",
              "4. Salt aur pepper sprinkle karein aur protein intake squeeze karein."
            ]
          : [
              `1. Start by washing and preparing your available ingredients: ${ingredients}.`,
              "2. Heat a small amount of olive oil or ghee in a skillet over medium heat.",
              "3. Saute the prepared items until golden brown to preserve nutrient value.",
              "4. Season with salt, pepper, and fresh herbs. Enjoy warm."
            ]
      };
      setGeneratedRecipe(mock);
    } finally {
      setBuildingRecipe(false);
    }
  };

  if (!plan || !plan.plan_data || plan.plan_data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-[fadeIn_0.4s_ease-out]">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <Apple className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">No Diet Plan Generated</h2>
          <p className="text-gray-400 text-sm">
            Set up your dietary preferences, allergies, and calories targets to build a custom 7-day Indian meal plan with macro breakdowns.
          </p>
        </div>
        <Link
          href="/profile"
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Setup Diet & Generate Plan
        </Link>
      </div>
    );
  }

  const selectedDay: DietDay = plan.plan_data[selectedDayIndex];
  
  // Calculate total daily macros
  const totalCals = 
    (selectedDay?.breakfast?.calories || 0) + 
    (selectedDay?.lunch?.calories || 0) + 
    (selectedDay?.dinner?.calories || 0) + 
    (selectedDay?.snacks?.calories || 0);

  const totalProtein = 
    (selectedDay?.breakfast?.protein_g || 0) + 
    (selectedDay?.lunch?.protein_g || 0) + 
    (selectedDay?.dinner?.protein_g || 0) + 
    (selectedDay?.snacks?.protein_g || 0);

  const totalCarbs = 
    (selectedDay?.breakfast?.carbs_g || 0) + 
    (selectedDay?.lunch?.carbs_g || 0) + 
    (selectedDay?.dinner?.carbs_g || 0) + 
    (selectedDay?.snacks?.carbs_g || 0);

  const totalFat = 
    (selectedDay?.breakfast?.fat_g || 0) + 
    (selectedDay?.lunch?.fat_g || 0) + 
    (selectedDay?.dinner?.fat_g || 0) + 
    (selectedDay?.snacks?.fat_g || 0);

  const mealsList = [
    { title: 'Breakfast', icon: Egg, data: selectedDay?.breakfast, color: 'text-yellow-400' },
    { title: 'Lunch', icon: Soup, data: selectedDay?.lunch, color: 'text-cyan-400' },
    { title: 'Dinner', icon: Beef, data: selectedDay?.dinner, color: 'text-purple-400' },
    { title: 'Snacks', icon: Coffee, data: selectedDay?.snacks, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Apple className="h-8 w-8 text-emerald-400" />
            Diet & <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Nutrition Planner</span>
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">
            7-day Indian macro meal plan customized for your health goals.
          </p>
        </div>
        
        <button
          onClick={handleQuickRegenerate}
          disabled={regenerating}
          className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating...' : 'Regenerate Diet'}
        </button>
      </div>

      {/* WEEKDAY TABS */}
      <div className="flex gap-2 pb-2 overflow-x-auto border-b border-[rgba(255,255,255,0.06)]">
        {plan.plan_data.map((dayItem, index) => {
          const isSelected = selectedDayIndex === index;
          return (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-400 text-emerald-400 shadow-md'
                  : 'bg-white/2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {dayItem.day}
            </button>
          );
        })}
      </div>

      {/* DAILY MACRO METER CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Energy</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-white">{totalCals} <span className="text-xs font-medium text-gray-400">kcal</span></p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: '80%' }} />
          </div>
        </div>

        {/* Protein Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Protein</span>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-black text-white">{totalProtein} <span className="text-xs font-medium text-gray-400">g</span></p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: '70%' }} />
          </div>
        </div>

        {/* Carbs Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Carbs</span>
            <Flame className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-white">{totalCarbs} <span className="text-xs font-medium text-gray-400">g</span></p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Fats Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Fats</span>
            <Flame className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-white">{totalFat} <span className="text-xs font-medium text-gray-400">g</span></p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }} />
          </div>
        </div>
      </div>

      {/* MEALS LIST */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-2">Meal Breakdown</h2>
        {mealsList.map((meal, index) => {
          if (!meal.data) return null;
          const Icon = meal.icon;
          return (
            <div 
              key={index}
              className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between border border-[rgba(255,255,255,0.06)] hover:border-emerald-500/20 transition-all duration-300"
            >
              <div className="flex items-start md:items-center gap-4 flex-1">
                <div className={`h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${meal.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{meal.title}</span>
                  <h3 className="text-base md:text-lg font-bold text-white leading-snug">
                    {meal.data.name}
                  </h3>
                </div>
              </div>

              {/* Meal Macros breakdown */}
              <div className="w-full md:w-auto flex flex-wrap gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 md:justify-end items-center text-xs">
                <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl font-semibold">
                  {meal.data.calories} kcal
                </span>
                
                <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl font-semibold">
                  P: {meal.data.protein_g}g
                </span>
                
                <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl font-semibold">
                  C: {meal.data.carbs_g}g
                </span>
                
                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                  F: {meal.data.fat_g}g
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI FRIDGE TO MEAL RECIPE BUILDER */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 border border-[rgba(255,255,255,0.06)]">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5.5 w-5.5 text-emerald-400 animate-pulse" />
            AI Fridge-to-Meal Recipe Builder
          </h2>
          <p className="text-xs text-gray-400">
            Enter the ingredients you have available in your kitchen, and our DeepSeek model will generate a custom healthy recipe.
          </p>
        </div>

        <form onSubmit={handleBuildRecipe} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. Paneer, eggs, oats, spinach, curd..."
              required
              disabled={buildingRecipe}
              className="flex-1 bg-[#0b0e14]/50 border border-white/8 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={buildingRecipe || !ingredients.trim()}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {buildingRecipe ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Recipe
                </>
              )}
            </button>
          </div>
        </form>

        {recipeError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {recipeError}
          </div>
        )}

        {generatedRecipe && (
          <div className="p-5 md:p-6 rounded-2xl bg-white/2 border border-white/5 space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
              <div>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase tracking-wider">
                  Custom Recipe
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{generatedRecipe.recipeName}</h3>
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/8 rounded-lg text-xs font-semibold text-gray-300">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>{generatedRecipe.prep_time_minutes} Mins Prep</span>
              </div>
            </div>

            {/* Macros Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#0b0e14]/40 rounded-xl text-center border border-white/5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Calories</p>
                <p className="text-base font-bold text-white mt-1">{generatedRecipe.calories} kcal</p>
              </div>
              <div className="p-3 bg-[#0b0e14]/40 rounded-xl text-center border border-white/5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Protein</p>
                <p className="text-base font-bold text-cyan-400 mt-1">{generatedRecipe.protein_g}g</p>
              </div>
              <div className="p-3 bg-[#0b0e14]/40 rounded-xl text-center border border-white/5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Carbs</p>
                <p className="text-base font-bold text-purple-400 mt-1">{generatedRecipe.carbs_g}g</p>
              </div>
              <div className="p-3 bg-[#0b0e14]/40 rounded-xl text-center border border-white/5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Fats</p>
                <p className="text-base font-bold text-emerald-400 mt-1">{generatedRecipe.fat_g}g</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Instructions</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {Array.isArray(generatedRecipe.instructions) ? (
                  generatedRecipe.instructions.map((step: string, sIdx: number) => (
                    <li key={sIdx} className="leading-relaxed flex gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))
                ) : (
                  <li className="leading-relaxed flex gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>
                      {typeof generatedRecipe.instructions === 'string' 
                        ? generatedRecipe.instructions 
                        : 'No instructions generated. Please try again.'}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
