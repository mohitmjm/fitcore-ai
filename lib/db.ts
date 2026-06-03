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
  created_at?: string;
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
      height_cm: 178
    });
  },

  updateProfile: (profile: Partial<UserProfile>): UserProfile => {
    const current = localDb.getProfile();
    const updated = { ...current, ...profile };
    setLocalStorage('fitcore_user_profile', updated);
    return updated;
  },

  getWorkoutPlan: (): WorkoutPlan | null => {
    return getLocalStorage<WorkoutPlan | null>('fitcore_workout_plan', null);
  },

  saveWorkoutPlan: (plan: WorkoutDay[], intensity: string): WorkoutPlan => {
    const newPlan: WorkoutPlan = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: DEFAULT_USER_ID,
      plan_data: plan,
      completed_exercises: {},
      intensity_level: intensity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLocalStorage('fitcore_workout_plan', newPlan);
    return newPlan;
  },

  completeExercise: (exerciseName: string, dateStr: string, isChecked: boolean): WorkoutPlan | null => {
    const plan = localDb.getWorkoutPlan();
    if (!plan) return null;
    
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
    return plan;
  },

  getDietPlan: (): DietPlan | null => {
    return getLocalStorage<DietPlan | null>('fitcore_diet_plan', null);
  },

  saveDietPlan: (plan: DietDay[]): DietPlan => {
    const newPlan: DietPlan = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: DEFAULT_USER_ID,
      plan_data: plan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setLocalStorage('fitcore_diet_plan', newPlan);
    return newPlan;
  },

  getProgressLogs: (): ProgressLog[] => {
    const current = getLocalStorage<ProgressLog[]>('fitcore_progress_logs', []);
    if (current.length === 0) {
      // Seed default logs so the chart isn't empty on first start
      const profile = localDb.getProfile();
      const seed: ProgressLog[] = [
        {
          id: '1',
          user_id: DEFAULT_USER_ID,
          weight_kg: (profile.weight_kg || 72) - 2.5,
          chest_inches: 38,
          waist_inches: 32,
          arms_inches: 13.5,
          recorded_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          user_id: DEFAULT_USER_ID,
          weight_kg: (profile.weight_kg || 72) - 1.2,
          chest_inches: 38.5,
          waist_inches: 31.8,
          arms_inches: 13.8,
          recorded_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          user_id: DEFAULT_USER_ID,
          weight_kg: (profile.weight_kg || 72) - 0.5,
          chest_inches: 39,
          waist_inches: 31.5,
          arms_inches: 14.0,
          recorded_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          user_id: DEFAULT_USER_ID,
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
    const newLog: ProgressLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      user_id: DEFAULT_USER_ID,
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    // Sort by date ascending
    logs.sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());
    setLocalStorage('fitcore_progress_logs', logs);
    
    // Also update weight in user profile
    localDb.updateProfile({ weight_kg: log.weight_kg });
    
    return newLog;
  },

  getProgressPhotos: (): ProgressPhoto[] => {
    return getLocalStorage<ProgressPhoto[]>('fitcore_progress_photos', []);
  },

  addProgressPhoto: (base64OrUrl: string): ProgressPhoto => {
    const photos = localDb.getProgressPhotos();
    const newPhoto: ProgressPhoto = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: DEFAULT_USER_ID,
      photo_url: base64OrUrl,
      uploaded_at: new Date().toISOString()
    };
    photos.unshift(newPhoto); // new photos first
    setLocalStorage('fitcore_progress_photos', photos);
    return newPhoto;
  },

  getChatMessages: (): ChatMessage[] => {
    const messages = getLocalStorage<ChatMessage[]>('fitcore_chat_messages', []);
    if (messages.length === 0) {
      const initial: ChatMessage[] = [
        {
          id: 'welcome',
          user_id: DEFAULT_USER_ID,
          sender: 'ai',
          message: 'Hi there! I am your FitCore AI coach. How can I help you with your fitness and nutrition goals today?',
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
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: DEFAULT_USER_ID,
      sender,
      message,
      created_at: new Date().toISOString()
    };
    messages.push(newMessage);
    setLocalStorage('fitcore_chat_messages', messages);
    return newMessage;
  },
  
  clearChat: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fitcore_chat_messages');
    }
  }
};
