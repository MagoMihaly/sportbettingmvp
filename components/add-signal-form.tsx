"use client";

import { useActionState, useMemo, useState } from "react";
import { createSignalAction, type SignalActionState } from "@/actions/signals";
import { priorityLeagues } from "@/lib/config/leagues";
import { isEligibleThirdPeriodTrigger } from "@/lib/services/signal-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const initialState: SignalActionState = {
  error: "",
  success: "",
};

export function AddSignalForm() {
  const [period1, setPeriod1] = useState("0");
  const [period2, setPeriod2] = useState("0");
  const [actionState, formAction, isPending] = useActionState(createSignalAction, initialState);

  const eligible = useMemo(() => isEligibleThirdPeriodTrigger(Number(period1), Number(period2)), [period1, period2]);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Manual input</CardDescription>
        <CardTitle>Add Signal</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="league">League</Label>
            <select id="league" name="league" className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-200">
              {priorityLeagues.map((league) => (
                <option key={league} value={league}>{league}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="home_team">Home team</Label>
            <Input id="home_team" name="home_team" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="away_team">Away team</Label>
            <Input id="away_team" name="away_team" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="selected_team">Selected team</Label>
            <Input id="selected_team" name="selected_team" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="selected_team_side">Selected team side</Label>
            <select id="selected_team_side" name="selected_team_side" className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-slate-200">
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="match_start_time">Match start</Label>
            <Input id="match_start_time" name="match_start_time" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookmaker">Bookmaker</Label>
            <Input id="bookmaker" name="bookmaker" placeholder="Pinnacle" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period1_goals">P1 goals</Label>
            <Input id="period1_goals" name="period1_goals" type="number" min="0" value={period1} onChange={(event) => setPeriod1(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period2_goals">P2 goals</Label>
            <Input id="period2_goals" name="period2_goals" type="number" min="0" value={period2} onChange={(event) => setPeriod2(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odds">Odds</Label>
            <Input id="odds" name="odds" type="number" min="1" step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stake">Stake</Label>
            <Input id="stake" name="stake" type="number" min="0" step="0.1" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Context, scoring notes, trader comments..." />
          </div>
          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge variant={eligible ? "info" : "neutral"}>
              {eligible ? "Eligible 3rd period trigger" : "Still monitoring"}
            </Badge>
            <Button disabled={isPending}>Save signal</Button>
          </div>
          {actionState.error ? <p className="md:col-span-2 text-sm text-rose-300">{actionState.error}</p> : null}
          {actionState.success ? <p className="md:col-span-2 text-sm text-emerald-300">{actionState.success}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
