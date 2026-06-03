-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: users (core profile and fitness configuration)
create table users (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  email text unique not null,
  name text not null,
  
  -- Fitness profiles
  gender text check (gender in ('male', 'female', 'other')),
  dob date,
  goal text check (goal in ('weight loss', 'muscle gain', 'endurance', 'flexibility')),
  experience text check (experience in ('beginner', 'intermediate', 'advanced')),
  equipment text check (equipment in ('home', 'gym', 'none')),
  days_per_week int check (days_per_week between 1 and 7),
  
  -- Nutrition profiles
  diet_type text check (diet_type in ('veg', 'non-veg', 'vegan')),
  diet_goal text check (diet_goal in ('lose fat', 'gain muscle', 'maintain')),
  allergies text[] default '{}',
  meals_per_day int default 3 check (meals_per_day between 1 and 8),
  
  -- Initial metrics
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  
  created_at timestamp with time zone not null default now()
);

-- Table: ai_workout_plans (stores generated plans and completions)
create table ai_workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_data jsonb not null, -- Array of days with exercises, sets, reps, tips
  completed_exercises jsonb not null default '{}'::jsonb, -- e.g. {"2026-06-03": ["Squats", "Lunge"]}
  intensity_level text not null default 'beginner',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Table: ai_diet_plans (stores generated meals & macro goals)
create table ai_diet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_data jsonb not null, -- 7 days meal plan
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Table: progress_logs (weight, chest, waist, arms tracker)
create table progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  weight_kg numeric(5, 2) not null,
  chest_inches numeric(4, 2),
  waist_inches numeric(4, 2),
  arms_inches numeric(4, 2),
  recorded_date date not null default current_date,
  created_at timestamp with time zone not null default now()
);

-- Table: progress_photos (storage photo URL tracking)
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  photo_url text not null,
  uploaded_at timestamp with time zone not null default now()
);

-- Table: chat_messages (conversation history with the AI Coach)
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  sender text not null check (sender in ('user', 'ai')),
  message text not null,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table users enable row level security;
alter table ai_workout_plans enable row level security;
alter table ai_diet_plans enable row level security;
alter table progress_logs enable row level security;
alter table progress_photos enable row level security;
alter table chat_messages enable row level security;

-- Basic user-specific read/write policies (Public access for simplicity in local demo workspace, with RLS bypass using system keys or filter by user id)
create policy "Users can read own profile" on users for select using (true);
create policy "Users can update own profile" on users for update using (true);
create policy "Users can insert own profile" on users for insert with check (true);

create policy "Users can access own workouts" on ai_workout_plans for all using (true);
create policy "Users can access own diet plans" on ai_diet_plans for all using (true);
create policy "Users can access own progress logs" on progress_logs for all using (true);
create policy "Users can access own progress photos" on progress_photos for all using (true);
create policy "Users can access own chat logs" on chat_messages for all using (true);
