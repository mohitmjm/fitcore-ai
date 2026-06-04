import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '';

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  name: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  goal?: 'weight loss' | 'muscle gain' | 'endurance' | 'flexibility';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  equipment?: 'home' | 'gym' | 'none';
  days_per_week?: number;
  diet_type?: 'veg' | 'non-veg' | 'vegan';
  diet_goal?: 'lose fat' | 'gain muscle' | 'maintain';
  allergies?: string[];
  meals_per_day?: number;
  weight_kg?: number;
  height_cm?: number;
  language?: 'english' | 'hinglish';
  created_at?: string;
  is_subscribed?: boolean;
  subscription_expires_at?: string;
  wallet_balance?: number;
  referrals?: string[];
  whatsapp_enabled?: boolean;
  sms_enabled?: boolean;
  email_enabled?: boolean;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string | number;
  rest_seconds: number;
  muscle_group: string;
  tip: string;
}

export interface WorkoutDay {
  day: number | string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  plan_data: WorkoutDay[];
  completed_exercises: Record<string, string[]>; // e.g. {"2026-06-03": ["Pushups", "Squats"]}
  intensity_level: string;
  created_at: string;
  updated_at: string;
}

export interface DietMeal {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DietDay {
  day: number | string;
  breakfast: DietMeal;
  lunch: DietMeal;
  dinner: DietMeal;
  snacks: DietMeal;
}

export interface DietPlan {
  id: string;
  user_id: string;
  plan_data: DietDay[];
  created_at: string;
  updated_at: string;
}

export interface ProgressLog {
  id: string;
  user_id: string;
  weight_kg: number;
  chest_inches?: number;
  waist_inches?: number;
  arms_inches?: number;
  recorded_date: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  uploaded_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

// -------------------------------------------------------------
// LOCALSTORAGE / MEMORY FALLBACK
// -------------------------------------------------------------

const DEFAULT_USER_ID = 'local-user-123';

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const localDb = {
  getProfile: (): UserProfile => {
    return getLocalStorage<UserProfile>('fitcore_user_profile', {
      id: DEFAULT_USER_ID,
      email: 'user@fitcore.ai',
      username: 'flexchampion',
      name: 'Flex Champion',
      gender: 'male',
      dob: '1998-01-01',
      goal: 'muscle gain',
      experience: 'intermediate',
      equipment: 'gym',
      days_per_week: 4,
      diet_type: 'non-veg',
      diet_goal: 'gain muscle',
      allergies: [],
      meals_per_day: 4,
      weight_kg: 72,
      height_cm: 178,
      language: 'english',
      is_subscribed: true,
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      wallet_balance: 100,
      referrals: [],
      whatsapp_enabled: true,
      sms_enabled: false,
      email_enabled: true
    });
  },

  updateProfile: (profile: Partial<UserProfile>): UserProfile => {
    const current = localDb.getProfile();
    const updated = { ...current, ...profile };
    setLocalStorage('fitcore_user_profile', updated);

    // Sync to credentials users.json server store in the background
    if (updated.username && updated.username !== 'flexchampion') {
      fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(err => console.warn("Failed to sync profile to server users.json:", err));
    }

    // Sync to Supabase in the background
    if (supabase) {
      supabase.from('users').upsert({
        id: updated.id === DEFAULT_USER_ID ? undefined : updated.id,
        email: updated.email.toLowerCase().trim(),
        name: updated.name,
        phone: updated.phone || null,
        gender: updated.gender || null,
        dob: updated.dob || null,
        goal: updated.goal || null,
        experience: updated.experience || null,
        equipment: updated.equipment || null,
        days_per_week: updated.days_per_week || null,
        diet_type: updated.diet_type || null,
        diet_goal: updated.diet_goal || null,
        allergies: updated.allergies || [],
        meals_per_day: updated.meals_per_day || null,
        weight_kg: updated.weight_kg || null,
        height_cm: updated.height_cm || null,
        is_subscribed: updated.is_subscribed ?? true,
        subscription_expires_at: updated.subscription_expires_at || null,
        wallet_balance: updated.wallet_balance ?? 100,
        referrals: updated.referrals ?? [],
        whatsapp_enabled: updated.whatsapp_enabled ?? true,
        sms_enabled: updated.sms_enabled ?? false,
        email_enabled: updated.email_enabled ?? true
      }, { onConflict: 'email' })
      .select('id')
      .single()
      .then(({ data, error }) => {
        if (data && data.id) {
          const reCurrent = localDb.getProfile();
          if (reCurrent.id !== data.id) {
            setLocalStorage('fitcore_user_profile', { ...reCurrent, id: data.id });
            window.dispatchEvent(new Event('fitcore_profile_updated'));
          }
        }
        if (error) {
          console.warn("Supabase Profile Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
        }
      });
    }

    return updated;
  },

  getWorkoutPlan: (): WorkoutPlan | null => {
    return getLocalStorage<WorkoutPlan | null>('fitcore_workout_plan', null);
  },

  saveWorkoutPlan: (plan: WorkoutDay[], intensity: string): WorkoutPlan => {
    const profile = localDb.getProfile();
    const newPlan: WorkoutPlan = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: profile.id,
      plan_data: plan,
      completed_exercises: {},
      intensity_level: intensity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLocalStorage('fitcore_workout_plan', newPlan);

    // Sync to Supabase in the background
    if (supabase && profile.id !== DEFAULT_USER_ID) {
      // Clear previous and insert fresh to handle structure updates easily
      supabase.from('ai_workout_plans').delete().eq('user_id', profile.id)
        .then(() => {
          supabase.from('ai_workout_plans').insert({
            user_id: profile.id,
            plan_data: plan,
            completed_exercises: {},
            intensity_level: intensity
          }).then(({ error }) => {
            if (error) console.warn("Supabase Save Workout Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
          });
        });
    }

    return newPlan;
  },

  completeExercise: (exerciseName: string, dateStr: string, isChecked: boolean): WorkoutPlan | null => {
    const plan = localDb.getWorkoutPlan();
    if (!plan) return null;
    const profile = localDb.getProfile();
    
    if (!plan.completed_exercises) {
      plan.completed_exercises = {};
    }
    if (!plan.completed_exercises[dateStr]) {
      plan.completed_exercises[dateStr] = [];
    }
    
    if (isChecked) {
      if (!plan.completed_exercises[dateStr].includes(exerciseName)) {
        plan.completed_exercises[dateStr].push(exerciseName);
      }
    } else {
      plan.completed_exercises[dateStr] = plan.completed_exercises[dateStr].filter(
        name => name !== exerciseName
      );
    }
    
    plan.updated_at = new Date().toISOString();
    setLocalStorage('fitcore_workout_plan', plan);

    // Sync to Supabase in the background
    if (supabase && profile.id !== DEFAULT_USER_ID) {
      supabase.from('ai_workout_plans').update({
        completed_exercises: plan.completed_exercises,
        updated_at: new Date().toISOString()
      }).eq('user_id', profile.id)
      .then(({ error }) => {
        if (error) console.warn("Supabase Workout Checkbox Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
      });
    }

    return plan;
  },

  getDietPlan: (): DietPlan | null => {
    return getLocalStorage<DietPlan | null>('fitcore_diet_plan', null);
  },

  saveDietPlan: (plan: DietDay[]): DietPlan => {
    const profile = localDb.getProfile();
    const newPlan: DietPlan = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: profile.id,
      plan_data: plan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLocalStorage('fitcore_diet_plan', newPlan);

    // Sync to Supabase in the background
    if (supabase && profile.id !== DEFAULT_USER_ID) {
      supabase.from('ai_diet_plans').delete().eq('user_id', profile.id)
        .then(() => {
          supabase.from('ai_diet_plans').insert({
            user_id: profile.id,
            plan_data: plan
          }).then(({ error }) => {
            if (error) console.warn("Supabase Save Diet Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
          });
        });
    }

    return newPlan;
  },

  getProgressLogs: (): ProgressLog[] => {
    const current = getLocalStorage<ProgressLog[]>('fitcore_progress_logs', []);
    const profile = localDb.getProfile();
    if (current.length === 0 && profile.id === DEFAULT_USER_ID) {
      // Seed default logs so the chart isn't empty on first start
      const seed: ProgressLog[] = [
        {
          id: '1',
          user_id: profile.id,
          weight_kg: (profile.weight_kg || 72) - 2.5,
          chest_inches: 38,
          waist_inches: 32,
          arms_inches: 13.5,
          recorded_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          user_id: profile.id,
          weight_kg: (profile.weight_kg || 72) - 1.2,
          chest_inches: 38.5,
          waist_inches: 31.8,
          arms_inches: 13.8,
          recorded_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          user_id: profile.id,
          weight_kg: (profile.weight_kg || 72) - 0.5,
          chest_inches: 39,
          waist_inches: 31.5,
          arms_inches: 14.0,
          recorded_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          user_id: profile.id,
          weight_kg: profile.weight_kg || 72,
          chest_inches: 39.2,
          waist_inches: 31.2,
          arms_inches: 14.2,
          recorded_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }
      ];
      setLocalStorage('fitcore_progress_logs', seed);
      return seed;
    }
    return current;
  },

  addProgressLog: (log: Omit<ProgressLog, 'id' | 'user_id' | 'created_at'>): ProgressLog => {
    const logs = localDb.getProgressLogs();
    const profile = localDb.getProfile();
    const newLog: ProgressLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      user_id: profile.id,
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    logs.sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());
    setLocalStorage('fitcore_progress_logs', logs);
    
    // Also update weight in user profile (which will sync to Supabase too!)
    localDb.updateProfile({ weight_kg: log.weight_kg });

    // Sync to Supabase in the background
    if (supabase && profile.id !== DEFAULT_USER_ID) {
      supabase.from('progress_logs').insert({
        user_id: profile.id,
        weight_kg: log.weight_kg,
        chest_inches: log.chest_inches || null,
        waist_inches: log.waist_inches || null,
        arms_inches: log.arms_inches || null,
        recorded_date: log.recorded_date
      }).then(({ error }) => {
        if (error) console.warn("Supabase Progress Log Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
      });
    }
    
    return newLog;
  },

  getProgressPhotos: (): ProgressPhoto[] => {
    return getLocalStorage<ProgressPhoto[]>('fitcore_progress_photos', []);
  },

  addProgressPhoto: (base64OrUrl: string): ProgressPhoto => {
    const photos = localDb.getProgressPhotos();
    const profile = localDb.getProfile();
    const newPhoto: ProgressPhoto = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: profile.id,
      photo_url: base64OrUrl,
      uploaded_at: new Date().toISOString()
    };
    photos.unshift(newPhoto); // new photos first
    setLocalStorage('fitcore_progress_photos', photos);

    // Sync to Supabase in the background
    if (supabase && profile.id !== DEFAULT_USER_ID) {
      supabase.from('progress_photos').insert({
        user_id: profile.id,
        photo_url: base64OrUrl
      }).then(({ error }) => {
        if (error) console.warn("Supabase Photo Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
      });
    }

    return newPhoto;
  },

  getChatMessages: (): ChatMessage[] => {
    const messages = getLocalStorage<ChatMessage[]>('fitcore_chat_messages', []);
    if (messages.length === 0) {
      const profile = localDb.getProfile();
      const isHinglish = profile.language === 'hinglish';
      const initial: ChatMessage[] = [
        {
          id: 'welcome',
          user_id: profile.id,
          sender: 'ai',
          message: isHinglish 
            ? 'Hi there! Main aapka FitCore AI coach hoon. Aaj aapke fitness aur nutrition goals me main aapki kya madad kar sakta hoon?'
            : 'Hi there! I am your FitCore AI coach. How can I help you with your fitness and nutrition goals today?',
          created_at: new Date().toISOString()
        }
      ];
      setLocalStorage('fitcore_chat_messages', initial);
      return initial;
    }
    return messages;
  },

  addChatMessage: (sender: 'user' | 'ai', message: string): ChatMessage => {
    const messages = localDb.getChatMessages();
    const profile = localDb.getProfile();
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: profile.id,
      sender,
      message,
      created_at: new Date().toISOString()
    };
    messages.push(newMessage);
    setLocalStorage('fitcore_chat_messages', messages);

    // Sync to Supabase in the background
    if (supabase && profile.id !== DEFAULT_USER_ID) {
      supabase.from('chat_messages').insert({
        user_id: profile.id,
        sender,
        message
      }).then(({ error }) => {
        if (error) console.warn("Supabase Chat Message Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
      });
    }

    return newMessage;
  },
  
  clearChat: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fitcore_chat_messages');
    }
    const profile = localDb.getProfile();
    if (supabase && profile.id !== DEFAULT_USER_ID) {
      supabase.from('chat_messages').delete().eq('user_id', profile.id)
        .then(({ error }) => {
          if (error) console.warn("Supabase Clear Chat Sync Failed:", error.message || (typeof error === 'object' ? JSON.stringify(error) : error));
        });
    }
  }
};

// -------------------------------------------------------------
// CLOUD SUPABASE ASYNC SYNCERS
// -------------------------------------------------------------

/**
 * Downloads all data associated with a user's email from Supabase and populates localStorage cache.
 * Returns true if the user profile exists on Supabase.
 */
export async function syncFromSupabase(email: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const formattedEmail = email.toLowerCase().trim();
    
    // 1. Fetch user profile
    const { data: prof, error: profErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', formattedEmail)
      .single();
      
    if (profErr || !prof) return false;
    
    const userId = prof.id;
    setLocalStorage('fitcore_user_profile', prof);
    
    // 2. Fetch workout plan
    const { data: wPlans } = await supabase
      .from('ai_workout_plans')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
    if (wPlans && wPlans.length > 0) {
      setLocalStorage('fitcore_workout_plan', wPlans[0]);
    } else {
      localStorage.removeItem('fitcore_workout_plan');
    }
    
    // 3. Fetch diet plan
    const { data: dPlans } = await supabase
      .from('ai_diet_plans')
      .select('*')
      .eq('user_id', userId)
      .limit(1);
    if (dPlans && dPlans.length > 0) {
      setLocalStorage('fitcore_diet_plan', dPlans[0]);
    } else {
      localStorage.removeItem('fitcore_diet_plan');
    }
    
    // 4. Fetch progress logs
    const { data: logs } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_date', { ascending: true });
    if (logs && logs.length > 0) {
      setLocalStorage('fitcore_progress_logs', logs);
    }
    
    // 5. Fetch progress photos
    const { data: photos } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });
    if (photos && photos.length > 0) {
      setLocalStorage('fitcore_progress_photos', photos);
    }
    
    // 6. Fetch chat messages
    const { data: chats } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (chats && chats.length > 0) {
      setLocalStorage('fitcore_chat_messages', chats);
    }
    
    window.dispatchEvent(new Event('fitcore_profile_updated'));
    return true;
  } catch (e: any) {
    console.warn("Error syncing download from Supabase:", e?.message || e);
    return false;
  }
}

/**
 * Pushes any existing offline local mock data (from guest session) to Supabase tables on first login/signup.
 */
export async function syncToSupabaseOnSignup(profile: UserProfile, supabaseUserId: string) {
  if (!supabase) return;
  try {
    const localWorkout = localDb.getWorkoutPlan();
    const localDiet = localDb.getDietPlan();
    
    // Skip seeding templates if they don't have them generated yet
    if (localWorkout && localWorkout.plan_data.length > 0) {
      await supabase.from('ai_workout_plans').delete().eq('user_id', supabaseUserId);
      await supabase.from('ai_workout_plans').insert({
        user_id: supabaseUserId,
        plan_data: localWorkout.plan_data,
        completed_exercises: localWorkout.completed_exercises || {},
        intensity_level: localWorkout.intensity_level || 'intermediate'
      });
    }
    
    if (localDiet && localDiet.plan_data.length > 0) {
      await supabase.from('ai_diet_plans').delete().eq('user_id', supabaseUserId);
      await supabase.from('ai_diet_plans').insert({
        user_id: supabaseUserId,
        plan_data: localDiet.plan_data
      });
    }

    const localLogs = getLocalStorage<ProgressLog[]>('fitcore_progress_logs', []);
    if (localLogs && localLogs.length > 0) {
      const logsToInsert = localLogs.map(l => ({
        user_id: supabaseUserId,
        weight_kg: l.weight_kg,
        chest_inches: l.chest_inches || null,
        waist_inches: l.waist_inches || null,
        arms_inches: l.arms_inches || null,
        recorded_date: l.recorded_date
      }));
      await supabase.from('progress_logs').insert(logsToInsert);
    }

    const localPhotos = getLocalStorage<ProgressPhoto[]>('fitcore_progress_photos', []);
    if (localPhotos && localPhotos.length > 0) {
      const photosToInsert = localPhotos.map(p => ({
        user_id: supabaseUserId,
        photo_url: p.photo_url
      }));
      await supabase.from('progress_photos').insert(photosToInsert);
    }

    const localChats = getLocalStorage<ChatMessage[]>('fitcore_chat_messages', []);
    if (localChats && localChats.length > 1) { // more than the welcome msg
      const chatsToInsert = localChats.map(c => ({
        user_id: supabaseUserId,
        sender: c.sender,
        message: c.message
      }));
      await supabase.from('chat_messages').insert(chatsToInsert);
    }
  } catch (e: any) {
    console.warn("Error migrating offline data to Supabase:", e?.message || e);
  }
}
