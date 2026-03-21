import Link from "next/link";
import { AddSignalForm } from "@/components/add-signal-form";
import { DashboardStatsGrid } from "@/components/dashboard-stats-grid";
import { EngineOpsPanel } from "@/components/engine-ops-panel";
import { LatestSignals } from "@/components/latest-signals";
import { NotificationStatusCard } from "@/components/notification-status-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function MemberDashboardPage() {
  const { signals, settings, stats, provider } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Member dashboard</div>
        <h1 className="text-3xl font-semibold text-white">European hockey signal workspace</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">
          Review tracked signals, current trigger count, watched league coverage, ingest activity and notification readiness from a single dashboard.
        </p>
      </div>
      <DashboardStatsGrid stats={stats} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <LatestSignals signals={signals} />
        <NotificationStatusCard status={stats.notificationStatus} triggeredSignals={stats.triggeredSignals} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardDescription>Watchlist snapshot</CardDescription>
            <CardTitle>Active leagues</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(settings?.selected_leagues ?? []).map((league) => (
              <div key={league} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">{league}</div>
            ))}
          </CardContent>
        </Card>
        <AddSignalForm />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardDescription>Engine summary</CardDescription>
            <CardTitle>Live ingest base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="info">Provider: {provider.displayName}</Badge>
              <Badge variant={provider.supportsAutomaticTriggers ? "success" : "warning"}>
                {provider.supportsAutomaticTriggers ? "Auto trigger capable" : "Fixture sync only"}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Tracked matches: {stats.trackedMatches}</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Odds snapshots: {stats.oddsSnapshots}</div>
            </div>
            <Button asChild>
              <Link href="/member/engine">Open engine workspace</Link>
            </Button>
          </CardContent>
        </Card>
        <EngineOpsPanel />
      </div>
    </div>
  );
}
