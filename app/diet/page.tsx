'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Apple, RotateCw, Sparkles, Flame, TrendingUp, Egg, Soup, Beef, Coffee, Clock, Camera } from 'lucide-react';

interface DietMeal {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
interface DietDay {
  day: string;
  breakfast: DietMeal;
  lunch: DietMeal;
  dinner: DietMeal;
  snacks: DietMeal;
}
interface DietPlan {
  days: DietDay[];
}
interface Recipe {
  recipeName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_time_minutes: number;
  instructions: string[] | string;
}
interface MealAnalysis {
  items: string[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  healthierAlternative: string;
  confidence: 'low' | 'medium' | 'high';
}

/** Downscale + re-encode a chosen image client-side to keep the upload payload small. */
async function downscaleImage(file: File, maxDim = 1024, quality = 0.8): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  return new Promise<string>((resolve) => {
    const img = new window.Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const cctx = canvas.getContext('2d');
      if (!cctx) return resolve(dataUrl);
      cctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

export default function DietPage() {
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [buildingRecipe, setBuildingRecipe] = useState(false);

  const [mealPreview, setMealPreview] = useState<string | null>(null);
  const [mealAnalysis, setMealAnalysis] = useState<MealAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/diet');
      if (!res.ok) return;
      const json = (await res.json()) as { data?: DietPlan | null };
      setPlan(json.data ?? null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function regenerate() {
    setRegenerating(true);
    try {
      await fetch('/api/v1/diet', { method: 'POST' });
      setSelectedDayIndex(0);
      await load();
    } finally {
      setRegenerating(false);
    }
  }

  async function handleBuildRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!ingredients.trim()) return;
    setBuildingRecipe(true);
    setRecipe(null);
    try {
      const res = await fetch('/api/fridge-recipe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ingredients, targetGoal: 'gain muscle', language: 'english' }),
      });
      const data = (await res.json()) as { recipe?: Recipe };
      if (data.recipe) setRecipe(data.recipe);
    } catch {
      /* ignore */
    } finally {
      setBuildingRecipe(false);
    }
  }

  async function analyzeMealPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMealAnalysis(null);
    setAnalyzing(true);
    try {
      const dataUrl = await downscaleImage(file);
      setMealPreview(dataUrl);
      const res = await fetch('/api/v1/meal-photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = (await res.json()) as { data?: MealAnalysis };
      if (json.data) setMealAnalysis(json.data);
    } catch {
      /* ignore */
    } finally {
      setAnalyzing(false);
    }
  }

  if (!loaded) return <div className="text-center py-10 text-gray-400">Loading your meal plan…</div>;

  if (!plan || plan.days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-[fadeIn_0.4s_ease-out]">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-lg">
          <Apple className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">No meal plan yet</h2>
          <p className="text-gray-400 text-sm">Set your diet preference and goal to generate a 7-day Indian meal plan.</p>
        </div>
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {regenerating ? 'Generating…' : 'Generate my meal plan'}
        </button>
        <Link href="/profile" className="text-xs text-gray-500 hover:text-gray-300">
          or edit diet preferences in your profile
        </Link>
      </div>
    );
  }

  const selectedDay = plan.days[selectedDayIndex] ?? plan.days[0];
  const totalCals = selectedDay.breakfast.calories + selectedDay.lunch.calories + selectedDay.dinner.calories + selectedDay.snacks.calories;
  const totalProtein = selectedDay.breakfast.protein_g + selectedDay.lunch.protein_g + selectedDay.dinner.protein_g + selectedDay.snacks.protein_g;
  const totalCarbs = selectedDay.breakfast.carbs_g + selectedDay.lunch.carbs_g + selectedDay.dinner.carbs_g + selectedDay.snacks.carbs_g;
  const totalFat = selectedDay.breakfast.fat_g + selectedDay.lunch.fat_g + selectedDay.dinner.fat_g + selectedDay.snacks.fat_g;

  const mealsList = [
    { title: 'Breakfast', icon: Egg, data: selectedDay.breakfast, color: 'text-yellow-400' },
    { title: 'Lunch', icon: Soup, data: selectedDay.lunch, color: 'text-cyan-400' },
    { title: 'Dinner', icon: Beef, data: selectedDay.dinner, color: 'text-purple-400' },
    { title: 'Snacks', icon: Coffee, data: selectedDay.snacks, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Apple className="h-8 w-8 text-emerald-400" />
            Diet &amp;{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Nutrition Planner</span>
          </h1>
          <p className="text-gray-400 mt-1.5 text-sm">7-day Indian macro meal plan customized for your goals.</p>
        </div>
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating…' : 'Regenerate Diet'}
        </button>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto border-b border-[rgba(255,255,255,0.06)]">
        {plan.days.map((dayItem, index) => (
          <button
            key={index}
            onClick={() => setSelectedDayIndex(index)}
            className={`px-5 py-3 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${
              selectedDayIndex === index
                ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-400 text-emerald-400 shadow-md'
                : 'bg-white/2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {dayItem.day}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroCard label="Energy" value={`${totalCals}`} unit="kcal" icon={<Flame className="h-4 w-4 text-orange-500" />} bar="from-orange-500 to-amber-500" pct="80%" />
        <MacroCard label="Protein" value={`${totalProtein}`} unit="g" icon={<TrendingUp className="h-4 w-4 text-cyan-500" />} bar="bg-cyan-500" pct="70%" />
        <MacroCard label="Carbs" value={`${totalCarbs}`} unit="g" icon={<Flame className="h-4 w-4 text-purple-500" />} bar="bg-purple-500" pct="60%" />
        <MacroCard label="Fats" value={`${totalFat}`} unit="g" icon={<Flame className="h-4 w-4 text-emerald-500" />} bar="bg-emerald-500" pct="50%" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white mb-2">Meal Breakdown</h2>
        {mealsList.map((m, index) => {
          const Icon = m.icon;
          return (
            <div
              key={index}
              className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between border border-[rgba(255,255,255,0.06)] hover:border-emerald-500/20 transition-all duration-300"
            >
              <div className="flex items-start md:items-center gap-4 flex-1">
                <div className={`h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${m.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{m.title}</span>
                  <h3 className="text-base md:text-lg font-bold text-white leading-snug">{m.data.name}</h3>
                </div>
              </div>
              <div className="w-full md:w-auto flex flex-wrap gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 md:justify-end items-center text-xs">
                <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl font-semibold">{m.data.calories} kcal</span>
                <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl font-semibold">P: {m.data.protein_g}g</span>
                <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl font-semibold">C: {m.data.carbs_g}g</span>
                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold">F: {m.data.fat_g}g</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI meal photo analyzer */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 border border-[rgba(255,255,255,0.06)]">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-cyan-400" />
            AI Meal Photo Analyzer
          </h2>
          <p className="text-xs text-gray-400">Snap or upload a meal — get instant calorie + macro estimates. Logged photos count toward your streak.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          <label className="shrink-0 cursor-pointer self-start">
            <div className="h-40 w-40 rounded-2xl border-2 border-dashed border-white/15 hover:border-cyan-400/50 bg-[#0b0e14]/50 flex items-center justify-center overflow-hidden transition-all">
              {mealPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mealPreview} alt="Meal" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-gray-500">
                  <Camera className="h-7 w-7 mx-auto mb-1.5" />
                  <span className="text-[11px] font-semibold">Tap to add photo</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" capture="environment" onChange={analyzeMealPhoto} className="hidden" />
          </label>

          <div className="flex-1 flex items-center">
            {analyzing ? (
              <div className="flex items-center gap-2 text-sm text-cyan-300">
                <RotateCw className="h-4 w-4 animate-spin" /> Analyzing your meal…
              </div>
            ) : mealAnalysis ? (
              <div className="w-full space-y-3 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex flex-wrap gap-1.5">
                  {mealAnalysis.items.map((it, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-gray-200">
                      {it}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] text-gray-400">
                    confidence: {mealAnalysis.confidence}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <PhotoMacro label="kcal" value={mealAnalysis.calories} color="text-orange-400" />
                  <PhotoMacro label="P (g)" value={mealAnalysis.protein_g} color="text-cyan-400" />
                  <PhotoMacro label="C (g)" value={mealAnalysis.carbs_g} color="text-purple-400" />
                  <PhotoMacro label="F (g)" value={mealAnalysis.fat_g} color="text-emerald-400" />
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  <span className="text-emerald-400 font-semibold">Coach swap: </span>
                  {mealAnalysis.healthierAlternative}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Your estimate appears here after you add a photo.</p>
            )}
          </div>
        </div>
      </div>

      {/* Fridge-to-meal recipe builder */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 border border-[rgba(255,255,255,0.06)]">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            AI Fridge-to-Meal Recipe Builder
          </h2>
          <p className="text-xs text-gray-400">Enter what you have, and the coach builds a healthy recipe.</p>
        </div>

        <form onSubmit={handleBuildRecipe} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. Paneer, eggs, oats, spinach, curd…"
            disabled={buildingRecipe}
            className="flex-1 bg-[#0b0e14]/50 border border-white/8 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
          />
          <button
            type="submit"
            disabled={buildingRecipe || !ingredients.trim()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {buildingRecipe ? <RotateCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {buildingRecipe ? 'Building…' : 'Generate Recipe'}
          </button>
        </form>

        {recipe && (
          <div className="p-5 md:p-6 rounded-2xl bg-white/2 border border-white/5 space-y-5 animate-[fadeIn_0.4s_ease-out]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white">{recipe.recipeName}</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/8 rounded-lg text-xs font-semibold text-gray-300">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>{recipe.prep_time_minutes} mins</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <RecipeMacro label="Calories" value={`${recipe.calories} kcal`} color="text-white" />
              <RecipeMacro label="Protein" value={`${recipe.protein_g}g`} color="text-cyan-400" />
              <RecipeMacro label="Carbs" value={`${recipe.carbs_g}g`} color="text-purple-400" />
              <RecipeMacro label="Fats" value={`${recipe.fat_g}g`} color="text-emerald-400" />
            </div>
            <div className="space-y-2.5">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Instructions</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {(Array.isArray(recipe.instructions) ? recipe.instructions : [String(recipe.instructions)]).map((step, sIdx) => (
                  <li key={sIdx} className="leading-relaxed flex gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MacroCard({ label, value, unit, icon, bar, pct }: { label: string; value: string; unit: string; icon: React.ReactNode; bar: string; pct: string }) {
  return (
    <div className="glass-panel rounded-2xl p-5 space-y-2.5">
      <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <span>{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-black text-white">
        {value} <span className="text-xs font-medium text-gray-400">{unit}</span>
      </p>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bar.startsWith('from-') ? `bg-gradient-to-r ${bar}` : bar}`} style={{ width: pct }} />
      </div>
    </div>
  );
}

function RecipeMacro({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 bg-[#0b0e14]/40 rounded-xl text-center border border-white/5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
      <p className={`text-base font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function PhotoMacro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-2.5 bg-[#0b0e14]/40 rounded-xl text-center border border-white/5">
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
    </div>
  );
}
