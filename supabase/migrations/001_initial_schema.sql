create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_leagues text[] not null default '{}',
  notifications_enabled boolean not null default true,
  email_notifications boolean not null default true,
  push_notifications boolean not null default false,
  timezone text not null default 'Europe/Budapest',
  preferred_market_type text not null default '3rd period team goal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport text not null default 'ice_hockey',
  league text not null,
  match_id text,
  home_team text not null,
  away_team text not null,
  match_start_time timestamptz not null,
  selected_team text not null,
  selected_team_side text not null check (selected_team_side in ('home', 'away')),
  period1_goals integer not null default 0,
  period2_goals integer not null default 0,
  trigger_condition_met boolean not null default false,
  trigger_time timestamptz,
  odds numeric(8,2),
  bookmaker text,
  stake numeric(8,2),
  status text not null default 'watching' check (status in ('triggered', 'watching', 'pending', 'won', 'lost')),
  result text not null default 'pending' check (result in ('won', 'lost', 'void', 'pending')),
  notes text
);

create index if not exists signals_user_id_idx on public.signals(user_id);
create index if not exists signals_league_idx on public.signals(league);
create index if not exists signals_match_start_time_idx on public.signals(match_start_time desc);

alter table public.user_settings enable row level security;
alter table public.signals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'signals' and policyname = 'Users can read own signals'
  ) then
    create policy "Users can read own signals" on public.signals for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'signals' and policyname = 'Users can insert own signals'
  ) then
    create policy "Users can insert own signals" on public.signals for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'signals' and policyname = 'Users can update own signals'
  ) then
    create policy "Users can update own signals" on public.signals for update using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'signals' and policyname = 'Users can delete own signals'
  ) then
    create policy "Users can delete own signals" on public.signals for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can read own settings'
  ) then
    create policy "Users can read own settings" on public.user_settings for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can insert own settings'
  ) then
    create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can update own settings'
  ) then
    create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.handle_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.handle_user_settings_updated_at();
