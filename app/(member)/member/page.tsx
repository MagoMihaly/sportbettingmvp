import Link from "next/link";
import { toggleHockeyNotificationsAction, toggleMlbNotificationsAction, toggleSoccerNotificationsAction } from "@/actions/multi-sport";
import { RealtimeAlertsFeed } from "@/components/realtime-alerts-feed";
import { SportOverviewCard } from "@/components/sport-overview-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data/dashboard";
import { getMlbDashboardData } from "@/lib/data/mlb";
import { getSoccerDashboardData } from "@/lib/data/soccer";
import { isMlbModuleEnabled, isSoccerModuleEnabled } from "@/lib/supabase/env";

export default async function MemberDashboardPage() {
  const soccerEnabled = isSoccerModuleEnabled();
  const mlbEnabled = isMlbModuleEnabled();
  const [hockey, soccer, mlb] = await Promise.all([
    getDashboardData(),
    getSoccerDashboardData(),
    getMlbDashboardData(),
  ]);

  const totalTriggeredSignals =
    hockey.stats.triggeredSignals +
    (soccerEnabled ? soccer.stats.triggeredSignals : 0) +
    (mlbEnabled ? mlb.stats.triggeredSignals : 0);
  const totalAlerts =
    hockey.stats.alertsCount +
    (soccerEnabled ? soccer.stats.alertsCount : 0) +
    (mlbEnabled ? mlb.stats.alertsCount : 0);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Member dashboard</div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">Multi-sport signal workspace</h1>
          <Badge variant={hockey.viewer.isDemo ? "warning" : "success"}>
            {hockey.viewer.isDemo ? "Demo-safe mode" : "Authenticated"}
          </Badge>
        </div>
        <p className="max-w-4xl text-sm leading-7 text-slate-400">
          This overview keeps hockey, soccer and MLB on equal footing. Each sport has its own rules, settings and activity trail, while notifications and scheduling stay in a shared platform layer.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader><CardDescription>Triggered signals</CardDescription><CardTitle>{totalTriggeredSignals}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Total alerts</CardDescription><CardTitle>{totalAlerts}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Hockey leagues</CardDescription><CardTitle>{hockey.stats.activeLeagues}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Soccer + MLB systems</CardDescription><CardTitle>{(soccerEnabled ? soccer.stats.activeLeagues : 0) + (mlbEnabled ? mlb.stats.activeSystems : 0)}</CardTitle></CardHeader></Card>
      </div>

      <div className={`grid gap-6 ${soccerEnabled && mlbEnabled ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
        <SportOverviewCard
          label="Hockey"
          description="European hockey stays period-based and alert-first. This remains the most mature production path in the project."
          accentVariant="info"
          statusLabel="3rd-period scoreless trigger"
          notificationsEnabled={hockey.settings?.notifications_enabled ?? true}
          summaryItems={[
            { label: "Triggered", value: hockey.stats.triggeredSignals },
            { label: "Leagues", value: hockey.stats.activeLeagues },
            { label: "Tracked", value: hockey.stats.trackedMatches },
            { label: "Provider", value: hockey.provider.displayName },
          ]}
          href="/member/hockey"
          settingsHref="/member/leagues"
          toggleAction={toggleHockeyNotificationsAction}
        />
        {soccerEnabled ? (
          <SportOverviewCard
            label="Soccer"
            description="H2 and H3 systems run in a separate module with watchlist-first polling and free-plan safe mode support."
            accentVariant="success"
            statusLabel="H2 / H3 goal-state systems"
            notificationsEnabled={soccer.settings?.notifications_enabled ?? true}
            summaryItems={[
              { label: "Triggered", value: soccer.stats.triggeredSignals },
              { label: "Leagues", value: soccer.stats.activeLeagues },
              { label: "Watchlist", value: soccer.stats.watchlistRows },
              { label: "Provider", value: soccer.provider.displayName },
            ]}
            href="/member/soccer"
            settingsHref="/member/soccer/settings"
            toggleAction={toggleSoccerNotificationsAction}
          />
        ) : null}
        {mlbEnabled ? (
          <SportOverviewCard
            label="MLB"
            description="MLB is now a first-class module in mock-safe mode so we can validate multi-sport UX and signal handling without committing to another paid feed yet."
            accentVariant="warning"
            statusLabel="Inning-state signal systems"
            notificationsEnabled={mlb.settings?.notifications_enabled ?? true}
            summaryItems={[
              { label: "Triggered", value: mlb.stats.triggeredSignals },
              { label: "Systems", value: mlb.stats.activeSystems },
              { label: "Watchlist", value: mlb.stats.watchlistRows },
              { label: "Provider", value: mlb.provider.displayName },
            ]}
            href="/member/mlb"
            settingsHref="/member/mlb/settings"
            toggleAction={toggleMlbNotificationsAction}
          />
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <RealtimeAlertsFeed initialAlerts={hockey.alerts} userId={hockey.viewer.userId} isDemo={hockey.viewer.isDemo} />
        <Card>
          <CardHeader>
            <CardDescription>Signal workflow</CardDescription>
            <CardTitle>API-efficient by design</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Stage 1: fixture sync only for selected sports and selected leagues or systems.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Stage 2: watchlist rows are created server-side so only relevant live games move into higher-frequency processing.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Stage 3: odds capture is reserved for watchlist and trigger-zone games instead of every synced game.
            </div>
            <Button asChild>
              <Link href="/member/engine">Open engine workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
