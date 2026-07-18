-- Clerk-auth user profile storage for the current FitCore app.
--
-- Existing early migrations modeled public.users around Supabase Auth UUIDs.
-- The app now keeps Clerk as the identity provider, so application user/profile
-- data is keyed by Clerk's stable user id and accessed only from server routes
-- with SUPABASE_SERVICE_ROLE_KEY.

CREATE TABLE IF NOT EXISTS public.clerk_profiles (
  clerk_user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT 'Athlete',
  image_url TEXT,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'trainer', 'nutritionist', 'admin')),
  locale TEXT NOT NULL DEFAULT 'english'
    CHECK (locale IN ('english', 'hindi', 'hinglish')),
  profile JSONB NOT NULL DEFAULT '{}'::JSONB,
  subscription JSONB NOT NULL DEFAULT '{"plan":"free","status":"active"}'::JSONB,
  onboarding_completed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clerk_profiles_active
  ON public.clerk_profiles (clerk_user_id)
  WHERE is_active = TRUE;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clerk_profiles_updated_at ON public.clerk_profiles;
CREATE TRIGGER trg_clerk_profiles_updated_at
  BEFORE UPDATE ON public.clerk_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.clerk_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.clerk_profiles FROM anon, authenticated;
GRANT ALL ON public.clerk_profiles TO service_role;
