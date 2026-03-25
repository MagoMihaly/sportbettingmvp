"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatOdds } from "@/lib/utils";
import type { MlbGameRecord, MlbPregameSignalRecord } from "@/lib/types/database";

const statusVariantMap: Record<MlbPregameSignalRecord["evaluation_status"], "neutral" | "success" | "warning"> = {
  candidate: "warning",
  qualified: "success",
  skipped: "neutral",
};

export function MlbPregameSignalsTable({
  games,
  pregameSignals,
}: {
  games: MlbGameRecord[];
  pregameSignals: MlbPregameSignalRecord[];
}) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return pregameSignals
      .map((signal) => ({
        signal,
        game: games.find((entry) => entry.id === signal.game_id),
      }))
      .filter((row) => row.game)
      .filter((row) => {
        const haystack = `${row.game?.home_team} ${row.game?.away_team} ${row.signal.strategy_id} ${row.signal.signal_team}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      });
  }, [games, pregameSignals, search]);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Series-based MLB systems</CardDescription>
        <CardTitle>Pre-game strategy output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder="Search matchup, strategy or signal team" />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">
            No pre-game MLB strategy rows match the current filters.
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map(({ signal, game }) => (
              <div key={signal.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{game?.home_team} vs {game?.away_team}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      MLB pre-game • {formatDateTime(game?.start_time ?? signal.evaluated_at)}
                    </div>
                  </div>
                  <Badge variant={statusVariantMap[signal.evaluation_status]}>
                    {signal.evaluation_status === "qualified"
                      ? "Qualified"
                      : signal.evaluation_status === "candidate"
                        ? "Candidate"
                        : "Skipped"}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                  <div>Strategy: {signal.strategy_id}</div>
                  <div>Series game: G{signal.series_game_number}</div>
                  <div>Side: {signal.signal_team} ({signal.signal_direction})</div>
                  <div>Odds: {formatOdds(signal.odds)}</div>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-300">
                  {signal.reason_summary}
                  {signal.skip_reason ? <div className="mt-2 text-rose-300">Skip rule: {signal.skip_reason}</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
