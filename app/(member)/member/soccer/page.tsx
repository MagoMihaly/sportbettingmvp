import Link from "next/link";
import { SoccerSectionNav } from "@/components/soccer-section-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSoccerDashboardData } from "@/lib/data/soccer";
import { getApiFootballEnv } from "@/lib/supabase/env";

export default async function SoccerDashboardPage() {
  const { alerts, dataQualityFlags, provider, settings, stats, syncLogs, watchlists } = await getSoccerDashboardData();
  const hasApiKey = Boolean(getApiFootballEnv().apiKey);
  const latestError = syncLogs.find((log) => log.status === "error")?.message ?? null;

  return (
    <div className="space-y-6">
      <SoccerSectionNav pathname="/member/soccer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardDescription>Tracked games</CardDescription><CardTitle>{stats.trackedGames}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Active leagues</CardDescription><CardTitle>{stats.activeLeagues}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Triggered signals</CardDescription><CardTitle>{stats.triggeredSignals}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Odds snapshots</CardDescription><CardTitle>{stats.oddsSnapshots}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardDescription>Provider status</CardDescription>
            <CardTitle>{provider.displayName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="flex flex-wrap gap-3">
              <Badge variant="info">Second-sport module</Badge>
              <Badge variant={hasApiKey ? "success" : "warning"}>{hasApiKey ? "API key present" : "API key missing"}</Badge>
              <Badge variant={provider.supportsAutomaticTriggers ? "success" : "warning"}>
                {provider.supportsAutomaticTriggers ? "Auto trigger capable" : "Manual verification needed"}
              </Badge>
            </div>
            <div>Preferred market: {settings?.preferred_market_key ?? "H2_2H_OVER_1_5"}</div>
            <div>Watchlist rows: {watchlists.length}</div>
            <div>Soccer alerts: {alerts.length}</div>
            <Button asChild>
              <Link href="/member/soccer/settings">Open soccer settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Data quality</CardDescription>
            <CardTitle>Operational readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Flags detected: {dataQualityFlags.length}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Notifications: {settings?.notifications_enabled ? "Enabled" : "Muted"}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Scheduler endpoints are ready once the API key is configured.</div>
            {latestError ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
                Latest provider error: {latestError}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}