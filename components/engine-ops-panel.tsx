"use client";

import { useActionState } from "react";
import { runManualLiveSyncAction, runManualOddsSyncAction, type EngineActionState } from "@/actions/engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: EngineActionState = {
  error: "",
  success: "",
};

export function EngineOpsPanel() {
  const [liveState, liveAction, livePending] = useActionState(runManualLiveSyncAction, initialState);
  const [oddsState, oddsAction, oddsPending] = useActionState(runManualOddsSyncAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Manual operator controls</CardDescription>
        <CardTitle>Engine ops</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={liveAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-300">Run the active live provider sync and persist real fixtures into tracked matches. Automatic signals are only created if the provider returns period-level detail.</div>
          <Button disabled={livePending}>Run live provider sync</Button>
          {liveState.error ? <p className="text-sm text-rose-300">{liveState.error}</p> : null}
          {liveState.success ? <p className="text-sm text-emerald-300">{liveState.success}</p> : null}
        </form>
        <form action={oddsAction} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-300">Capture a new odds layer for currently tracked matches. This remains a separate sync stage so later provider-specific odds feeds can replace it cleanly.</div>
          <Button variant="outline" disabled={oddsPending}>Run odds sync</Button>
          {oddsState.error ? <p className="text-sm text-rose-300">{oddsState.error}</p> : null}
          {oddsState.success ? <p className="text-sm text-emerald-300">{oddsState.success}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
