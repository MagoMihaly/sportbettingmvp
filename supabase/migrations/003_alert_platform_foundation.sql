create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  region text,
  sport text not null default 'ice_hockey',
  is_active boolean not null default true,
  priority integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.user_leagues (
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, league_id)
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  provider text not null,
  external_game_id text not null,
  league_id uuid references public.leagues(id) on delete set null,
  league_name text not null,
  status text not null check (status in ('scheduled', 'live', 'finished')),
  start_time timestamptz not null,
  home_team text not null,
  away_team text not null,
  home_score integer not null default 0,
  away_score integer not null default 0,
  period1_home_goals integer not null default 0,
  period1_away_goals integer not null default 0,
  period2_home_goals integer not null default 0,
  period2_away_goals integer not null default 0,
  raw_payload jsonb,
  last_synced_at timestamptz not null default now(),
  unique(provider, external_game_id)
);

create table if not exists public.pregame_candidates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  market_type text not null,
  rule_type text not null,
  status text not null default 'watching',
  notes text
);

create table if not exists public.live_signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  rule_type text not null,
  signal_key text not null,
  selected_team text not null,
  selected_team_side text not null check (selected_team_side in ('home', 'away')),
  period1_goals integer not null default 0,
  period2_goals integer not null default 0,
  trigger_condition_met boolean not null default false,
  triggered_at timestamptz,
  source_provider text not null,
  payload jsonb,
  unique(user_id, signal_key)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  live_signal_id uuid references public.live_signals(id) on delete cascade,
  alert_type text not null,
  channel text not null,
  title text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'queued', 'sent', 'failed', 'read')),
  fingerprint text not null,
  delivered_at timestamptz,
  payload jsonb,
  unique(user_id, fingerprint)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz,
  status text not null default 'active' check (status in ('active', 'revoked')),
  user_agent text,
  last_seen_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

create table if not exists public.provider_sync_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  sync_type text not null,
  status text not null default 'queued' check (status in ('queued', 'synced', 'error')),
  records_processed integer not null default 0,
  records_created integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  message text
);

create index if not exists leagues_slug_idx on public.leagues(slug);
create index if not exists user_leagues_user_id_idx on public.user_leagues(user_id);
create index if not exists games_status_idx on public.games(status);
create index if not exists games_start_time_idx on public.games(start_time desc);
create index if not exists pregame_candidates_user_id_idx on public.pregame_candidates(user_id);
create index if not exists live_signals_user_id_idx on public.live_signals(user_id);
create index if not exists alerts_user_id_idx on public.alerts(user_id);
create index if not exists alerts_created_at_idx on public.alerts(created_at desc);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
create index if not exists provider_sync_logs_user_id_idx on public.provider_sync_logs(user_id);

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.user_leagues enable row level security;
alter table public.games enable row level security;
alter table public.pregame_candidates enable row level security;
alter table public.live_signals enable row level security;
alter table public.alerts enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.provider_sync_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can manage own profile'
  ) then
    create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'leagues' and policyname = 'Authenticated users can read leagues'
  ) then
    create policy "Authenticated users can read leagues" on public.leagues for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_leagues' and policyname = 'Users can manage own user leagues'
  ) then
    create policy "Users can manage own user leagues" on public.user_leagues for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'games' and policyname = 'Authenticated users can read games'
  ) then
    create policy "Authenticated users can read games" on public.games for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'pregame_candidates' and policyname = 'Users can manage own pregame candidates'
  ) then
    create policy "Users can manage own pregame candidates" on public.pregame_candidates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'live_signals' and policyname = 'Users can manage own live signals'
  ) then
    create policy "Users can manage own live signals" on public.live_signals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'alerts' and policyname = 'Users can manage own alerts'
  ) then
    create policy "Users can manage own alerts" on public.alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'push_subscriptions' and policyname = 'Users can manage own push subscriptions'
  ) then
    create policy "Users can manage own push subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'provider_sync_logs' and policyname = 'Users can read own provider sync logs'
  ) then
    create policy "Users can read own provider sync logs" on public.provider_sync_logs for select using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function public.handle_updated_at();

drop trigger if exists on_auth_user_created_defaults on auth.users;
create trigger on_auth_user_created_defaults
after insert on auth.users
for each row execute function public.handle_new_user_defaults();

insert into public.leagues (slug, name, region, priority)
values
  ('czech-extraliga', 'Czech Extraliga', 'Europe', 10),
  ('finnish-liiga', 'Finnish Liiga', 'Europe', 20),
  ('khl', 'KHL', 'Europe / Eurasia', 30),
  ('mhl', 'MHL', 'Europe / Eurasia', 40),
  ('hungarian-league', 'Hungarian Erste Liga', 'Europe', 50),
  ('danish-league', 'Danish Metal Ligaen', 'Europe', 60),
  ('french-league', 'French Ligue Magnus', 'Europe', 70),
  ('german-league', 'DEL', 'Europe', 80),
  ('nhl', 'NHL', 'North America', 90)
on conflict (slug) do update
set
  name = excluded.name,
  region = excluded.region,
  priority = excluded.priority,
  is_active = true;
