# European Hockey Signal Engine

European hockey signal tracking MVP built with Next.js App Router, TypeScript, Tailwind CSS and Supabase. The app is structured as a clean foundation for signal logging, watched league management, notification preferences, provider-driven ingest and future backtesting or alerting layers.

## Repository

- GitHub: [MagoMihaly/sportbettingmvp](https://github.com/MagoMihaly/sportbettingmvp)

## Product scope

- Landing page with product positioning and workflow sections
- Supabase Auth with protected member area
- Member dashboard with signal stats and latest activity
- Signal logging table with filters, sorting and empty states
- Manual `Add Signal` flow with automatic 3rd-period eligibility hint
- League settings and notification settings per user
- Mock plus real provider ingest architecture for future live sports integration
- Vercel-ready cron endpoints for ingest and odds snapshot jobs

## Tech stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Database
- Local shadcn-style UI primitives
- Vercel-ready routing and cron configuration

## Project structure

- `app/`: landing, auth, member routes and cron API routes
- `components/`: layout, forms, tables, dashboard cards and engine panels
- `components/ui/`: reusable UI primitives aligned with shadcn conventions
- `actions/`: server actions for auth, settings, signals and engine controls
- `lib/supabase/`: browser, server and admin Supabase clients
- `lib/services/`: signal engine, notifications, ingest and odds snapshot services
- `lib/providers/`: provider adapters for mock, TheSportsDB and balldontlie NHL
- `lib/data/`: dashboard and engine aggregation helpers
- `lib/config/`: league configuration and product constants
- `supabase/migrations/`: schema, RLS and engine table setup
- `supabase/seed.sql`: demo seed template for base signal data

## Environment

Create `.env.local` from [`.env.example`](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/.env.example).

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

Notes:
- `.env.local` is intentionally excluded from Git and should never be committed.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred client key for new Supabase projects.
- `CRON_SECRET` must also be added in Vercel so scheduled jobs can authenticate.

## Provider stack

The engine supports a hybrid provider model.

- `TheSportsDB` covers the European watchlist and general fixture ingestion.
- `balldontlie NHL` covers `NHL` watchlist entries and derives first- and second-period goals from play-by-play score deltas on goal events.
- `mock` remains available as a safe local fallback for demo and offline flows.

Current provider entry points:
- [hockeyApi.ts](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/lib/providers/hockeyApi.ts)
- [theSportsDb.ts](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/lib/providers/theSportsDb.ts)
- [balldontlieNhl.ts](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/lib/providers/balldontlieNhl.ts)
- [liveIngest.ts](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/lib/services/liveIngest.ts)

## Automatic trigger logic

Automatic 3rd-period trigger creation works when provider data includes usable period detail.

- If the selected team scores `0` in period 1 and `0` in period 2, the signal becomes eligible for a 3rd-period trigger.
- In the current real-data stack this is implemented through the balldontlie NHL play-by-play adapter.
- European leagues still ingest through TheSportsDB, which is currently better suited here for fixture and live-state sync than reliable period-level hockey splits.

## Supabase setup

1. Enable Email/Password in Supabase Auth.
2. Run [001_initial_schema.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/001_initial_schema.sql).
3. Run [002_engine_tables.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/migrations/002_engine_tables.sql).
4. Optionally adjust the placeholder user UUID in [seed.sql](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/supabase/seed.sql) and run the seed.

## Engine layer

- `tracked_matches`: synced fixture and live score state per user
- `odds_snapshots`: historical odds capture table
- `ingest_runs`: scheduler and manual run history
- [mock-ingest route](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/app/api/cron/mock-ingest/route.ts): provider ingest endpoint with `GET` and `POST`
- [odds-sync route](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/app/api/cron/odds-sync/route.ts): odds snapshot endpoint with `GET` and `POST`
- [engine page](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/app/(member)/member/engine/page.tsx): member-facing engine workspace

## Local development

1. `npm install`
2. Create `.env.local`
3. Run the Supabase SQL migrations
4. Add `BALLDONTLIE_NHL_API_KEY` if you want real NHL play-by-play sync
5. `npm run dev`
6. Open `http://localhost:3000`

## Vercel deployment

1. Import the GitHub repository into Vercel.
2. Add all variables from [`.env.example`](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/.env.example) to the Vercel project.
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Keep [vercel.json](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/vercel.json) in the repo so Vercel Cron Jobs are created automatically.
5. Ensure `CRON_SECRET` is identical in Vercel env vars and in any manual cron requests.
6. Redeploy after setting environment variables.

The current Vercel cron schedule is:
- `0 * * * *` -> `/api/cron/mock-ingest`
- `15 * * * *` -> `/api/cron/odds-sync`

Manual examples:

```bash
curl -X GET https://your-domain.com/api/cron/mock-ingest \
  -H "Authorization: Bearer your-cron-secret"

curl -X GET https://your-domain.com/api/cron/odds-sync \
  -H "Authorization: Bearer your-cron-secret"
```

## Verification

- `npm run build`
- `npm run lint`
