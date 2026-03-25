alter table public.mlb_user_settings
  alter column selected_systems set default array['MLB_LATE_ONE_RUN_GAME'];

alter table public.mlb_user_settings
  alter column preferred_market_key set default 'MLB_LATE_ONE_RUN_GAME';

update public.mlb_user_settings
set
  selected_systems = case
    when coalesce(array_length(array_remove(selected_systems, 'MLB_F5_SCORELESS'), 1), 0) = 0
      then array['MLB_LATE_ONE_RUN_GAME']
    else array_remove(selected_systems, 'MLB_F5_SCORELESS')
  end,
  preferred_market_key = case
    when preferred_market_key = 'MLB_F5_SCORELESS' then 'MLB_LATE_ONE_RUN_GAME'
    else preferred_market_key
  end
where
  selected_systems @> array['MLB_F5_SCORELESS']
  or preferred_market_key = 'MLB_F5_SCORELESS';
