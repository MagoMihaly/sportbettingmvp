create table if not exists public.tracked_matches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_match_id text not null,
  league text not null,
  home_team text not null,
  away_team text not null,
  match_start_time timestamptz not null,
  home_score integer not null default 0,
  away_score integer not null default 0,
  period1_home_goals integer not null default 0,
  period1_away_goals integer not null default 0,
  period2_home_goals integer not null default 0,
  period2_away_goals integer not null default 0,
  source text not null default 'mock-provider',
  ingest_status text not null default 'queued' check (ingest_status in ('queued', 'synced', 'error')),
  last_synced_at timestamptz not null default now(),
  raw_payload jsonb,
  unique(user_id, external_match_id)
);

create table if not exists public.odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tracked_match_id uuid not null references public.tracked_matches(id) on delete cascade,
  market_type text not null,
  bookmaker text not null,
  decimal_odds numeric(8,2) not null,
  captured_at timestamptz not null default now(),
  source text not null default 'mock-provider'
);

create table if not exists public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  run_type text not null,
  status text not null default 'queued' check (status in ('queued', 'synced', 'error')),
  records_created integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);

create index if not exists tracked_matches_user_id_idx on public.tracked_matches(user_id);
create index if not exists odds_snapshots_user_id_idx on public.odds_snapshots(user_id);
create index if not exists ingest_runs_user_id_idx on public.ingest_runs(user_id);
create index if not exists odds_snapshots_tracked_match_id_idx on public.odds_snapshots(tracked_match_id);

alter table public.tracked_matches enable row level security;
alter table public.odds_snapshots enable row level security;
alter table public.ingest_runs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'tracked_matches' and policyname = 'Users can manage own tracked matches'
  ) then
    create policy "Users can manage own tracked matches" on public.tracked_matches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'odds_snapshots' and policyname = 'Users can manage own odds snapshots'
  ) then
    create policy "Users can manage own odds snapshots" on public.odds_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ingest_runs' and policyname = 'Users can manage own ingest runs'
  ) then
    create policy "Users can manage own ingest runs" on public.ingest_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
