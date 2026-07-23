-- Clerk-keyed progress persistence for the current FitCore app.
-- The older progress tables are auth.uid()/UUID based; these tables keep Clerk as the identity
-- source and are accessed only through server-side service-role requests.

create table if not exists public.clerk_progress_logs (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.clerk_user_profiles(clerk_user_id) on delete cascade,
  weight_kg numeric(6, 2) not null check (weight_kg > 0),
  body_fat_pct numeric(5, 2) check (body_fat_pct is null or (body_fat_pct >= 0 and body_fat_pct <= 100)),
  chest_inches numeric(5, 2) check (chest_inches is null or chest_inches >= 0),
  waist_inches numeric(5, 2) check (waist_inches is null or waist_inches >= 0),
  arms_inches numeric(5, 2) check (arms_inches is null or arms_inches >= 0),
  recorded_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_clerk_progress_logs_user_date
  on public.clerk_progress_logs (clerk_user_id, recorded_date desc);
create index if not exists idx_clerk_progress_logs_active
  on public.clerk_progress_logs (clerk_user_id, is_active)
  where is_active = true;

create table if not exists public.clerk_progress_photos (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.clerk_user_profiles(clerk_user_id) on delete cascade,
  url text not null,
  taken_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_clerk_progress_photos_user_taken
  on public.clerk_progress_photos (clerk_user_id, taken_at desc);
create index if not exists idx_clerk_progress_photos_active
  on public.clerk_progress_photos (clerk_user_id, is_active)
  where is_active = true;

create or replace function public.set_clerk_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clerk_progress_logs_updated_at on public.clerk_progress_logs;
create trigger trg_clerk_progress_logs_updated_at
  before update on public.clerk_progress_logs
  for each row execute function public.set_clerk_progress_updated_at();

drop trigger if exists trg_clerk_progress_photos_updated_at on public.clerk_progress_photos;
create trigger trg_clerk_progress_photos_updated_at
  before update on public.clerk_progress_photos
  for each row execute function public.set_clerk_progress_updated_at();

alter table public.clerk_progress_logs enable row level security;
alter table public.clerk_progress_photos enable row level security;

drop policy if exists "service_role_manage_clerk_progress_logs" on public.clerk_progress_logs;
create policy "service_role_manage_clerk_progress_logs" on public.clerk_progress_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_manage_clerk_progress_photos" on public.clerk_progress_photos;
create policy "service_role_manage_clerk_progress_photos" on public.clerk_progress_photos
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant all on public.clerk_progress_logs to service_role;
grant all on public.clerk_progress_photos to service_role;
