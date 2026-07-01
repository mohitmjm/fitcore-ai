-- Lock private FitCore data to the server-side service role.
--
-- The app now uses Clerk for authentication and calls Supabase from server routes
-- with SUPABASE_SERVICE_ROLE_KEY. Supabase-auth policies based on auth.uid() do
-- not isolate Clerk users, so private domain tables should not be directly
-- readable or writable by anon/authenticated Supabase clients.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Legacy demo policies from the initial schema.
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Users can access own workouts" ON public.ai_workout_plans;
DROP POLICY IF EXISTS "Users can access own diet plans" ON public.ai_diet_plans;
DROP POLICY IF EXISTS "Users can access own progress logs" ON public.progress_logs;
DROP POLICY IF EXISTS "Users can access own progress photos" ON public.progress_photos;
DROP POLICY IF EXISTS "Users can access own chat logs" ON public.chat_messages;

-- Supabase-auth policies from the pre-Clerk architecture.
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;

DROP POLICY IF EXISTS "workout_plans_own" ON public.ai_workout_plans;
DROP POLICY IF EXISTS "workout_select_own" ON public.ai_workout_plans;
DROP POLICY IF EXISTS "workout_insert_own" ON public.ai_workout_plans;
DROP POLICY IF EXISTS "workout_update_own" ON public.ai_workout_plans;
DROP POLICY IF EXISTS "workout_delete_own" ON public.ai_workout_plans;

DROP POLICY IF EXISTS "diet_plans_own" ON public.ai_diet_plans;
DROP POLICY IF EXISTS "diet_select_own" ON public.ai_diet_plans;
DROP POLICY IF EXISTS "diet_insert_own" ON public.ai_diet_plans;
DROP POLICY IF EXISTS "diet_update_own" ON public.ai_diet_plans;
DROP POLICY IF EXISTS "diet_delete_own" ON public.ai_diet_plans;

DROP POLICY IF EXISTS "progress_logs_own" ON public.progress_logs;
DROP POLICY IF EXISTS "progress_logs_select_own" ON public.progress_logs;
DROP POLICY IF EXISTS "progress_logs_insert_own" ON public.progress_logs;
DROP POLICY IF EXISTS "progress_logs_update_own" ON public.progress_logs;
DROP POLICY IF EXISTS "progress_logs_delete_own" ON public.progress_logs;

DROP POLICY IF EXISTS "progress_photos_own" ON public.progress_photos;
DROP POLICY IF EXISTS "photos_select_own" ON public.progress_photos;
DROP POLICY IF EXISTS "photos_insert_own" ON public.progress_photos;
DROP POLICY IF EXISTS "photos_update_own" ON public.progress_photos;
DROP POLICY IF EXISTS "photos_delete_own" ON public.progress_photos;

DROP POLICY IF EXISTS "chat_messages_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_select_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_insert_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_update_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_delete_own" ON public.chat_messages;

DROP POLICY IF EXISTS "prefs_select_own" ON public.user_preferences;
DROP POLICY IF EXISTS "prefs_insert_own" ON public.user_preferences;
DROP POLICY IF EXISTS "prefs_update_own" ON public.user_preferences;

DROP POLICY IF EXISTS "workspace_select_own" ON public.workspace_settings;
DROP POLICY IF EXISTS "workspace_insert_own" ON public.workspace_settings;
DROP POLICY IF EXISTS "workspace_update_own" ON public.workspace_settings;

DROP POLICY IF EXISTS "conversations_select_own" ON public.ai_conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON public.ai_conversations;
DROP POLICY IF EXISTS "conversations_update_own" ON public.ai_conversations;
DROP POLICY IF EXISTS "conversations_delete_own" ON public.ai_conversations;

DROP POLICY IF EXISTS "analytics_select_own" ON public.user_analytics;
DROP POLICY IF EXISTS "analytics_insert_own" ON public.user_analytics;

REVOKE ALL ON public.users FROM anon, authenticated;
REVOKE ALL ON public.ai_workout_plans FROM anon, authenticated;
REVOKE ALL ON public.ai_diet_plans FROM anon, authenticated;
REVOKE ALL ON public.progress_logs FROM anon, authenticated;
REVOKE ALL ON public.progress_photos FROM anon, authenticated;
REVOKE ALL ON public.chat_messages FROM anon, authenticated;
REVOKE ALL ON public.user_preferences FROM anon, authenticated;
REVOKE ALL ON public.workspace_settings FROM anon, authenticated;
REVOKE ALL ON public.ai_conversations FROM anon, authenticated;
REVOKE ALL ON public.user_analytics FROM anon, authenticated;

GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.ai_workout_plans TO service_role;
GRANT ALL ON public.ai_diet_plans TO service_role;
GRANT ALL ON public.progress_logs TO service_role;
GRANT ALL ON public.progress_photos TO service_role;
GRANT ALL ON public.chat_messages TO service_role;
GRANT ALL ON public.user_preferences TO service_role;
GRANT ALL ON public.workspace_settings TO service_role;
GRANT ALL ON public.ai_conversations TO service_role;
GRANT ALL ON public.user_analytics TO service_role;
