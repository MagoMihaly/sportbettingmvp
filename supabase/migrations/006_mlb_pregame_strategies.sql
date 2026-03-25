alter table public.mlb_user_settings
  add column if not exists selected_pregame_strategies text[] not null default array['MLB_SERIES_G3_UNDERDOG', 'MLB_FAVORITE_RECOVERY'];

create table if not exists public.mlb_pregame_signals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.mlb_games(id) on delete cascade,
  strategy_id text not null,
  signal_key text not null,
  series_key text not null,
  series_game_number integer not null check (series_game_number in (2, 3)),
  signal_team text not null,
  signal_team_side text not null check (signal_team_side in ('home', 'away')),
  signal_direction text not null check (signal_direction in ('favorite', 'underdog')),
  market_type text not null default 'moneyline',
  evaluation_status text not null default 'candidate' check (evaluation_status in ('candidate', 'qualified', 'skipped')),
  odds numeric(8,2),
  reason_summary text not null,
  skip_reason text,
  source_provider text not null,
  evaluated_at timestamptz not null default now(),
  payload jsonb,
  unique(user_id, signal_key)
);

alter table public.mlb_alerts
  add column if not exists mlb_pregame_signal_id uuid references public.mlb_pregame_signals(id) on delete cascade;

create index if not exists mlb_pregame_signals_user_id_idx on public.mlb_pregame_signals(user_id);
create index if not exists mlb_pregame_signals_strategy_idx on public.mlb_pregame_signals(strategy_id);
create index if not exists mlb_pregame_signals_status_idx on public.mlb_pregame_signals(evaluation_status);

alter table public.mlb_pregame_signals enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mlb_pregame_signals'
      and policyname = 'Users can manage own mlb pregame signals'
  ) then
    create policy "Users can manage own mlb pregame signals"
      on public.mlb_pregame_signals
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
