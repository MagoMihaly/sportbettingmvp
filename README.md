# European Hockey Signal Engine

Production-style MVP foundation for a hockey live alert platform built on Next.js, TypeScript and Supabase. The current codebase keeps the existing landing/auth/member shell, then extends it with a cleaner alert-oriented architecture: protected dashboard, league selection, realtime-ready alerts feed, push subscription storage, provider abstraction and scheduler-compatible ingest modules.

## What is already in the app

- Premium dark landing page and member shell
- Supabase Auth login/register/logout flow
- Protected member area
- Dashboard with recent signals, watched leagues and engine controls
- League settings and notification settings
- Manual signal logging
- Provider abstraction with `mock`, `TheSportsDB`, `balldontlie NHL` and `hybrid`
- Scheduler-ready ingest routes with protected HTTP endpoints and external scheduling

## What this refactor adds

- Stronger member auth guard at layout level
- Realtime-ready `alerts` feed structure
- Browser push subscription flow with service worker registration
- Push subscription persistence in Supabase
- Flexible signal engine base with typed trigger rules
- Extended Supabase schema for profiles, leagues, user_leagues, games, live_signals, alerts, push_subscriptions and provider_sync_logs
- Cleaner provider contract for scheduled games, live games, game details and future market adapters

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Realtime-ready client subscriptions
- Vercel-ready deployment with decoupled external scheduling

## Main structure

- `app/`: routes, layouts, auth pages and API endpoints
- `actions/`: server actions for auth, settings, signals and engine controls
- `components/`: dashboard, forms, push/realtime UI and member layout pieces
- `components/ui/`: reusable UI primitives
- `hooks/`: client hooks including realtime alerts subscription
- `lib/config/`: site config, league config and provider aliases
- `lib/data/`: dashboard aggregation and server-side member data loading
- `lib/providers/`: provider abstraction and adapters
- `lib/push/`: push subscription parsing and delivery placeholders
- `lib/services/`: signal engine, alerts, notifications and ingest services
- `lib/supabase/`: browser, server and admin Supabase clients
- `lib/types/`: domain, dashboard, provider and database types
- `supabase/migrations/`: schema and migration-ready SQL

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
PROVIDER_API_KEY=your-generic-provider-api-key
THESPORTSDB_API_KEY=123
THESPORTSDB_API_VERSION=v1
BALLDONTLIE_NHL_API_KEY=your-balldontlie-nhl-api-key
WEB_PUSH_VAPID_PUBLIC_KEY=your-web-push-public-key
WEB_PUSH_VAPID_PRIVATE_KEY=your-web-push-private-key
```

Notes:
- `.env.local` stays excluded from Git.
- `PROVIDER_API_KEY` is a generic fallback env for future provider swaps.
- Web push sending is still placeholder-ready, but the browser subscription flow and database persistence are implemented.

## Supabase setup

Run these migrations in order:

1. [001_initial_schema.sql](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/supabase/migrations/001_initial_schema.sql)
2. [002_engine_tables.sql](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/supabase/migrations/002_engine_tables.sql)
3. [003_alert_platform_foundation.sql](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/supabase/migrations/003_alert_platform_foundation.sql)

The third migration adds:
- `profiles`
- `leagues`
- `user_leagues`
- `games`
- `pregame_candidates`
- `live_signals`
- `alerts`
- `push_subscriptions`
- `provider_sync_logs`

It also seeds the initial leagues and creates default profile/settings rows for new Supabase Auth users.

## Current trigger engine direction

The signal engine is not hardcoded to one single betting rule. The base now supports typed trigger rules such as:
- `TEAM_NO_GOAL_AFTER_P1`
- `TEAM_NO_GOAL_AFTER_P2`
- `TEAM_NO_GOAL_AFTER_P1_AND_P2`

Current evaluator entry point:
- [signalEngine.ts](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/lib/services/signalEngine.ts)

Current alert persistence flow:
- provider ingest loads games
- evaluator derives triggered signals
- `live_signals` are inserted with duplicate prevention by `signal_key`
- `alerts` are inserted with duplicate prevention by `fingerprint`
- dashboard feed updates via Supabase Realtime-ready client subscription

## Push flow

Implemented now:
- service worker bootstrap on member pages
- browser push permission request
- push subscription collection
- subscription stored in `push_subscriptions`
- public VAPID key endpoint
- placeholder send utility for future Web Push / Edge Function delivery

Relevant files:
- [push-subscription-card.tsx](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/components/push-subscription-card.tsx)
- [subscription route](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/app/api/push/subscription/route.ts)
- [public-key route](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/app/api/push/public-key/route.ts)
- [sw.js](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/public/sw.js)

## Realtime alerts feed

The dashboard now includes a client-side alerts feed that subscribes to `alerts` inserts for the current user.

Relevant files:
- [realtime-alerts-feed.tsx](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/components/realtime-alerts-feed.tsx)
- [use-alerts-feed.ts](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/hooks/use-alerts-feed.ts)

## Provider architecture

Provider contract now exposes:
- `getScheduledGames()`
- `getLiveGames()`
- `getGameDetails()`
- `getMarketData()`

Current adapters:
- [mockHockeyApi.ts](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/lib/providers/mockHockeyApi.ts)
- [theSportsDb.ts](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/lib/providers/theSportsDb.ts)
- [balldontlieNhl.ts](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/lib/providers/balldontlieNhl.ts)
- [hockeyApi.ts](C:/Users/mago4/OneDrive/Asztali%20gĂ©p/Appok/Sportsbetting/lib/providers/hockeyApi.ts)

## Local development

1. `npm install`
2. Create `.env.local`
3. Run the three SQL migration files in Supabase SQL Editor
4. If you want real NHL play-by-play, set `BALLDONTLIE_NHL_API_KEY`
5. `npm run dev`
6. Open `http://localhost:3000`

## Vercel deployment

1. Import the GitHub repository into Vercel.
2. Add every variable from [`.env.example`](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/.env.example).
3. Set `NEXT_PUBLIC_APP_URL` to the production domain.
4. Do not add native Vercel cron config for this project on Hobby. Scheduling is handled outside the deploy.
5. Redeploy after env setup.

## Scheduler architecture

The deploy no longer depends on native Vercel Cron Jobs.

Protected serverless endpoints:
- [check-hockey-triggers](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/app/api/internal/check-hockey-triggers/route.ts)
- [capture-odds-snapshots](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/app/api/internal/capture-odds-snapshots/route.ts)

Scheduler runner service:
- [scheduler.ts](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/lib/services/scheduler.ts)

GitHub Actions workflow:
- [hockey-scheduler.yml](C:/Users/mago4/OneDrive/Asztali%20gép/Appok/Sportsbetting/.github/workflows/hockey-scheduler.yml)

Required GitHub repository secrets:
- `SCHEDULER_BASE_URL` -> your production base URL, for example `https://your-project.vercel.app`
- `CRON_SECRET` -> the same bearer token used by the protected scheduler endpoints

Current schedule:
- every 15 minutes -> trigger check endpoint
- hourly at minute 5 -> odds snapshot endpoint

Legacy compatibility routes remain available, but they are deprecated:
- `/api/cron/mock-ingest`
- `/api/cron/odds-sync`

## Verification

- `npm run build`
- `npm run lint`

