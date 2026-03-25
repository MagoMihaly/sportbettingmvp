"use client";

import { useActionState } from "react";
import {
  runManualLiveSyncAction,
  runManualMlbLiveSyncAction,
  runManualOddsSyncAction,
  runManualSoccerLiveSyncAction,
  runManualSoccerOddsSyncAction,
  type EngineActionState,
} from "@/actions/engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SupportedSportKey } from "@/lib/config/sports";

const initialState: EngineActionState = {
  error: "",
  success: "",
};

const sportActionMap = {
  hockey: {
    sync: runManualLiveSyncAction,
    odds: runManualOddsSyncAction,
    title: "Hockey engine ops",
    description: "Run hockey fixture sync and cost-aware odds capture.",
    syncCopy: "Run the hockey provider sync and persist fixtures into tracked matches.",
    oddsCopy: "Capture a hockey odds layer only for matches that remain in the active watch window.",
    syncLabel: "Run live sync",
  },
  soccer: {
    sync: runManualSoccerLiveSyncAction,
    odds: runManualSoccerOddsSyncAction,
    title: "Soccer engine ops",
    description: "Run soccer watchlist sync and H2/H3 odds capture.",
    syncCopy: "Run the soccer provider sync and persist games, watchlist rows and live signals.",
    oddsCopy: "Capture soccer odds only for games that stay in watchlist or trigger-zone state.",
    syncLabel: "Run live sync",
  },
  mlb: {
    sync: runManualMlbLiveSyncAction,
    title: "MLB engine ops",
    description: "Run the MLB schedule sync, then evaluate the pre-game series strategies on cached matchup history.",
    syncCopy: "Run the MLB provider sync and persist scheduled games plus the latest pre-game series evaluations.",
    syncLabel: "Run pre-game sync",
  },
} as const satisfies Record<
  SupportedSportKey,
  {
    sync: (state: EngineActionState, payload: FormData) => Promise<EngineActionState>;
    odds?: (state: EngineActionState, payload: FormData) => Promise<EngineActionState>;
    title: string;
    description: string;
    syncCopy: string;
    syncLabel: string;
    oddsCopy?: string;
  }
>;

export function SportEngineOpsPanel({ sport }: { sport: SupportedSportKey }) {
  const config = sportActionMap[sport];
  const hasOddsSync = "odds" in config && typeof config.odds === "function";
  const oddsHandler = hasOddsSync ? config.odds : config.sync;
  const [liveState, liveAction, livePending] = useActionState(config.sync, initialState);
  const [oddsState, oddsAction, oddsPending] = useActionState(oddsHandler, initialState);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Manual operator controls</CardDescription>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-slate-300">{config.description}</p>
        <form action={liveAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-300">{config.syncCopy}</div>
          <Button disabled={livePending}>{config.syncLabel}</Button>
          {liveState.error ? <p className="text-sm text-rose-300">{liveState.error}</p> : null}
          {liveState.success ? <p className="text-sm text-emerald-300">{liveState.success}</p> : null}
        </form>
        {hasOddsSync ? (
          <form action={oddsAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-slate-300">{config.oddsCopy}</div>
            <Button variant="outline" disabled={oddsPending}>Run odds sync</Button>
            {oddsState.error ? <p className="text-sm text-rose-300">{oddsState.error}</p> : null}
            {oddsState.success ? <p className="text-sm text-emerald-300">{oddsState.success}</p> : null}
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function EngineOpsPanel() {
  return <SportEngineOpsPanel sport="hockey" />;
}
