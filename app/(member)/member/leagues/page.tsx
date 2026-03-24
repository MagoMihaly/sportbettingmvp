import { HockeySectionNav } from "@/components/hockey-section-nav";
import { LeagueSettingsForm } from "@/components/league-settings-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data/dashboard";
import Link from "next/link";

export default async function LeaguesPage() {
  const { settings } = await getDashboardData();

  return (
    <div className="space-y-6">
      <HockeySectionNav pathname="/member/leagues" />
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Hockey settings</div>
        <h1 className="text-3xl font-semibold text-white">Priority hockey league watchlist</h1>
      </div>
      <Card>
        <CardHeader>
          <CardDescription>Other sports</CardDescription>
          <CardTitle>Sport-specific settings stay separate</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-slate-300">
          <Button variant="outline" asChild>
            <Link href="/member/soccer/settings">Open soccer settings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/member/mlb/settings">Open MLB settings</Link>
          </Button>
        </CardContent>
      </Card>
      <LeagueSettingsForm selectedLeagues={settings?.selected_leagues ?? []} />
    </div>
  );
}

