-- Replace the UUID below with a real auth.users id before running this seed.
insert into public.user_settings (
  user_id,
  selected_leagues,
  notifications_enabled,
  email_notifications,
  push_notifications,
  timezone,
  preferred_market_type
) values (
  '00000000-0000-0000-0000-000000000000',
  array['Czech Extraliga', 'Finnish Liiga', 'KHL', 'MHL', 'Hungarian Erste Liga', 'DEL', 'French Ligue Magnus', 'Danish Metal Ligaen'],
  true,
  true,
  false,
  'Europe/Budapest',
  '3rd period team goal'
)
on conflict (user_id) do nothing;

insert into public.signals (
  user_id,
  sport,
  league,
  match_id,
  home_team,
  away_team,
  match_start_time,
  selected_team,
  selected_team_side,
  period1_goals,
  period2_goals,
  trigger_condition_met,
  trigger_time,
  odds,
  bookmaker,
  stake,
  status,
  result,
  notes
)
values
(
  '00000000-0000-0000-0000-000000000000',
  'ice_hockey',
  'Finnish Liiga',
  'liiga-20260320-001',
  'Tappara',
  'Ilves',
  '2026-03-20T17:30:00Z',
  'Tappara',
  'home',
  0,
  0,
  true,
  '2026-03-20T19:09:00Z',
  2.05,
  'Pinnacle',
  1.50,
  'triggered',
  'pending',
  'Eligible after two scoreless periods.'
),
(
  '00000000-0000-0000-0000-000000000000',
  'ice_hockey',
  'DEL',
  'del-20260319-004',
  'Eisbaren Berlin',
  'Mannheim',
  '2026-03-19T18:00:00Z',
  'Mannheim',
  'away',
  0,
  1,
  false,
  null,
  1.88,
  'Bet365',
  1.00,
  'watching',
  'pending',
  'Second period goal invalidated the trigger.'
);
