import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { SignalRecord } from "@/lib/types/database";

export function LatestSignals({ signals }: { signals: SignalRecord[] }) {
  const latest = signals.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Latest signals</CardDescription>
        <CardTitle>Recent signal activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No signals logged yet.</div>
        ) : (
          latest.map((signal) => (
            <div key={signal.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-white">{signal.home_team} vs {signal.away_team}</div>
                <div className="mt-1 text-sm text-slate-400">{signal.league} • {formatDateTime(signal.match_start_time)}</div>
              </div>
              <Badge variant={signal.trigger_condition_met ? "info" : "neutral"}>
                {signal.trigger_condition_met ? "Triggered signal" : signal.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
