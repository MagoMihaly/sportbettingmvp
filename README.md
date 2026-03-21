# European Hockey Signal Engine

Modern MVP for tracking European hockey betting signals with Next.js App Router, TypeScript, Tailwind, local shadcn-style UI primitives and a real Supabase-backed foundation.

## Core structure

- `app/`: landing, auth, protected member routes and cron-ready API routes
- `components/`: app shell, dashboard widgets, engine ops panels, forms and table UI
- `components/ui/`: reusable primitives aligned with shadcn conventions
- `actions/`: server actions for auth, signals, settings and engine controls
- `lib/supabase/`: browser, server and admin Supabase clients
- `lib/services/`: signal engine, notifications and provider ingest/odds sync services
- `lib/providers/`: mock + real hockey provider adapters
- `lib/data/`: dashboard + engine aggregation
- `lib/mock/`: demo fallback data when Supabase tables are not ready
- `supabase/migrations/`: SQL schema, RLS and engine table setup
- `supabase/seed.sql`: demo seed template for the base signal tables

## Environment variables

Use `.env.local` based on `.env.example`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-legacy-anon-key
SUPABASE_SECRET_KEY=your-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-or-service-role-key
CRON_SECRET=your-cron-secret
LIVE_HOCKEY_PROVIDER=hybrid
THESPORTSDB_API_KEY=123
THESPORTSDB_API_VERSION=v1
BALLDONTLIE_NHL_API_KEY=your-balldontlie-nhl-api-key
```

## Provider stack

The engine now supports a hybrid provider model.

- `TheSportsDB` handles the European league watchlist and general fixture ingestion.
- `balldontlie NHL` handles `NHL` watchlist entries and uses play-by-play data to compute first- and second-period goal splits.
- `mock` remains available as a safe local fallback.

Current provider files:

- `lib/providers/theSportsDb.ts`
- `lib/providers/balldontlieNhl.ts`
- `lib/providers/hockeyApi.ts`
- `lib/services/liveIngest.ts`

## Automatic trigger logic

Automatic 3rd-period trigger creation now works from real provider data when period detail is available.

- In the hybrid stack, this is currently driven by `balldontlie NHL` play-by-play.
- The balldontlie adapter fetches real games, then real play-by-play, and derives P1/P2 goal counts from score deltas on `goal` plays.
- European leagues still ingest through TheSportsDB, but TheSportsDB remains fixture/live-state focused in this version because it does not consistently expose period-level hockey splits in the public endpoints used here.

## Supabase setup

1. Enable Email/Password in Supabase Auth.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Run `supabase/migrations/002_engine_tables.sql`.
4. Optionally adjust the placeholder user UUID in `supabase/seed.sql` and run the seed.

## Engine layer

- `tracked_matches`: synced fixture/live score state per user
- `odds_snapshots`: historical odds capture table
- `ingest_runs`: scheduler/manual run history
- `app/api/cron/mock-ingest/route.ts`: provider sync endpoint protected by `CRON_SECRET`
- `app/api/cron/odds-sync/route.ts`: odds sync endpoint protected by `CRON_SECRET`
- `app/(member)/member/engine/page.tsx`: engine workspace inside the member area

## Cron examples

```bash
curl -X POST http://localhost:3000/api/cron/mock-ingest \
  -H "Authorization: Bearer your-cron-secret"

curl -X POST http://localhost:3000/api/cron/odds-sync \
  -H "Authorization: Bearer your-cron-secret"
```

## Local run

1. `npm install`
2. Ensure `.env.local` is present
3. Run the two SQL migration files in Supabase SQL Editor
4. Add `BALLDONTLIE_NHL_API_KEY` if you want real NHL play-by-play sync
5. `npm run dev`
6. Open `http://localhost:3000`

## Verification

- `npm run build`
- `npm run lint`
