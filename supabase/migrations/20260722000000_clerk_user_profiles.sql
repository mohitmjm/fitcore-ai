-- Clerk-keyed profile persistence for the current FitCore app.
-- Existing Supabase users tables are auth.uid()-centric; this table keeps Clerk as the identity
-- source while moving the user fitness profile path to Supabase.

create table if not exists public.clerk_user_profiles (
  clerk_user_id text primary key,
  email text not null default '',
  name text not null default 'Athlete',
  image_url text,
  role text not null default 'user' check (role in ('user', 'trainer', 'nutritionist', 'admin')),
  phone text,
  profile jsonb not null default '{}'::jsonb,
  onboarding_completed_at timestamptz,
  locale text not null default 'english' check (locale in ('english', 'hindi', 'hinglish')),
  subscription jsonb not null default '{"plan":"free","status":"active"}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clerk_user_profiles_email on public.clerk_user_profiles (lower(email));
create index if not exists idx_clerk_user_profiles_active
  on public.clerk_user_profiles (is_active)
  where is_active = true;

create or replace function public.set_clerk_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clerk_user_profiles_updated_at on public.clerk_user_profiles;
create trigger trg_clerk_user_profiles_updated_at
  before update on public.clerk_user_profiles
  for each row execute function public.set_clerk_user_profiles_updated_at();

alter table public.clerk_user_profiles enable row level security;

drop policy if exists "service_role_manage_clerk_profiles" on public.clerk_user_profiles;
create policy "service_role_manage_clerk_profiles" on public.clerk_user_profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant all on public.clerk_user_profiles to service_role;
