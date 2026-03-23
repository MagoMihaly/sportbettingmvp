create table if not exists public.soccer_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_leagues text[] not null default array[
    'england-premier-league',
    'england-championship',
    'netherlands-eredivisie',
    'germany-bundesliga',
    'germany-2-bundesliga',
    'france-ligue-1',
    'belgium-jupiler-pro-league',
    'portugal-primeira-liga',
    'turkey-super-lig',
    'italy-serie-a',
    'spain-la-liga',
    'scotland-premiership'
  ],
  notifications_enabled boolean not null default true,
  email_notifications boolean not null default false,
  push_notifications boolean not null default true,
  timezone text not null default 'Europe/Budapest',
  preferred_market_key text not null default 'H2_2H_OVER_1_5',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.soccer_user_leagues (
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, league_id)
);

create table if not exists public.soccer_games (
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
  halftime_home_score integer,
  halftime_away_score integer,
  minute integer,
  home_shots integer,
  away_shots integer,
  home_shots_on_target integer,
  away_shots_on_target integer,
  home_corners integer,
  away_corners integer,
  home_possession numeric(5,2),
  away_possession numeric(5,2),
  raw_payload jsonb,
  last_synced_at timestamptz not null default now(),
  unique(provider, external_game_id)
);

create table if not exists public.soccer_watchlists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.soccer_games(id) on delete cascade,
  market_key text not null,
  rule_type text not null,
  status text not null default 'watching',
  notes text,
  unique(user_id, game_id, market_key)
);

create table if not exists public.soccer_match_state_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.soccer_games(id) on delete cascade,
  captured_at timestamptz not null default now(),
  minute integer,
  home_score integer not null default 0,
  away_score integer not null default 0,
  halftime_home_score integer,
  halftime_away_score integer,
  home_shots integer,
  away_shots integer,
  home_shots_on_target integer,
  away_shots_on_target integer,
  home_corners integer,
  away_corners integer,
  payload jsonb
);

create table if not exists public.soccer_odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.soccer_games(id) on delete cascade,
  signal_key text,
  market_key text not null,
  bookmaker text not null,
  decimal_odds numeric(8,2) not null,
  suspended boolean not null default false,
  captured_at timestamptz not null default now(),
  source text not null,
  payload jsonb
);

create table if not exists public.soccer_live_signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.soccer_games(id) on delete cascade,
  rule_type text not null,
  signal_key text not null,
  market_key text not null,
  home_score integer not null default 0,
  away_score integer not null default 0,
  minute integer,
  trigger_condition_met boolean not null default false,
  triggered_at timestamptz,
  source_provider text not null,
  payload jsonb,
  unique(user_id, signal_key)
);

create table if not exists public.soccer_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  soccer_live_signal_id uuid references public.soccer_live_signals(id) on delete cascade,
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

create table if not exists public.soccer_provider_sync_logs (
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

create table if not exists public.soccer_data_quality_flags (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.soccer_games(id) on delete cascade,
  flag_code text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  message text not null,
  payload jsonb
);

create index if not exists soccer_user_leagues_user_id_idx on public.soccer_user_leagues(user_id);
create index if not exists soccer_games_status_idx on public.soccer_games(status);
create index if not exists soccer_games_start_time_idx on public.soccer_games(start_time desc);
create index if not exists soccer_watchlists_user_id_idx on public.soccer_watchlists(user_id);
create index if not exists soccer_live_signals_user_id_idx on public.soccer_live_signals(user_id);
create index if not exists soccer_alerts_user_id_idx on public.soccer_alerts(user_id);
create index if not exists soccer_odds_snapshots_user_id_idx on public.soccer_odds_snapshots(user_id);
create index if not exists soccer_state_snapshots_user_id_idx on public.soccer_match_state_snapshots(user_id);
create index if not exists soccer_provider_sync_logs_user_id_idx on public.soccer_provider_sync_logs(user_id);
create index if not exists soccer_data_quality_flags_user_id_idx on public.soccer_data_quality_flags(user_id);

alter table public.soccer_user_settings enable row level security;
alter table public.soccer_user_leagues enable row level security;
alter table public.soccer_games enable row level security;
alter table public.soccer_watchlists enable row level security;
alter table public.soccer_match_state_snapshots enable row level security;
alter table public.soccer_odds_snapshots enable row level security;
alter table public.soccer_live_signals enable row level security;
alter table public.soccer_alerts enable row level security;
alter table public.soccer_provider_sync_logs enable row level security;
alter table public.soccer_data_quality_flags enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_user_settings' and policyname = 'Users can manage own soccer settings'
  ) then
    create policy "Users can manage own soccer settings" on public.soccer_user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_user_leagues' and policyname = 'Users can manage own soccer leagues'
  ) then
    create policy "Users can manage own soccer leagues" on public.soccer_user_leagues for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_games' and policyname = 'Authenticated users can read soccer games'
  ) then
    create policy "Authenticated users can read soccer games" on public.soccer_games for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_watchlists' and policyname = 'Users can manage own soccer watchlists'
  ) then
    create policy "Users can manage own soccer watchlists" on public.soccer_watchlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_match_state_snapshots' and policyname = 'Users can read own soccer state snapshots'
  ) then
    create policy "Users can read own soccer state snapshots" on public.soccer_match_state_snapshots for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_odds_snapshots' and policyname = 'Users can read own soccer odds snapshots'
  ) then
    create policy "Users can read own soccer odds snapshots" on public.soccer_odds_snapshots for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_live_signals' and policyname = 'Users can manage own soccer live signals'
  ) then
    create policy "Users can manage own soccer live signals" on public.soccer_live_signals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_alerts' and policyname = 'Users can manage own soccer alerts'
  ) then
    create policy "Users can manage own soccer alerts" on public.soccer_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_provider_sync_logs' and policyname = 'Users can read own soccer sync logs'
  ) then
    create policy "Users can read own soccer sync logs" on public.soccer_provider_sync_logs for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'soccer_data_quality_flags' and policyname = 'Users can read own soccer data quality flags'
  ) then
    create policy "Users can read own soccer data quality flags" on public.soccer_data_quality_flags for select using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists soccer_user_settings_set_updated_at on public.soccer_user_settings;
create trigger soccer_user_settings_set_updated_at
before update on public.soccer_user_settings
for each row execute function public.handle_updated_at();

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

  insert into public.soccer_user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

insert into public.soccer_user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.leagues (slug, name, region, sport, priority)
values
  ('england-premier-league', 'England Premier League', 'Europe', 'soccer', 110),
  ('england-championship', 'England Championship', 'Europe', 'soccer', 120),
  ('netherlands-eredivisie', 'Netherlands Eredivisie', 'Europe', 'soccer', 130),
  ('germany-bundesliga', 'Germany Bundesliga', 'Europe', 'soccer', 140),
  ('germany-2-bundesliga', 'Germany 2. Bundesliga', 'Europe', 'soccer', 150),
  ('france-ligue-1', 'France Ligue 1', 'Europe', 'soccer', 160),
  ('belgium-jupiler-pro-league', 'Belgium Jupiler Pro League', 'Europe', 'soccer', 170),
  ('portugal-primeira-liga', 'Portugal Primeira Liga', 'Europe', 'soccer', 180),
  ('turkey-super-lig', 'Turkey Super Lig', 'Europe', 'soccer', 190),
  ('italy-serie-a', 'Italy Serie A', 'Europe', 'soccer', 200),
  ('spain-la-liga', 'Spain La Liga', 'Europe', 'soccer', 210),
  ('scotland-premiership', 'Scotland Premiership', 'Europe', 'soccer', 220)
on conflict (slug) do update
set
  name = excluded.name,
  region = excluded.region,
  sport = excluded.sport,
  priority = excluded.priority,
  is_active = true;