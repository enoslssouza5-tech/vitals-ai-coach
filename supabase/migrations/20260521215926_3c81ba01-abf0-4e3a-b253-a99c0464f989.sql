
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  height_cm int,
  weight_kg numeric,
  birth_date date,
  fitness_level text check (fitness_level in ('beginner','intermediate','advanced')),
  primary_goals text[] default '{}',
  privacy_mode text default 'friends' check (privacy_mode in ('public','friends','private')),
  hide_start_end boolean default false,
  invisible_mode boolean default false,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ACTIVITIES
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('running','cycling','walking','hiking','workout')),
  title text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int default 0,
  distance_meters numeric default 0,
  avg_speed numeric,
  max_speed numeric,
  avg_heart_rate int,
  max_heart_rate int,
  calories_burned int,
  elevation_gain numeric,
  effort_level int check (effort_level between 1 and 10),
  weather_condition jsonb,
  route_points jsonb,
  privacy text default 'friends' check (privacy in ('public','friends','private')),
  notes text,
  ai_insights text,
  created_at timestamptz default now()
);

alter table public.activities enable row level security;

create policy "activities_select_own" on public.activities for select using (auth.uid() = user_id);
create policy "activities_insert_own" on public.activities for insert with check (auth.uid() = user_id);
create policy "activities_update_own" on public.activities for update using (auth.uid() = user_id);
create policy "activities_delete_own" on public.activities for delete using (auth.uid() = user_id);

create index activities_user_started_idx on public.activities(user_id, started_at desc);

-- HEALTH METRICS
create table public.health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  sleep_hours numeric,
  sleep_quality int check (sleep_quality between 1 and 5),
  resting_heart_rate int,
  hrv int,
  recovery_score int check (recovery_score between 0 and 100),
  energy_level int check (energy_level between 1 and 10),
  muscle_soreness int check (muscle_soreness between 1 and 10),
  stress_level int check (stress_level between 1 and 10),
  created_at timestamptz default now(),
  unique (user_id, date)
);

alter table public.health_metrics enable row level security;

create policy "hm_select_own" on public.health_metrics for select using (auth.uid() = user_id);
create policy "hm_insert_own" on public.health_metrics for insert with check (auth.uid() = user_id);
create policy "hm_update_own" on public.health_metrics for update using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
