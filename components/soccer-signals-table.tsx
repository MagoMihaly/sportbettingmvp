import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { SoccerAlertRecord, SoccerLiveSignalRecord, SoccerOddsSnapshotRecord } from "@/lib/types/database";

export function SoccerSignalsTable({
  liveSignals,
  alerts,
  oddsSnapshots,
}: {
  liveSignals: SoccerLiveSignalRecord[];
  alerts: SoccerAlertRecord[];
  oddsSnapshots: SoccerOddsSnapshotRecord[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Second-sport live trigger feed</CardDescription>
        <CardTitle>Soccer signals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {liveSignals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">
            No soccer signals yet. Save soccer settings and connect API-Football to start ingest.
          </div>
        ) : (
          <div className="grid gap-4">
            {liveSignals.map((signal) => {
              const signalAlerts = alerts.filter((alert) => alert.soccer_live_signal_id === signal.id);
              const latestOdds = oddsSnapshots.find((snapshot) => snapshot.signal_key === signal.signal_key);
              return (
                <div key={signal.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-emerald-300">{signal.market_key}</div>
                      <div className="mt-2 text-lg font-semibold text-white">{signal.rule_type}</div>
                    </div>
                    <Badge variant={signal.trigger_condition_met ? "success" : "neutral"}>
                      {signal.trigger_condition_met ? "Triggered" : "Watching"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
                    <div>Score: {signal.home_score}-{signal.away_score}</div>
                    <div>Minute: {signal.minute ?? "-"}</div>
                    <div>Alerts: {signalAlerts.length}</div>
                    <div>Latest odds: {latestOdds?.decimal_odds?.toFixed(2) ?? "-"}</div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">Triggered at {signal.triggered_at ? formatDateTime(signal.triggered_at) : "-"}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}