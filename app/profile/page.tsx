'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Target, 
  Dumbbell, 
  Sparkles, 
  Apple, 
  Activity, 
  Info,
  Check,
  AlertTriangle,
  RotateCw,
  Zap,
  Wallet,
  Bell,
  Plus,
  Mail,
  MessageSquare
} from 'lucide-react';
import { localDb, UserProfile } from '@/lib/db';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState<'weight loss' | 'muscle gain' | 'endurance' | 'flexibility'>('muscle gain');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [equipment, setEquipment] = useState<'home' | 'gym' | 'none'>('gym');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [dietType, setDietType] = useState<'veg' | 'non-veg' | 'vegan'>('non-veg');
  const [dietGoal, setDietGoal] = useState<'lose fat' | 'gain muscle' | 'maintain'>('gain muscle');
  const [weightKg, setWeightKg] = useState('72');
  const [heightCm, setHeightCm] = useState('178');
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [language, setLanguage] = useState<'english' | 'hinglish'>('english');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Wallet & alerts states
  const [walletBalance, setWalletBalance] = useState(100);
  const [referrals, setReferrals] = useState<string[]>([]);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [activeNotification, setActiveNotification] = useState<{ title: string; text: string; type: 'whatsapp' | 'sms' | 'email' } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('fitcore_logged_in');
    window.dispatchEvent(new Event('fitcore_profile_updated'));
    router.push('/');
  };

  useEffect(() => {
    const data = localDb.getProfile();
    setProfile(data);
    
    // Set initial values
    setName(data.name || '');
    setEmail(data.email || '');
    setGoal(data.goal || 'muscle gain');
    setExperience(data.experience || 'intermediate');
    setEquipment(data.equipment || 'gym');
    setDaysPerWeek(data.days_per_week || 4);
    setDietType(data.diet_type || 'non-veg');
    setDietGoal(data.diet_goal || 'gain muscle');
    setWeightKg(data.weight_kg?.toString() || '72');
    setHeightCm(data.height_cm?.toString() || '178');
    setMealsPerDay(data.meals_per_day || 4);
    setAllergiesInput(data.allergies?.join(', ') || '');
    setLanguage(data.language || 'english');
    setWalletBalance(data.wallet_balance ?? 100);
    setReferrals(data.referrals ?? []);
    setWhatsappEnabled(data.whatsapp_enabled ?? true);
    setSmsEnabled(data.sms_enabled ?? false);
    setEmailEnabled(data.email_enabled ?? true);
  }, []);

  const handleSimulateReferral = () => {
    const randomNames = ["Amit Patel", "Rohan Das", "Priya Sen", "Neha Sharma", "Vikram Singh"];
    const nameStr = randomNames[Math.floor(Math.random() * randomNames.length)];
    const mockRef = `${nameStr} joined (Credits: +₹100)`;
    
    const newRefs = [...referrals, mockRef];
    const newBal = walletBalance + 100;
    
    setReferrals(newRefs);
    setWalletBalance(newBal);
    
    localDb.updateProfile({ referrals: newRefs, wallet_balance: newBal });
    window.dispatchEvent(new Event('fitcore_profile_updated'));
  };

  const handleRedeemCredits = () => {
    if (walletBalance < 100) {
      alert("You need at least ₹100 inside your digital wallet to redeem balance.");
      return;
    }
    
    const newBal = walletBalance - 100;
    setWalletBalance(newBal);
    
    const currentExpiry = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const updatedProf = localDb.updateProfile({ 
      wallet_balance: newBal,
      is_subscribed: true,
      subscription_expires_at: newExpiry
    });
    setProfile(updatedProf);
    window.dispatchEvent(new Event('fitcore_profile_updated'));
    
    alert(`Redemption Successful! ₹100 balance applied. Subscription extended until ${new Date(newExpiry).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}.`);
  };

  const handleSendTestNotification = () => {
    let title = "WhatsApp Notification";
    let text = "WhatsApp reminder text";
    let type: 'whatsapp' | 'sms' | 'email' = 'whatsapp';
    
    if (whatsappEnabled) {
      title = "💬 WhatsApp Reminder";
      text = `Hi ${name || 'Champion'}, it is time for your custom ${goal} workout session! Put on your gear and keep your consistency streak active.`;
      type = 'whatsapp';
    } else if (smsEnabled) {
      title = "📱 SMS Smart Alert";
      text = `FitCore AI Notification: Drink 500ml of water now. Keep your hydration and macro target of ${dietGoal} on track.`;
      type = 'sms';
    } else {
      title = "✉️ Email Progress Report";
      text = `Monthly Fitness Report for ${name || 'Champion'}: Your body weight scale tracker is logged at ${weightKg} kg. You are in the active zone!`;
      type = 'email';
    }
    
    setActiveNotification({ title, text, type });
    
    setTimeout(() => {
      setActiveNotification(null);
    }, 4500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setSaveSuccess(false);
    setStatusMessage('Saving profile information...');
    
    const allergies = allergiesInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
      
    const updatedProfile: Partial<UserProfile> = {
      name,
      email,
      goal,
      experience,
      equipment,
      days_per_week: Number(daysPerWeek),
      diet_type: dietType,
      diet_goal: dietGoal,
      weight_kg: Number(weightKg),
      height_cm: Number(heightCm),
      meals_per_day: Number(mealsPerDay),
      allergies,
      language,
      wallet_balance: walletBalance,
      referrals,
      whatsapp_enabled: whatsappEnabled,
      sms_enabled: smsEnabled,
      email_enabled: emailEnabled
    };

    // Update profile
    const saved = localDb.updateProfile(updatedProfile);
    localStorage.setItem('fitcore_logged_in', 'true');
    setProfile(saved);
    
    // Broadcast event to refresh navbar
    window.dispatchEvent(new Event('fitcore_profile_updated'));

    try {
      // 1. REGENERATE WORKOUT PLAN VIA AI
      setStatusMessage('Consulting AI fitness coach for new workout plan... (this may take up to 10s)');
      const workoutRes = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: daysPerWeek,
          experience: experience,
          goal: goal,
          equipment: equipment,
          userId: saved.id,
          language: language
        })
      });
      
      const workoutData = await workoutRes.json();
      if (workoutRes.ok && workoutData.plan) {
        localDb.saveWorkoutPlan(workoutData.plan, experience);
      } else {
        throw new Error(workoutData.error || 'Failed to generate workout plan');
      }

      // 2. REGENERATE DIET PLAN VIA AI
      setStatusMessage('Consulting AI nutritionist for Indian meal plan...');
      const dietRes = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diet_type: dietType,
          goal: dietGoal,
          weight_kg: Number(weightKg),
          height_cm: Number(heightCm),
          allergies: allergies,
          meals_per_day: Number(mealsPerDay),
          userId: saved.id,
          language: language
        })
      });
      
      const dietData = await dietRes.json();
      if (dietRes.ok && dietData.plan) {
        localDb.saveDietPlan(dietData.plan);
      } else {
        throw new Error(dietData.error || 'Failed to generate diet plan');
      }

      // Add a default welcome message to AI Coach
      localDb.clearChat();
      const welcomeMsg = language === 'hinglish'
        ? `Maine aapka workout aur diet plan update kar diya hai! Aapka goal ${goal} hai aur aap ${equipment} use kar rahe ho week me ${daysPerWeek} din. Chalo batayein, aaj kis chiz se shuru karein?`
        : `I have updated your training and meal logs! Based on your target to ${goal} using ${equipment} equipment ${daysPerWeek} days a week, I've designed a brand-new plan. What would you like to discuss first?`;
      localDb.addChatMessage('ai', welcomeMsg);
      
      setStatusMessage('Plans successfully customized! Redirecting...');
      setSaveSuccess(true);
      
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message || 'AI request failed'}. Fallback data active.`);
      
      // Fallback: If AI routes fail, lib/ai mock fallback is simulated client side
      // Let's create dummy plans using the fallback client side:
      import('@/lib/ai').then(async (aiModule) => {
        try {
          const wPrompt = `workout plan goal: ${goal} level ${experience} ${daysPerWeek}-day equipment: ${equipment}`;
          const wRaw = await aiModule.callAI(wPrompt);
          localDb.saveWorkoutPlan(JSON.parse(wRaw), experience);
          
          const dPrompt = `diet: ${dietType} goal: ${dietGoal} ${weightKg} kg`;
          const dRaw = await aiModule.callAI(dPrompt);
          localDb.saveDietPlan(JSON.parse(dRaw));
          
          setSaveSuccess(true);
          setStatusMessage('Saved successfully with fallback optimizer! Redirecting...');
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } catch {
          setStatusMessage('Saved details. Complete reload recommended.');
        }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!profile) return <div className="text-center py-10 text-gray-400">Loading profile configuration...</div>;

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <User className="h-8 w-8 text-cyan-400" />
          Fitness <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Profile & Settings</span>
        </h1>
        <p className="text-gray-400 mt-1.5">Configure your parameters to generate custom workout routines and nutrition logs.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* PHYSICAL PROFILE */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Physical & Core Info</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                placeholder="e.g. Flex Champion"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                placeholder="e.g. contact@fitcore.ai"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weight (kg)</label>
                <input 
                  type="number" 
                  value={weightKg} 
                  onChange={(e) => setWeightKg(e.target.value)}
                  required
                  min="30"
                  max="250"
                  className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Height (cm)</label>
                <input 
                  type="number" 
                  value={heightCm} 
                  onChange={(e) => setHeightCm(e.target.value)}
                  required
                  min="100"
                  max="250"
                  className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weekly Frequency</label>
                <select 
                  value={daysPerWeek} 
                  onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                  className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                >
                  <option value={2}>2 Days / Week</option>
                  <option value={3}>3 Days / Week</option>
                  <option value={4}>4 Days / Week (Recommended)</option>
                  <option value={5}>5 Days / Week</option>
                  <option value={6}>6 Days / Week</option>
                  <option value={7}>7 Days / Week</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Language Preference</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors font-medium"
                >
                  <option value="english">English</option>
                  <option value="hinglish">Hinglish (Hindi in English letters)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* WORKOUT SPECIFICS */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <Dumbbell className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Workout Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fitness Goal</label>
              <div className="grid grid-cols-1 gap-2.5">
                {['weight loss', 'muscle gain', 'endurance', 'flexibility'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g as any)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm capitalize transition-all ${
                      goal === g
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-sm'
                        : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Experience Level</label>
              <div className="grid grid-cols-1 gap-2.5">
                {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperience(lvl as any)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm capitalize transition-all ${
                      experience === lvl
                        ? 'bg-purple-500/10 border-purple-400 text-purple-400 shadow-sm'
                        : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Available Equipment</label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'gym', label: 'Full Gym Setup' },
                  { id: 'home', label: 'Home (Dumbbells/Bands)' },
                  { id: 'none', label: 'No Equipment (Bodyweight)' }
                ].map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setEquipment(eq.id as any)}
                    className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      equipment === eq.id
                        ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400 shadow-sm'
                        : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {eq.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DIET & NUTRITION SPECIFICS */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <Apple className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Nutrition Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Diet Preference</label>
              <div className="flex gap-3">
                {['veg', 'non-veg', 'vegan'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDietType(t as any)}
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm capitalize transition-all text-center ${
                      dietType === t
                        ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400'
                        : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Diet Goal</label>
              <div className="flex gap-3">
                {['lose fat', 'gain muscle', 'maintain'].map((dg) => (
                  <button
                    key={dg}
                    type="button"
                    onClick={() => setDietGoal(dg as any)}
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm capitalize transition-all text-center ${
                      dietGoal === dg
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                        : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400'
                    }`}
                  >
                    {dg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Allergies / Exclusions</label>
              <input 
                type="text" 
                value={allergiesInput} 
                onChange={(e) => setAllergiesInput(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                placeholder="e.g. peanuts, dairy, gluten (comma separated)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meals per Day</label>
              <select 
                value={mealsPerDay} 
                onChange={(e) => setMealsPerDay(Number(e.target.value))}
                className="w-full bg-[#0b0e14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
              >
                <option value={2}>2 Meals + Snacks</option>
                <option value={3}>3 Meals</option>
                <option value={4}>3 Meals + 1 Snack (Recommended)</option>
                <option value={5}>4 Meals + 1 Snack</option>
              </select>
            </div>
          </div>
        </div>

        {/* DIGITAL WALLET & REFERRAL CREDITS */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <Wallet className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Digital Wallet & Referrals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wallet Balance Card */}
            <div className="bg-[#0b0e14]/60 border border-[rgba(255,255,255,0.06)] rounded-xl p-5 flex flex-col justify-between space-y-4 text-left">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wallet Balance</span>
                <div className="text-3xl font-extrabold text-white mt-1.5 flex items-baseline gap-1">
                  ₹{walletBalance}
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">D2C Coins</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Earn ₹100 for every gym buddy who subscribes using your referral link.</p>
              </div>

              <button
                type="button"
                onClick={handleRedeemCredits}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-emerald-500/10 hover:scale-[1.01]"
              >
                Redeem ₹100 (Extend Plan)
              </button>
            </div>

            {/* Refer & Earn Simulator */}
            <div className="bg-[#0b0e14]/60 border border-[rgba(255,255,255,0.06)] rounded-xl p-5 flex flex-col justify-between space-y-4 md:col-span-2 text-left">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Program Simulator</span>
                <p className="text-xs text-gray-400">
                  Share the love of premium coaching! FitCore AI is direct-to-consumer. Test the flow by simulating a new user signing up via your referral code below.
                </p>
                
                {/* Referrals list log */}
                <div className="mt-3 space-y-2 max-h-[90px] overflow-y-auto pr-1">
                  {referrals.length === 0 ? (
                    <div className="text-xs text-gray-600 italic py-2">No referrals logged yet. Click simulate to test!</div>
                  ) : (
                    referrals.map((ref, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-gray-300">
                        <span>{ref}</span>
                        <span className="text-emerald-400 font-bold font-mono">+₹100</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateReferral}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Simulate Successful Referral Signup
              </button>
            </div>
          </div>
        </div>

        {/* SMART ALERTS CONFIGURATION */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <Bell className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Smart Alerts & Notification Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4 text-left">
              <p className="text-xs text-gray-400">
                Configure your preferred notifications for workout reminders, custom macro targets, and weekly summaries. FitCore AI sends offline alerts through simulated APIs.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* WhatsApp Toggle */}
                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  whatsappEnabled 
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-white' 
                    : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className={`h-4 w-4 ${whatsappEnabled ? 'text-emerald-400' : ''}`} />
                    <span className="text-xs font-semibold">WhatsApp</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={whatsappEnabled} 
                    onChange={(e) => setWhatsappEnabled(e.target.checked)} 
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${whatsappEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${whatsappEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>

                {/* SMS Toggle */}
                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  smsEnabled 
                    ? 'bg-purple-500/5 border-purple-500/30 text-white' 
                    : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Bell className={`h-4 w-4 ${smsEnabled ? 'text-purple-400' : ''}`} />
                    <span className="text-xs font-semibold">SMS Alerts</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={smsEnabled} 
                    onChange={(e) => setSmsEnabled(e.target.checked)} 
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${smsEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${smsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>

                {/* Email Toggle */}
                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  emailEnabled 
                    ? 'bg-cyan-500/5 border-cyan-500/30 text-white' 
                    : 'bg-[#0b0e14] border-[rgba(255,255,255,0.08)] text-gray-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Mail className={`h-4 w-4 ${emailEnabled ? 'text-cyan-400' : ''}`} />
                    <span className="text-xs font-semibold">Email Digest</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={emailEnabled} 
                    onChange={(e) => setEmailEnabled(e.target.checked)} 
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${emailEnabled ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${emailEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>
            </div>

            {/* Test Simulator Button Box */}
            <div className="bg-[#0b0e14]/60 border border-[rgba(255,255,255,0.06)] rounded-xl p-5 flex flex-col justify-between space-y-4 text-left">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Simulator Dashboard</span>
                <p className="text-[11px] text-gray-500 mt-2">Trigger a mock alert directly to your current session to inspect formatting and messaging copy.</p>
              </div>

              <button
                type="button"
                onClick={handleSendTestNotification}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-purple-500/10 hover:scale-[1.01]"
              >
                Send Test Notification Alert
              </button>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION STATUS & MANAGEMENT */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 border border-white/5">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
            <Zap className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Subscription Management</h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase font-semibold">Current Plan:</span>
                <span className="text-xs bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 font-bold px-2 py-0.5 rounded-full">FitCore AI All-Access Pass</span>
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                You are currently subscribed. Access to AI workouts, diets, analytics, and coach chat is active.
                {profile?.subscription_expires_at && (
                  <span className="block mt-1 font-semibold text-cyan-400">
                    Validity: Up to {new Date(profile.subscription_expires_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Active Subscription
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to cancel your subscription? You will be locked out of the dashboard features immediately.")) {
                    localDb.updateProfile({ is_subscribed: false });
                    window.dispatchEvent(new Event('fitcore_profile_updated'));
                  }
                }}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>

        {/* STATUS MESSAGE & GENERATING PANEL */}
        {statusMessage && (
          <div className={`p-4 rounded-xl border flex gap-3 items-center ${
            saveSuccess 
              ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-400' 
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}>
            {isGenerating ? (
              <RotateCw className="h-5 w-5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        )}

        {/* SUBMIT & LOGOUT BUTTON PANEL */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/20 hover:text-red-400 font-semibold text-sm transition-all"
          >
            Log Out
          </button>
          
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold text-sm transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isGenerating ? (
              <>
                <RotateCw className="h-5 w-5 animate-spin" />
                Generating Your Plans...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-yellow-300" />
                Save Profile & Generate AI Plans
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-left">
          <span className="font-semibold block">Hugging Face API Connection Note:</span>
          <span>Ensure your Hugging Face API key is configured in your environment variables (`HUGGINGFACE_API_KEY` or `HF_TOKEN`). If the API key is missing or the request times out, FitCore AI will activate an offline mock plan builder to preserve functionality.</span>
        </div>
      </div>

      {/* FLOATING TOASTER NOTIFICATION SIMULATOR */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0b0e14]/90 border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-4 flex gap-3.5 animate-slide-in backdrop-blur-md">
          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-lg ${
            activeNotification.type === 'whatsapp' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : activeNotification.type === 'sms'
              ? 'bg-purple-500/20 text-purple-400'
              : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            {activeNotification.type === 'whatsapp' ? '💬' : activeNotification.type === 'sms' ? '📱' : '✉️'}
          </div>
          <div className="space-y-1 select-none text-left">
            <h4 className="text-xs font-bold text-white tracking-wide">{activeNotification.title}</h4>
            <p className="text-xs text-gray-300 leading-normal">{activeNotification.text}</p>
            <span className="text-[9px] text-gray-500 font-semibold uppercase block pt-1">Simulated push alert</span>
          </div>
        </div>
      )}
    </div>
  );
}
