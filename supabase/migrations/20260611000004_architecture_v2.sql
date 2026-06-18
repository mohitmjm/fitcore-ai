-- ══════════════════════════════════════════════════════════════════
-- FITCORE AI — DATABASE ARCHITECTURE V2
-- Migration: 20260611000004_architecture_v2.sql
--
-- Covers:
--   1. De-duplicate profile creation (trigger-only, with guard)
--   2. Integrity: NOT NULL, UNIQUE, FK constraints, UUID PKs
--   3. Audit trail: created_at, updated_at, created_by, updated_by
--   4. Soft delete: is_active, deleted_at, deleted_by
--   5. Strengthened RLS: per-operation WITH CHECK policies
--   6. Supabase Storage bucket RLS policies
--   7. User-centric architecture: auth.uid() as master identifier
--   8. Performance indexes on hot query paths
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- SECTION 0: Extensions
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- SECTION 1: AUDIT TRAIL INFRASTRUCTURE
-- Auto-managed updated_at trigger applied to every table
-- ─────────────────────────────────────────────────────────────────

-- Generic trigger function: stamp updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Generic trigger function: stamp updated_by with auth.uid()
CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- SECTION 2: USERS TABLE — Complete overhaul
-- ─────────────────────────────────────────────────────────────────

-- 2a. Ensure id IS the auth.users.id (already set in migration 003)
-- Make id reference auth.users directly (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey'
      AND table_name = 'users'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2b. Add audit + soft-delete columns (idempotent)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by     UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by     UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by     UUID REFERENCES auth.users(id);

-- 2c. Backfill updated_at where null (shouldn't exist, but guard)
UPDATE public.users SET updated_at = created_at WHERE updated_at IS NULL;

-- 2d. Attach audit triggers to users
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_by ON public.users;
CREATE TRIGGER trg_users_updated_by
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

-- ─────────────────────────────────────────────────────────────────
-- SECTION 3: IMPROVED TRIGGER — prevent duplicate profiles
-- The trigger only fires on INSERT into auth.users.
-- ON CONFLICT (id) DO NOTHING = zero duplicate risk.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name  TEXT;
  v_username   TEXT;
BEGIN
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Generate a unique username: lowercase email prefix + random 4-char suffix
  v_username := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'))
                || '_'
                || SUBSTRING(ENCODE(GEN_RANDOM_BYTES(3), 'hex') FROM 1 FOR 4);

  INSERT INTO public.users (
    id,
    auth_id,
    email,
    name,
    full_name,
    username,
    language,
    is_subscribed,
    subscription_expires_at,
    wallet_balance,
    referrals,
    whatsapp_enabled,
    sms_enabled,
    email_enabled,
    is_active,
    created_at,
    updated_at,
    created_by
  )
  VALUES (
    NEW.id,
    NEW.id,
    LOWER(TRIM(NEW.email)),
    v_full_name,
    v_full_name,
    v_username,
    'english',
    TRUE,
    NOW() + INTERVAL '10 years',
    100,
    '{}',
    TRUE,
    FALSE,
    TRUE,
    TRUE,
    NOW(),
    NOW(),
    NEW.id   -- creator is the user themselves
  )
  ON CONFLICT (id) DO NOTHING;  -- absolute guard against double-insert

  RETURN NEW;
END;
$$;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- SECTION 4: AI_WORKOUT_PLANS — audit + soft-delete + RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.ai_workout_plans
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES auth.users(id);

-- Backfill created_by with user_id for existing rows
UPDATE public.ai_workout_plans SET created_by = user_id WHERE created_by IS NULL;

DROP TRIGGER IF EXISTS trg_workout_updated_at ON public.ai_workout_plans;
CREATE TRIGGER trg_workout_updated_at
  BEFORE UPDATE ON public.ai_workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workout_updated_by ON public.ai_workout_plans;
CREATE TRIGGER trg_workout_updated_by
  BEFORE UPDATE ON public.ai_workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

-- RLS: drop all previous catch-all policies, add per-operation strict ones
DROP POLICY IF EXISTS "workout_plans_own" ON public.ai_workout_plans;

CREATE POLICY "workout_select_own" ON public.ai_workout_plans
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);

CREATE POLICY "workout_insert_own" ON public.ai_workout_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "workout_update_own" ON public.ai_workout_plans
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workout_delete_own" ON public.ai_workout_plans
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- SECTION 5: AI_DIET_PLANS — audit + soft-delete + RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.ai_diet_plans
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES auth.users(id);

UPDATE public.ai_diet_plans SET created_by = user_id WHERE created_by IS NULL;

DROP TRIGGER IF EXISTS trg_diet_updated_at ON public.ai_diet_plans;
CREATE TRIGGER trg_diet_updated_at
  BEFORE UPDATE ON public.ai_diet_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_diet_updated_by ON public.ai_diet_plans;
CREATE TRIGGER trg_diet_updated_by
  BEFORE UPDATE ON public.ai_diet_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP POLICY IF EXISTS "diet_plans_own" ON public.ai_diet_plans;

CREATE POLICY "diet_select_own" ON public.ai_diet_plans
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);

CREATE POLICY "diet_insert_own" ON public.ai_diet_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "diet_update_own" ON public.ai_diet_plans
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "diet_delete_own" ON public.ai_diet_plans
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- SECTION 6: PROGRESS_LOGS — audit + soft-delete + RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.progress_logs
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES auth.users(id);

UPDATE public.progress_logs SET created_by = user_id WHERE created_by IS NULL;

DROP TRIGGER IF EXISTS trg_progress_updated_at ON public.progress_logs;
CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON public.progress_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_progress_updated_by ON public.progress_logs;
CREATE TRIGGER trg_progress_updated_by
  BEFORE UPDATE ON public.progress_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP POLICY IF EXISTS "progress_logs_own" ON public.progress_logs;

CREATE POLICY "progress_logs_select_own" ON public.progress_logs
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);

CREATE POLICY "progress_logs_insert_own" ON public.progress_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_logs_update_own" ON public.progress_logs
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_logs_delete_own" ON public.progress_logs
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- SECTION 7: PROGRESS_PHOTOS — audit + soft-delete + RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.progress_photos
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES auth.users(id);

UPDATE public.progress_photos SET created_by = user_id WHERE created_by IS NULL;

DROP TRIGGER IF EXISTS trg_photos_updated_at ON public.progress_photos;
CREATE TRIGGER trg_photos_updated_at
  BEFORE UPDATE ON public.progress_photos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_photos_updated_by ON public.progress_photos;
CREATE TRIGGER trg_photos_updated_by
  BEFORE UPDATE ON public.progress_photos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

DROP POLICY IF EXISTS "progress_photos_own" ON public.progress_photos;

CREATE POLICY "photos_select_own" ON public.progress_photos
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);

CREATE POLICY "photos_insert_own" ON public.progress_photos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "photos_update_own" ON public.progress_photos
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "photos_delete_own" ON public.progress_photos
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- SECTION 8: CHAT_MESSAGES — audit + soft-delete + RLS
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID REFERENCES auth.users(id);

DROP TRIGGER IF EXISTS trg_chat_updated_at ON public.chat_messages;
CREATE TRIGGER trg_chat_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "chat_messages_own" ON public.chat_messages;

CREATE POLICY "chat_select_own" ON public.chat_messages
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);

CREATE POLICY "chat_insert_own" ON public.chat_messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_update_own" ON public.chat_messages
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_delete_own" ON public.chat_messages
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- SECTION 9: STRENGTHENED USERS TABLE RLS
-- Replace simple policies from migration 003 with per-operation
-- WITH CHECK policies.
-- ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users_select_own"  ON public.users;
DROP POLICY IF EXISTS "users_insert_own"  ON public.users;
DROP POLICY IF EXISTS "users_update_own"  ON public.users;
DROP POLICY IF EXISTS "users_delete_own"  ON public.users;

-- SELECT: only own active row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid() AND is_active = TRUE);

-- INSERT: system/trigger only — app code must NOT insert directly;
-- the trigger handles it. But if needed, only own row allowed.
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- UPDATE: only own row; cannot escalate user_id to someone else's
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Soft delete only — actual DELETE is blocked (use is_active = FALSE)
-- We intentionally do NOT create a DELETE policy on users.
-- Hard deletes are handled via cascade from auth.users by Supabase Admin.

-- ─────────────────────────────────────────────────────────────────
-- SECTION 10: SUPABASE STORAGE BUCKET POLICIES
-- Enforces per-user isolation on file uploads.
-- Bucket naming convention: "fitcore-uploads"
-- Path convention: {user_id}/{category}/{filename}
-- ─────────────────────────────────────────────────────────────────

-- Create the bucket if it doesn't already exist (no-op if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fitcore-uploads',
  'fitcore-uploads',
  FALSE,  -- private bucket: no public URL access
  10485760,  -- 10 MB per file max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop any previous storage policies
DROP POLICY IF EXISTS "storage_user_upload"  ON storage.objects;
DROP POLICY IF EXISTS "storage_user_select"  ON storage.objects;
DROP POLICY IF EXISTS "storage_user_update"  ON storage.objects;
DROP POLICY IF EXISTS "storage_user_delete"  ON storage.objects;

-- Users can only upload files inside their own folder: {auth.uid()}/...
CREATE POLICY "storage_user_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fitcore-uploads' AND
    (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Users can only view their own files
CREATE POLICY "storage_user_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'fitcore-uploads' AND
    (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Users can update metadata on their own files only
CREATE POLICY "storage_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fitcore-uploads' AND
    (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Users can delete their own files only
CREATE POLICY "storage_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fitcore-uploads' AND
    (storage.foldername(name))[1] = (auth.uid())::text
  );

-- ─────────────────────────────────────────────────────────────────
-- SECTION 11: PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────

-- users
CREATE INDEX IF NOT EXISTS idx_users_email          ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_auth_id        ON public.users (auth_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active      ON public.users (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_username       ON public.users (lower(username));

-- ai_workout_plans
CREATE INDEX IF NOT EXISTS idx_workout_user_id      ON public.ai_workout_plans (user_id);
CREATE INDEX IF NOT EXISTS idx_workout_active       ON public.ai_workout_plans (user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_workout_created_at   ON public.ai_workout_plans (user_id, created_at DESC);

-- ai_diet_plans
CREATE INDEX IF NOT EXISTS idx_diet_user_id         ON public.ai_diet_plans (user_id);
CREATE INDEX IF NOT EXISTS idx_diet_active          ON public.ai_diet_plans (user_id, is_active) WHERE is_active = TRUE;

-- progress_logs
CREATE INDEX IF NOT EXISTS idx_progress_user_date   ON public.progress_logs (user_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_active      ON public.progress_logs (user_id, is_active) WHERE is_active = TRUE;

-- progress_photos
CREATE INDEX IF NOT EXISTS idx_photos_user_id       ON public.progress_photos (user_id);
CREATE INDEX IF NOT EXISTS idx_photos_active        ON public.progress_photos (user_id, is_active) WHERE is_active = TRUE;

-- chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_user_created    ON public.chat_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_active          ON public.chat_messages (user_id, is_active) WHERE is_active = TRUE;

-- ─────────────────────────────────────────────────────────────────
-- SECTION 12: SOFT DELETE HELPER FUNCTION
-- Call this instead of DELETE to preserve audit trails.
-- Usage: SELECT soft_delete('ai_workout_plans', '<row_uuid>');
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.soft_delete(
  p_table TEXT,
  p_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE FORMAT(
    'UPDATE public.%I SET is_active = FALSE, deleted_at = NOW(), deleted_by = auth.uid() WHERE id = $1 AND (user_id = auth.uid() OR id = auth.uid())',
    p_table
  ) USING p_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────
-- SECTION 13: FUTURE-PROOF SCAFFOLD TABLES
-- These tables are created now so future features link correctly
-- to auth.uid(). All use UUID PKs and full audit columns.
-- ─────────────────────────────────────────────────────────────────

-- user_preferences: app-level settings beyond the users table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- UI/UX preferences
  theme        TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  language     TEXT NOT NULL DEFAULT 'english' CHECK (language IN ('english', 'hinglish')),
  -- notification preferences (extended)
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  -- AI preferences
  ai_model     TEXT NOT NULL DEFAULT 'llama3.2',
  ai_tone      TEXT NOT NULL DEFAULT 'coach' CHECK (ai_tone IN ('coach', 'friendly', 'strict')),
  -- audit
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id),
  updated_by   UUID REFERENCES auth.users(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at   TIMESTAMPTZ,
  deleted_by   UUID REFERENCES auth.users(id),
  -- one preferences row per user
  UNIQUE (user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_select_own" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);
CREATE POLICY "prefs_insert_own" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "prefs_update_own" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_prefs_updated_at ON public.user_preferences;
CREATE TRIGGER trg_prefs_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_prefs_user_id ON public.user_preferences (user_id);

-- ──────────────────────────────────────
-- workspace_settings: org/team level config
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_name TEXT NOT NULL DEFAULT 'My Workspace',
  timezone     TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  currency     TEXT NOT NULL DEFAULT 'INR',
  -- audit
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id),
  updated_by   UUID REFERENCES auth.users(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at   TIMESTAMPTZ,
  deleted_by   UUID REFERENCES auth.users(id),
  UNIQUE (user_id)
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select_own" ON public.workspace_settings
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);
CREATE POLICY "workspace_insert_own" ON public.workspace_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "workspace_update_own" ON public.workspace_settings
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_workspace_updated_at ON public.workspace_settings;
CREATE TRIGGER trg_workspace_updated_at
  BEFORE UPDATE ON public.workspace_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_workspace_user_id ON public.workspace_settings (user_id);

-- ──────────────────────────────────────
-- ai_conversations: future multi-session chat history
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'New Conversation',
  model        TEXT NOT NULL DEFAULT 'llama3.2',
  message_count INT NOT NULL DEFAULT 0,
  -- audit
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id),
  updated_by   UUID REFERENCES auth.users(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at   TIMESTAMPTZ,
  deleted_by   UUID REFERENCES auth.users(id)
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_own" ON public.ai_conversations
  FOR SELECT USING (user_id = auth.uid() AND is_active = TRUE);
CREATE POLICY "conversations_insert_own" ON public.ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_update_own" ON public.ai_conversations
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_delete_own" ON public.ai_conversations
  FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated  ON public.ai_conversations (user_id, updated_at DESC);

-- ──────────────────────────────────────
-- user_analytics: aggregate event tracking
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,           -- e.g. 'workout_completed', 'diet_viewed'
  event_data   JSONB NOT NULL DEFAULT '{}'::JSONB,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- audit
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID REFERENCES auth.users(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_select_own" ON public.user_analytics
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "analytics_insert_own" ON public.user_analytics
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_analytics_user_event  ON public.user_analytics (user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_occurred_at ON public.user_analytics (user_id, occurred_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- SECTION 14: TRIGGER — auto-create user_preferences row on signup
-- Runs in the same transaction as handle_new_user via a second trigger
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, created_by)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.workspace_settings (user_id, created_by)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- ─────────────────────────────────────────────────────────────────
-- SECTION 15: SERVICE ROLE GRANTS
-- Grants full access to service_role (used by server-side API routes)
-- ─────────────────────────────────────────────────────────────────

GRANT ALL ON public.users               TO service_role;
GRANT ALL ON public.ai_workout_plans    TO service_role;
GRANT ALL ON public.ai_diet_plans       TO service_role;
GRANT ALL ON public.progress_logs       TO service_role;
GRANT ALL ON public.progress_photos     TO service_role;
GRANT ALL ON public.chat_messages       TO service_role;
GRANT ALL ON public.user_preferences    TO service_role;
GRANT ALL ON public.workspace_settings  TO service_role;
GRANT ALL ON public.ai_conversations    TO service_role;
GRANT ALL ON public.user_analytics      TO service_role;

-- Grant authenticated role SELECT/INSERT/UPDATE/DELETE (RLS further restricts)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workout_plans    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_diet_plans       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_logs       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_photos     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_settings  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations    TO authenticated;
GRANT SELECT, INSERT, UPDATE          ON public.user_analytics     TO authenticated;
