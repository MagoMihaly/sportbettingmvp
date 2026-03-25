import Link from "next/link";
import { SportEngineOpsPanel } from "@/components/engine-ops-panel";
import { IngestRunsPanel, OddsSnapshotsPanel, TrackedMatchesPanel } from "@/components/engine-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData, getEngineData } from "@/lib/data/dashboard";
import { getMlbDashboardData } from "@/lib/data/mlb";
import { getSoccerDashboardData } from "@/lib/data/soccer";
import { supportedSports } from "@/lib/config/sports";
import { isMlbModuleEnabled, isSoccerModuleEnabled } from "@/lib/supabase/env";

export default async function EnginePage() {
  const soccerEnabled = isSoccerModuleEnabled();
  const mlbEnabled = isMlbModuleEnabled();

  const [hockeyDashboard, hockeyEngine, soccer, mlb] = await Promise.all([
    getDashboardData(),
    getEngineData(),
    getSoccerDashboardData(),
    getMlbDashboardData(),
  ]);

  const sportSummaries = supportedSports
    .filter((sport) => (sport.key === "soccer" ? soccerEnabled : sport.key === "mlb" ? mlbEnabled : true))
    .map((sport) => {
      if (sport.key === "hockey") {
        return {
          ...sport,
          provider: hockeyDashboard.provider.displayName,
          automatic: hockeyDashboard.provider.supportsAutomaticTriggers,
          automaticLabel: hockeyDashboard.provider.supportsAutomaticTriggers ? "Automatic triggers" : "Manual verification",
          tracked: hockeyDashboard.stats.trackedMatches,
          alerts: hockeyDashboard.stats.alertsCount,
          route: sport.href,
        };
      }

      if (sport.key === "soccer") {
        return {
          ...sport,
          provider: soccer.provider.displayName,
          automatic: soccer.provider.supportsAutomaticTriggers,
          automaticLabel: soccer.provider.supportsAutomaticTriggers ? "Automatic triggers" : "Manual verification",
          tracked: soccer.stats.trackedGames,
          alerts: soccer.stats.alertsCount,
          route: sport.href,
        };
      }

      return {
        ...sport,
        provider: mlb.provider.displayName,
        automatic: mlb.provider.supportsAutomaticTriggers,
        automaticLabel: mlb.provider.supportsAutomaticTriggers ? "Automated evaluations" : "Manual verification",
        tracked: mlb.stats.trackedGames,
        alerts: mlb.stats.alertsCount,
        route: sport.href,
      };
    });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Engine</div>
        <h1 className="text-3xl font-semibold text-white">Multi-sport engine workspace</h1>
        <p className="max-w-4xl text-sm leading-7 text-slate-400">
          Hockey, soccer and MLB now share one operator view. Syncs remain sport-specific, but scheduling, logging and notification delivery stay aligned in a common platform layer.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sportSummaries.map((sport) => (
          <Card key={sport.key}>
            <CardHeader>
              <CardDescription>{sport.label}</CardDescription>
              <CardTitle>{sport.provider}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <div className="flex flex-wrap gap-2">
                <Badge variant={sport.badgeVariant}>{sport.defaultMarketLabel}</Badge>
                <Badge variant={sport.automatic ? "success" : "warning"}>{sport.automaticLabel}</Badge>
              </div>
              <div>Tracked rows: {sport.tracked}</div>
              <div>Alerts: {sport.alerts}</div>
              <Button variant="outline" asChild>
                <Link href={sport.route}>Open {sport.label} workspace</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SportEngineOpsPanel sport="hockey" />
        {soccerEnabled ? <SportEngineOpsPanel sport="soccer" /> : null}
        {mlbEnabled ? <SportEngineOpsPanel sport="mlb" /> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <IngestRunsPanel ingestRuns={hockeyEngine.ingestRuns} />
        <Card>
          <CardHeader>
            <CardDescription>Scheduler strategy</CardDescription>
            <CardTitle>Cost-aware execution model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Separate protected endpoints keep hockey, soccer and MLB isolated during scheduled runs.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Shared polling-stage helpers reduce expensive follow-up work by focusing only on shortlisted games or series candidates.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              MLB stays mock-safe until a real provider is justified, so we can validate the multi-sport operating model without forcing unnecessary API cost.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <TrackedMatchesPanel trackedMatches={hockeyEngine.trackedMatches} />
        <OddsSnapshotsPanel oddsSnapshots={hockeyEngine.oddsSnapshots} />
      </div>
    </div>
  );
}
