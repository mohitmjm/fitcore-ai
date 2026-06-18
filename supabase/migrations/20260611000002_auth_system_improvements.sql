-- Auth system improvements: add missing columns to users table

-- Username (unique per user, used for profile lookup)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (lower(username)) WHERE username IS NOT NULL;

-- Activity type (primary sport/activity selected during onboarding)
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (
  activity_type IN ('gym', 'badminton', 'cricket', 'football', 'yoga')
);

-- Preferred language for AI responses
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'english' CHECK (
  language IN ('english', 'hinglish')
);

-- Subscription expiry date
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Add RLS-bypass delete policy if not already present (needed for plan reset during onboarding)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can delete own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (true)';
  END IF;
END $$;
