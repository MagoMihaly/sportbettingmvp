import Link from "next/link";
import { AddSignalForm } from "@/components/add-signal-form";
import { DashboardStatsGrid } from "@/components/dashboard-stats-grid";
import { EngineOpsPanel } from "@/components/engine-ops-panel";
import { LatestSignals } from "@/components/latest-signals";
import { NotificationStatusCard } from "@/components/notification-status-card";
import { RealtimeAlertsFeed } from "@/components/realtime-alerts-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function MemberDashboardPage() {
  const { alerts, profile, pushSubscriptions, signals, settings, stats, provider, viewer } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Member dashboard</div>
        <h1 className="text-3xl font-semibold text-white">European hockey alert workspace</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400">
          Review live alerts, tracked signals, watched league coverage, push readiness and ingest activity from a single protected dashboard.
        </p>
      </div>
      <DashboardStatsGrid stats={stats} />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <RealtimeAlertsFeed initialAlerts={alerts} userId={viewer.userId} isDemo={viewer.isDemo} />
        <Card>
          <CardHeader>
            <CardDescription>Workspace profile</CardDescription>
            <CardTitle>{profile?.full_name ?? viewer.email}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="flex flex-wrap gap-3">
              <Badge variant="info">{profile?.role ?? "member"}</Badge>
              <Badge variant={viewer.isDemo ? "warning" : "success"}>{viewer.isDemo ? "Demo mode" : "Authenticated"}</Badge>
            </div>
            <div>Email: {viewer.email}</div>
            <div>Timezone: {settings?.timezone ?? "Europe/Budapest"}</div>
            <div>Push devices: {pushSubscriptions.length}</div>
            <Button asChild>
              <Link href="/member/account">Open account settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
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
            <CardTitle>Provider and scheduler base</CardTitle>
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
