"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatOdds } from "@/lib/utils";
import type { MlbGameRecord, MlbLiveSignalRecord, MlbOddsSnapshotRecord } from "@/lib/types/database";

const statusVariantMap: Record<string, "neutral" | "success" | "warning" | "info" | "danger"> = {
  triggered: "info",
  watching: "neutral",
  pending: "warning",
  won: "success",
  lost: "danger",
};

export function MlbSignalsTable({
  games,
  liveSignals,
  oddsSnapshots,
}: {
  games: MlbGameRecord[];
  liveSignals: MlbLiveSignalRecord[];
  oddsSnapshots: MlbOddsSnapshotRecord[];
}) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return liveSignals
      .map((signal) => {
        const game = games.find((entry) => entry.id === signal.game_id);
        const latestOdds = oddsSnapshots.find((snapshot) => snapshot.game_id === signal.game_id && snapshot.market_key === signal.market_key);
        return {
          signal,
          game,
          latestOdds,
        };
      })
      .filter((row) => row.game)
      .filter((row) => {
        const haystack = `${row.game?.home_team} ${row.game?.away_team} ${row.signal.rule_type}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      });
  }, [games, liveSignals, oddsSnapshots, search]);

  return (
    <Card>
      <CardHeader>
        <CardDescription>MLB signal activity</CardDescription>
        <CardTitle>Live MLB signal records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder="Search matchup or rule" />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">
            No MLB signals match the current filters.
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map(({ signal, game, latestOdds }) => (
              <div key={signal.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{game?.home_team} vs {game?.away_team}</div>
                    <div className="mt-1 text-sm text-slate-400">MLB - {formatDateTime(game?.start_time ?? signal.created_at)}</div>
                  </div>
                  <Badge variant={signal.trigger_condition_met ? "info" : statusVariantMap.watching}>
                    {signal.trigger_condition_met ? "Triggered" : "Watching"}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                  <div>Rule: {signal.rule_type}</div>
                  <div>Inning: {signal.inning ?? "-"}</div>
                  <div>Score: {signal.home_score}-{signal.away_score}</div>
                  <div>Odds: {formatOdds(latestOdds?.decimal_odds ?? null)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
