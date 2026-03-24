import Link from "next/link";
import { MlbSectionNav } from "@/components/mlb-section-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMlbDashboardData } from "@/lib/data/mlb";

export default async function MlbDashboardPage() {
  const { alerts, liveSignals, provider, settings, stats, syncLogs, watchlists } = await getMlbDashboardData();
  const latestError = syncLogs.find((log) => log.status === "error")?.message ?? null;

  return (
    <div className="space-y-6">
      <MlbSectionNav pathname="/member/mlb" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardDescription>Tracked games</CardDescription><CardTitle>{stats.trackedGames}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Active systems</CardDescription><CardTitle>{stats.activeSystems}</CardTitle></CardHeader></Card>
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
              <Badge variant="info">First-class sport module</Badge>
              <Badge variant="warning">Mock-safe mode</Badge>
              <Badge variant={provider.supportsAutomaticTriggers ? "success" : "warning"}>
                {provider.supportsAutomaticTriggers ? "Auto trigger capable" : "Manual verification needed"}
              </Badge>
            </div>
            <div>Preferred system: {settings?.preferred_market_key ?? "MLB_F5_SCORELESS"}</div>
            <div>Watchlist rows: {watchlists.length}</div>
            <div>MLB alerts: {alerts.length}</div>
            <Button asChild>
              <Link href="/member/mlb/settings">Open MLB settings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Operational status</CardDescription>
            <CardTitle>Signal health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Live signals: {liveSignals.length}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Notifications: {settings?.notifications_enabled ? "Enabled" : "Muted"}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              MLB currently runs through the internal mock provider so the multi-sport engine stays testable without adding a new paid feed yet.
            </div>
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
