import { EngineOpsPanel } from "@/components/engine-ops-panel";
import { IngestRunsPanel, OddsSnapshotsPanel, TrackedMatchesPanel } from "@/components/engine-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEngineData } from "@/lib/data/dashboard";

export default async function EnginePage() {
  const { trackedMatches, oddsSnapshots, ingestRuns, settings, provider } = await getEngineData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Engine</div>
        <h1 className="text-3xl font-semibold text-white">Live provider and odds tracking ops</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">
          This layer prepares the platform for scheduled live feeds: tracked fixtures, odds snapshots and ingest history are separated cleanly from the signal log.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="info">Provider: {provider.displayName}</Badge>
        <Badge variant={provider.supportsAutomaticTriggers ? "success" : "warning"}>
          {provider.supportsAutomaticTriggers ? "Automatic trigger detection available" : "Automatic trigger detection pending richer provider detail"}
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Tracked matches</CardDescription>
            <CardTitle>{trackedMatches.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Odds snapshots</CardDescription>
            <CardTitle>{oddsSnapshots.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Watchlist leagues</CardDescription>
            <CardTitle>{settings?.selected_leagues.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <EngineOpsPanel />
        <IngestRunsPanel ingestRuns={ingestRuns} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <TrackedMatchesPanel trackedMatches={trackedMatches} />
        <OddsSnapshotsPanel oddsSnapshots={oddsSnapshots} />
      </div>
    </div>
  );
}
