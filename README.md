# Signal Ops

Production-style MVP foundation for a multi-sport signal platform. Hockey, soccer and MLB now live side by side in the same member area without replacing or destabilizing the existing hockey flow.

## Current modules

- Hockey workspace with provider abstraction, signal tracking and scheduler-safe ingest
- Soccer workspace prepared for API-Football with H2 and H3 systems
- MLB workspace focused on pre-game series strategies
- Shared auth, push subscription storage, protected scheduler endpoints and member shell

## Multi-sport model

- `/member` is the multi-sport overview
- `/member/hockey` is the dedicated hockey workspace
- `/member/soccer` is the dedicated soccer workspace
- `/member/mlb` is the dedicated MLB workspace

Each sport keeps:
- its own settings surface
- its own signal records
- its own provider sync logs
- its own alert generation path

Shared platform layers stay centralized:
- auth
- push subscriptions
- member shell
- scheduler auth
- notification channel helpers

## Environment variables

Create `.env.local` from [`.env.example`](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/.env.example).

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
LIVE_MLB_PROVIDER=mock
SOCCER_MODULE_ENABLED=true
MLB_MODULE_ENABLED=true
SOCCER_FREE_PLAN_SAFE_MODE=false
SOCCER_RESEARCH_REFERENCE_DATE=2025-03-15
THESPORTSDB_API_KEY=123
THESPORTSDB_API_VERSION=v1
BALLDONTLIE_NHL_API_KEY=your-balldontlie-nhl-api-key
API_FOOTBALL_API_KEY=your-api-football-key
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
API_BASEBALL_API_KEY=your-api-baseball-key
WEB_PUSH_VAPID_PUBLIC_KEY=your-web-push-public-key
WEB_PUSH_VAPID_PRIVATE_KEY=your-web-push-private-key
```

## Supabase setup

Run these migrations in order:
1. [001_initial_schema.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/001_initial_schema.sql)
2. [002_engine_tables.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/002_engine_tables.sql)
3. [003_alert_platform_foundation.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/003_alert_platform_foundation.sql)
4. [004_soccer_module_foundation.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/004_soccer_module_foundation.sql)
5. [005_mlb_module_foundation.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/005_mlb_module_foundation.sql)
6. [006_mlb_pregame_strategies.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/006_mlb_pregame_strategies.sql)
7. [007_remove_mlb_f5_scoreless.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/007_remove_mlb_f5_scoreless.sql)
8. [008_remove_mlb_live_systems.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/008_remove_mlb_live_systems.sql)

## API-efficient polling strategy

The project now uses a staged approach:
1. Fixture sync only for selected sports and selected leagues or strategies
2. Server-side shortlist creation to narrow the higher-cost processing set
3. Odds requests only for sports that still use odds-aware live engines
4. Closed or stale games fall out of the higher-cost sync paths quickly

This keeps the MVP reliable while reducing unnecessary API pressure.

## API-Football free-plan safe mode

Use this mode when the account authenticates but cannot access the current season, live parameters or odds coverage.

Env switches:
- `SOCCER_FREE_PLAN_SAFE_MODE=true`
- optional `SOCCER_RESEARCH_REFERENCE_DATE=2025-03-15`

Behavior in safe mode:
- soccer live polling is disabled
- soccer odds polling is disabled
- fixture sync falls back to an accessible historical season window
- watchlists and trigger evaluation remain testable from historical fixtures

## Scheduler endpoints

Hockey:
- `/api/internal/check-hockey-triggers`
- `/api/internal/capture-odds-snapshots`

Soccer:
- `/api/internal/check-soccer-triggers`
- `/api/internal/capture-soccer-odds`

MLB:
- `/api/internal/check-mlb-triggers`

All scheduler endpoints are protected by `Authorization: Bearer <CRON_SECRET>`.

## GitHub Actions scheduling

Workflow file:
- [hockey-scheduler.yml](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/.github/workflows/hockey-scheduler.yml)

Repository secrets required:
- `SCHEDULER_BASE_URL`
- `CRON_SECRET`

The workflow calls hockey, soccer and MLB endpoints independently so one sport cannot block the others.

## Local development

1. `npm install`
2. create `.env.local`
3. run the Supabase migrations
4. `npm run dev`
5. open `http://localhost:3000`

## Verification

- `npm run lint`
- `npm run build`
