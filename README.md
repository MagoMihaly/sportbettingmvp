# European Hockey Signal Engine

Production-style MVP foundation for a hockey alert platform with an additive soccer module prepared for API-Football Pro. The existing hockey flow remains the default and unchanged. Soccer is implemented as a second sport workspace behind a feature flag.

## Current modules

- Hockey landing, auth, protected member area and dashboard
- Hockey provider abstraction and scheduler-ready ingest flow
- Push subscription storage and realtime-ready dashboard alerts
- Soccer second-sport module prepared for API-Football Pro
- External scheduler pattern with protected HTTP endpoints and GitHub Actions

## Soccer module scope

The soccer module is additive only:
- separate routes under `/member/soccer`
- separate settings table and league mapping
- separate games, watchlists, state snapshots, odds snapshots, live signals and alerts tables
- separate scheduler endpoints for soccer polling
- no destructive changes to the existing hockey business logic

Implemented soccer trigger targets:
- `H2_2H_OVER_1_5`: HT 0-0 -> full match over 1.5 equivalence
- `H3_REMAINING_OVER_0_5`: 60'+ 0-0 -> full match over 0.5 equivalence

## Environment variables

Create `.env.local` from [`.env.example`](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/.env.example).

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-cron-secret
LIVE_HOCKEY_PROVIDER=hybrid
LIVE_SOCCER_PROVIDER=api-football
SOCCER_MODULE_ENABLED=false
THESPORTSDB_API_KEY=123
THESPORTSDB_API_VERSION=v1
BALLDONTLIE_NHL_API_KEY=your-balldontlie-nhl-api-key
API_FOOTBALL_API_KEY=your-api-football-key
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
WEB_PUSH_VAPID_PUBLIC_KEY=your-web-push-public-key
WEB_PUSH_VAPID_PRIVATE_KEY=your-web-push-private-key
```

Recommended rollout:
1. keep `SOCCER_MODULE_ENABLED=false`
2. run the soccer migration
3. add the API-Football key
4. set `SOCCER_MODULE_ENABLED=true`
5. redeploy

## Supabase setup

Run these migrations in order:
1. [001_initial_schema.sql](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/supabase/migrations/001_initial_schema.sql)
2. [002_engine_tables.sql](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/supabase/migrations/002_engine_tables.sql)
3. [003_alert_platform_foundation.sql](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/supabase/migrations/003_alert_platform_foundation.sql)
4. [004_soccer_module_foundation.sql](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/supabase/migrations/004_soccer_module_foundation.sql)

The soccer migration adds:
- `soccer_user_settings`
- `soccer_user_leagues`
- `soccer_games`
- `soccer_watchlists`
- `soccer_match_state_snapshots`
- `soccer_odds_snapshots`
- `soccer_live_signals`
- `soccer_alerts`
- `soccer_provider_sync_logs`
- `soccer_data_quality_flags`

It also seeds the 12 target soccer leagues into the shared `leagues` table with `sport='soccer'`.


## API-Football free-plan safe mode

Use this mode when the account can authenticate but cannot access the current season, live parameters or odds coverage.

Env switches:
- `SOCCER_FREE_PLAN_SAFE_MODE=true`
- optional `SOCCER_RESEARCH_REFERENCE_DATE=2025-03-15`

Behavior in safe mode:
- soccer live polling is disabled
- odds/live polling is disabled
- fixture sync falls back to an accessible historical season window
- watchlists and trigger evaluation can still be replay-tested on historical fixtures
- data quality flags explicitly show when odds coverage is unavailable on the current plan

Use this for research and pipeline validation only, not production alerting.
## Scheduler endpoints

Hockey:
- `/api/internal/check-hockey-triggers`
- `/api/internal/capture-odds-snapshots`

Soccer:
- `/api/internal/check-soccer-triggers`
- `/api/internal/capture-soccer-odds`

All scheduler endpoints are protected by `Authorization: Bearer <CRON_SECRET>`.

## GitHub Actions scheduling

Workflow file:
- [hockey-scheduler.yml](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/.github/workflows/hockey-scheduler.yml)

Repository secrets required:
- `SCHEDULER_BASE_URL`
- `CRON_SECRET`

The workflow now calls both hockey and soccer endpoints. If soccer is disabled, the soccer endpoints return a disabled payload instead of breaking the run.

## Local development

1. `npm install`
2. create `.env.local`
3. run the Supabase migrations
4. `npm run dev`
5. open `http://localhost:3000`

## Verification

- `npm run lint`
- `npm run build`