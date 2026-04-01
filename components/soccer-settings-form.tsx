import { soccerMarkets } from "@/lib/config/soccerMarkets";
import { soccerLeagueConfigs } from "@/lib/config/soccerLeagues";
import { updateSoccerSettingsAction } from "@/actions/soccer-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SoccerUserSettings } from "@/lib/types/database";

export function SoccerSettingsForm({ settings }: { settings: SoccerUserSettings | null }) {
  const selectedLeagues = settings?.selected_leagues ?? soccerLeagueConfigs.map((league) => league.slug);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Soccer provider configuration surface</CardDescription>
        <CardTitle>Soccer watchlist and alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateSoccerSettingsAction} className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-200">Tracked leagues</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {soccerLeagueConfigs.map((league) => (
                <label key={league.slug} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <input type="checkbox" name="selected_leagues" value={league.slug} defaultChecked={selectedLeagues.includes(league.slug)} className="h-4 w-4 rounded border-white/10 bg-slate-950" />
                  <span>{league.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Preferred market</span>
              <select name="preferred_market_key" defaultValue={settings?.preferred_market_key ?? "H2_2H_OVER_1_5"} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white">
                {soccerMarkets.map((market) => (
                  <option key={market.key} value={market.key}>{market.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Timezone</span>
              <input name="timezone" defaultValue={settings?.timezone ?? "Europe/Budapest"} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <span>Notifications enabled</span>
              <input type="checkbox" name="notifications_enabled" defaultChecked={settings?.notifications_enabled ?? true} />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <span>Email alerts</span>
              <input type="checkbox" name="email_notifications" defaultChecked={settings?.email_notifications ?? false} />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <span>Push alerts</span>
              <input type="checkbox" name="push_notifications" defaultChecked={settings?.push_notifications ?? true} />
            </label>
          </div>

          <p className="text-sm leading-6 text-slate-400">
            Soccer keeps its own rules and settings, but uses the same platform shell as hockey and MLB. When the configured soccer provider is connected, the scheduler-ready ingest layer can start filling watchlists, state snapshots and live alerts without changing the other sports.
          </p>
          <Button>Save soccer settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
