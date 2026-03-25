create table if not exists public.mlb_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_systems text[] not null default array['MLB_F5_SCORELESS', 'MLB_LATE_ONE_RUN_GAME'],
  notifications_enabled boolean not null default true,
  email_notifications boolean not null default false,
  push_notifications boolean not null default true,
  timezone text not null default 'Europe/Budapest',
  preferred_market_key text not null default 'MLB_F5_SCORELESS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mlb_games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  provider text not null,
  external_game_id text not null,
  league_name text not null default 'MLB',
  status text not null check (status in ('scheduled', 'live', 'finished')),
  start_time timestamptz not null,
  home_team text not null,
  away_team text not null,
  home_score integer not null default 0,
  away_score integer not null default 0,
  inning integer,
  half_inning text check (half_inning in ('top', 'bottom')),
  home_hits integer,
  away_hits integer,
  home_errors integer,
  away_errors integer,
  raw_payload jsonb,
  last_synced_at timestamptz not null default now(),
  unique(provider, external_game_id)
);

create table if not exists public.mlb_watchlists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.mlb_games(id) on delete cascade,
  market_key text not null,
  rule_type text not null,
  status text not null default 'watching',
  notes text,
  unique(user_id, game_id, market_key)
);

create table if not exists public.mlb_state_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.mlb_games(id) on delete cascade,
  captured_at timestamptz not null default now(),
  inning integer,
  half_inning text check (half_inning in ('top', 'bottom')),
  home_score integer not null default 0,
  away_score integer not null default 0,
  home_hits integer,
  away_hits integer,
  payload jsonb
);

create table if not exists public.mlb_odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.mlb_games(id) on delete cascade,
  signal_key text,
  market_key text not null,
  bookmaker text not null,
  decimal_odds numeric(8,2) not null,
  suspended boolean not null default false,
  captured_at timestamptz not null default now(),
  source text not null,
  payload jsonb
);

create table if not exists public.mlb_live_signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.mlb_games(id) on delete cascade,
  rule_type text not null,
  signal_key text not null,
  market_key text not null,
  inning integer,
  home_score integer not null default 0,
  away_score integer not null default 0,
  trigger_condition_met boolean not null default false,
  triggered_at timestamptz,
  source_provider text not null,
  payload jsonb,
  unique(user_id, signal_key)
);

create table if not exists public.mlb_alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mlb_live_signal_id uuid references public.mlb_live_signals(id) on delete cascade,
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

create table if not exists public.mlb_provider_sync_logs (
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

create index if not exists mlb_games_status_idx on public.mlb_games(status);
create index if not exists mlb_games_start_time_idx on public.mlb_games(start_time desc);
create index if not exists mlb_watchlists_user_id_idx on public.mlb_watchlists(user_id);
create index if not exists mlb_live_signals_user_id_idx on public.mlb_live_signals(user_id);
create index if not exists mlb_alerts_user_id_idx on public.mlb_alerts(user_id);
create index if not exists mlb_odds_snapshots_user_id_idx on public.mlb_odds_snapshots(user_id);
create index if not exists mlb_state_snapshots_user_id_idx on public.mlb_state_snapshots(user_id);
create index if not exists mlb_provider_sync_logs_user_id_idx on public.mlb_provider_sync_logs(user_id);

alter table public.mlb_user_settings enable row level security;
alter table public.mlb_games enable row level security;
alter table public.mlb_watchlists enable row level security;
alter table public.mlb_state_snapshots enable row level security;
alter table public.mlb_odds_snapshots enable row level security;
alter table public.mlb_live_signals enable row level security;
alter table public.mlb_alerts enable row level security;
alter table public.mlb_provider_sync_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_user_settings' and policyname = 'Users can manage own mlb settings'
  ) then
    create policy "Users can manage own mlb settings" on public.mlb_user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_games' and policyname = 'Authenticated users can read mlb games'
  ) then
    create policy "Authenticated users can read mlb games" on public.mlb_games for select using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_watchlists' and policyname = 'Users can manage own mlb watchlists'
  ) then
    create policy "Users can manage own mlb watchlists" on public.mlb_watchlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_state_snapshots' and policyname = 'Users can read own mlb state snapshots'
  ) then
    create policy "Users can read own mlb state snapshots" on public.mlb_state_snapshots for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_odds_snapshots' and policyname = 'Users can read own mlb odds snapshots'
  ) then
    create policy "Users can read own mlb odds snapshots" on public.mlb_odds_snapshots for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_live_signals' and policyname = 'Users can manage own mlb live signals'
  ) then
    create policy "Users can manage own mlb live signals" on public.mlb_live_signals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_alerts' and policyname = 'Users can manage own mlb alerts'
  ) then
    create policy "Users can manage own mlb alerts" on public.mlb_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'mlb_provider_sync_logs' and policyname = 'Users can read own mlb sync logs'
  ) then
    create policy "Users can read own mlb sync logs" on public.mlb_provider_sync_logs for select using (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists mlb_user_settings_set_updated_at on public.mlb_user_settings;
create trigger mlb_user_settings_set_updated_at
before update on public.mlb_user_settings
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

  insert into public.mlb_user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

insert into public.mlb_user_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;
