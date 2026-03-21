import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatOdds } from "@/lib/utils";
import type { OddsSnapshotRecord, TrackedMatchRecord, IngestRunRecord } from "@/lib/types/database";

export function TrackedMatchesPanel({ trackedMatches }: { trackedMatches: TrackedMatchRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Fixture sync output</CardDescription>
        <CardTitle>Tracked matches</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trackedMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No tracked matches yet.</div>
        ) : trackedMatches.map((match) => (
          <div key={match.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-white">{match.home_team} vs {match.away_team}</div>
                <div className="mt-1 text-sm text-slate-400">{match.league} • {formatDateTime(match.match_start_time)}</div>
              </div>
              <Badge variant={match.ingest_status === "synced" ? "success" : match.ingest_status === "error" ? "danger" : "warning"}>{match.ingest_status}</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              <div>Score: {match.home_score} - {match.away_score}</div>
              <div>P1: {match.period1_home_goals} - {match.period1_away_goals}</div>
              <div>P2: {match.period2_home_goals} - {match.period2_away_goals}</div>
              <div>Last sync: {formatDateTime(match.last_synced_at)}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OddsSnapshotsPanel({ oddsSnapshots }: { oddsSnapshots: OddsSnapshotRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Odds tracking base</CardDescription>
        <CardTitle>Latest snapshots</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {oddsSnapshots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No odds snapshots captured yet.</div>
        ) : oddsSnapshots.slice(0, 8).map((snapshot) => (
          <div key={snapshot.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <div>
              <div className="text-white">{snapshot.bookmaker}</div>
              <div className="text-slate-400">{snapshot.market_type} • {formatDateTime(snapshot.captured_at)}</div>
            </div>
            <div className="text-cyan-300">{formatOdds(snapshot.decimal_odds)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function IngestRunsPanel({ ingestRuns }: { ingestRuns: IngestRunRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Scheduler history</CardDescription>
        <CardTitle>Ingest runs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ingestRuns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No ingest runs recorded yet.</div>
        ) : ingestRuns.map((run) => (
          <div key={run.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-white">{run.run_type}</div>
                <div className="mt-1 text-sm text-slate-400">{run.provider} • {formatDateTime(run.started_at)}</div>
              </div>
              <Badge variant={run.status === "synced" ? "success" : run.status === "error" ? "danger" : "warning"}>{run.status}</Badge>
            </div>
            <div className="mt-3 text-sm text-slate-300">Records created: {run.records_created}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
