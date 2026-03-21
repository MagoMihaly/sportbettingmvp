"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime, formatOdds } from "@/lib/utils";
import type { SignalRecord } from "@/lib/types/database";

const statusVariantMap: Record<string, "neutral" | "success" | "warning" | "info" | "danger"> = {
  triggered: "info",
  watching: "neutral",
  pending: "warning",
  won: "success",
  lost: "danger",
};

export function SignalsTable({ signals }: { signals: SignalRecord[] }) {
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const leagues = useMemo(() => Array.from(new Set(signals.map((signal) => signal.league))), [signals]);

  const filteredSignals = useMemo(() => {
    return [...signals]
      .filter((signal) => {
        const target = `${signal.home_team} ${signal.away_team} ${signal.selected_team} ${signal.league}`.toLowerCase();
        return target.includes(search.toLowerCase());
      })
      .filter((signal) => (leagueFilter === "all" ? true : signal.league === leagueFilter))
      .filter((signal) => (statusFilter === "all" ? true : signal.status === statusFilter))
      .sort((a, b) => new Date(b.match_start_time).getTime() - new Date(a.match_start_time).getTime());
  }, [leagueFilter, search, signals, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Logged bets and signal tracking</CardDescription>
        <CardTitle>Signals table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder="Search team, league or selected side" />
          </div>
          <select value={leagueFilter} onChange={(event) => setLeagueFilter(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-200">
            <option value="all">All leagues</option>
            {leagues.map((league) => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-200">
            <option value="all">All statuses</option>
            <option value="triggered">Triggered</option>
            <option value="watching">Watching</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {filteredSignals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">
            No signals match the current filters.
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 xl:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Match</th>
                    <th className="px-4 py-3 font-medium">League</th>
                    <th className="px-4 py-3 font-medium">Selected team</th>
                    <th className="px-4 py-3 font-medium">Periods</th>
                    <th className="px-4 py-3 font-medium">Odds</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Start</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignals.map((signal) => (
                    <tr key={signal.id} className="border-t border-white/10 text-slate-300">
                      <td className="px-4 py-4">{signal.home_team} vs {signal.away_team}</td>
                      <td className="px-4 py-4">{signal.league}</td>
                      <td className="px-4 py-4">{signal.selected_team}</td>
                      <td className="px-4 py-4">P1 {signal.period1_goals} / P2 {signal.period2_goals}</td>
                      <td className="px-4 py-4">{formatOdds(signal.odds)}</td>
                      <td className="px-4 py-4"><Badge variant={statusVariantMap[signal.status]}>{signal.trigger_condition_met ? "Triggered signal" : signal.status}</Badge></td>
                      <td className="px-4 py-4">{formatDateTime(signal.match_start_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 xl:hidden">
              {filteredSignals.map((signal) => (
                <div key={signal.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{signal.home_team} vs {signal.away_team}</div>
                      <div className="mt-1 text-sm text-slate-400">{signal.league} • {formatDateTime(signal.match_start_time)}</div>
                    </div>
                    <Badge variant={statusVariantMap[signal.status]}>{signal.trigger_condition_met ? "Triggered" : signal.status}</Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                    <div>Selected: {signal.selected_team}</div>
                    <div>Periods: P1 {signal.period1_goals} / P2 {signal.period2_goals}</div>
                    <div>Odds: {formatOdds(signal.odds)}</div>
                    <div>Bookmaker: {signal.bookmaker ?? "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


