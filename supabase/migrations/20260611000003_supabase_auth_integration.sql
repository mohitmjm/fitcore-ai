-- ============================================================
-- Supabase Auth Integration
-- Links auth.users → public.users with trigger + strict RLS
-- ============================================================

-- Drop old permissive policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

-- Drop old permissive policies on child tables
DROP POLICY IF EXISTS "Users can access own workouts" ON ai_workout_plans;
DROP POLICY IF EXISTS "Users can access own diet plans" ON ai_diet_plans;
DROP POLICY IF EXISTS "Users can access own progress logs" ON progress_logs;
DROP POLICY IF EXISTS "Users can access own progress photos" ON progress_photos;
DROP POLICY IF EXISTS "Users can access own chat logs" ON chat_messages;

-- ── users table: link id to auth.users ──────────────────────
-- Add foreign key to auth.users if not already present
-- (Safe: if the column already has the right type, this is a no-op)
ALTER TABLE users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add auth_id column that references auth.users
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add full_name column (collected during signup via Supabase metadata)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- ── Trigger: auto-create public.users row on auth.users signup ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, auth_id, email, name, full_name, is_subscribed, subscription_expires_at, wallet_balance, referrals, whatsapp_enabled, sms_enabled, email_enabled)
  VALUES (
    NEW.id,  -- use auth.users.id as our primary key
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    true,
    (NOW() + INTERVAL '10 years'),
    100,
    '{}',
    true,
    false,
    true
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to avoid duplicates on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Strict RLS Policies using auth.uid() ────────────────────

-- users table: users can only see/modify their own row
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth_id = auth.uid() OR id = auth.uid());

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid() OR id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth_id = auth.uid() OR id = auth.uid());

CREATE POLICY "users_delete_own" ON users
  FOR DELETE USING (auth_id = auth.uid() OR id = auth.uid());

-- ai_workout_plans
CREATE POLICY "workout_plans_own" ON ai_workout_plans
  FOR ALL USING (user_id = auth.uid());

-- ai_diet_plans
CREATE POLICY "diet_plans_own" ON ai_diet_plans
  FOR ALL USING (user_id = auth.uid());

-- progress_logs
CREATE POLICY "progress_logs_own" ON progress_logs
  FOR ALL USING (user_id = auth.uid());

-- progress_photos
CREATE POLICY "progress_photos_own" ON progress_photos
  FOR ALL USING (user_id = auth.uid());

-- chat_messages
CREATE POLICY "chat_messages_own" ON chat_messages
  FOR ALL USING (user_id = auth.uid());

-- ── Grant service_role full access (for server-side operations) ──
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.ai_workout_plans TO service_role;
GRANT ALL ON public.ai_diet_plans TO service_role;
GRANT ALL ON public.progress_logs TO service_role;
GRANT ALL ON public.progress_photos TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
