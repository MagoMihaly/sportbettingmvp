alter table public.mlb_user_settings
  alter column selected_systems set default array[]::text[];

alter table public.mlb_user_settings
  alter column preferred_market_key set default '';

update public.mlb_user_settings
set
  selected_systems = array[]::text[],
  preferred_market_key = '';

delete from public.mlb_alerts
where mlb_live_signal_id is not null;

delete from public.mlb_live_signals;
delete from public.mlb_watchlists;
delete from public.mlb_odds_snapshots;
