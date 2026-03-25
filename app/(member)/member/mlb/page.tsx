import Link from "next/link";
import { MlbSectionNav } from "@/components/mlb-section-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMlbDashboardData } from "@/lib/data/mlb";

export default async function MlbDashboardPage() {
  const { alerts, pregameSignals, provider, settings, stats, syncLogs } = await getMlbDashboardData();
  const latestError = syncLogs.find((log) => log.status === "error")?.message ?? null;

  return (
    <div className="space-y-6">
      <MlbSectionNav pathname="/member/mlb" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardDescription>Tracked games</CardDescription><CardTitle>{stats.trackedGames}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Pre-game strategies</CardDescription><CardTitle>{stats.activePregameStrategies}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Qualified pre-game signals</CardDescription><CardTitle>{stats.qualifiedPregameSignals}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Total pre-game evaluations</CardDescription><CardTitle>{stats.pregameSignals}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>MLB alerts</CardDescription><CardTitle>{stats.alertsCount}</CardTitle></CardHeader></Card>
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
              <Badge variant="neutral">Pre-game series engine</Badge>
              <Badge variant={provider.supportsAutomaticTriggers ? "success" : "warning"}>
                {provider.supportsAutomaticTriggers ? "Automated schedule sync" : "Mock-safe schedule sync"}
              </Badge>
            </div>
            <div>Configured strategies: {settings?.selected_pregame_strategies?.length ?? 0}</div>
            <div>Pre-game rows: {pregameSignals.length}</div>
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Pre-game signals: {stats.pregameSignals}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Qualified signals: {stats.qualifiedPregameSignals}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Notifications: {settings?.notifications_enabled ? "Enabled" : "Muted"}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              MLB now runs as a pre-game-only series evaluator. It reuses cached matchup history and skips the retired live watchlist and odds capture layer.
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
