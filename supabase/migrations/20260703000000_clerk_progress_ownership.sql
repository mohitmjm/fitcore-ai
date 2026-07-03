-- Allow progress data to be written by Clerk-backed server routes.
--
-- The legacy Supabase schema keyed progress rows by auth.users UUIDs. FitCore now keeps Clerk as
-- the authentication source, so server-side writes need a Clerk ownership column while the broader
-- Supabase migration continues.

ALTER TABLE public.progress_logs
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT,
  ADD COLUMN IF NOT EXISTS body_fat_pct NUMERIC(5, 2);

ALTER TABLE public.progress_photos
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

ALTER TABLE public.progress_logs
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.progress_photos
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'progress_logs_owner_present'
      AND conrelid = 'public.progress_logs'::regclass
  ) THEN
    ALTER TABLE public.progress_logs
      ADD CONSTRAINT progress_logs_owner_present
      CHECK (user_id IS NOT NULL OR clerk_user_id IS NOT NULL)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'progress_photos_owner_present'
      AND conrelid = 'public.progress_photos'::regclass
  ) THEN
    ALTER TABLE public.progress_photos
      ADD CONSTRAINT progress_photos_owner_present
      CHECK (user_id IS NOT NULL OR clerk_user_id IS NOT NULL)
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_progress_logs_clerk_user_date
  ON public.progress_logs (clerk_user_id, recorded_date DESC)
  WHERE clerk_user_id IS NOT NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_progress_photos_clerk_user_uploaded
  ON public.progress_photos (clerk_user_id, uploaded_at DESC)
  WHERE clerk_user_id IS NOT NULL AND is_active = TRUE;

COMMENT ON COLUMN public.progress_logs.clerk_user_id IS
  'Clerk user id used by FitCore server routes when Supabase Auth is not the identity provider.';

COMMENT ON COLUMN public.progress_photos.clerk_user_id IS
  'Clerk user id used by FitCore server routes when Supabase Auth is not the identity provider.';
