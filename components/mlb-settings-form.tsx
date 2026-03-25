import { mlbPregameStrategies } from "@/lib/config/mlbPregameStrategies";
import { updateMlbSettingsAction } from "@/actions/mlb-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MlbUserSettings } from "@/lib/types/database";

export function MlbSettingsForm({ settings }: { settings: MlbUserSettings | null }) {
  const selectedPregameStrategies = settings?.selected_pregame_strategies ?? mlbPregameStrategies.map((strategy) => strategy.key);

  return (
    <Card>
      <CardHeader>
        <CardDescription>MLB signal controls</CardDescription>
        <CardTitle>MLB watchlist and alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateMlbSettingsAction} className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-200">Pre-game series strategies</div>
            <div className="grid gap-3 md:grid-cols-2">
              {mlbPregameStrategies.map((strategy) => (
                <label key={strategy.key} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="selected_pregame_strategies"
                      value={strategy.key}
                      defaultChecked={selectedPregameStrategies.includes(strategy.key)}
                      className="h-4 w-4 rounded border-white/10 bg-slate-950"
                    />
                    <span>{strategy.label}</span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{strategy.description}</p>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Timezone</span>
              <input name="timezone" defaultValue={settings?.timezone ?? "Europe/Budapest"} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" />
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              MLB is now pre-game only in this workspace. Live inning-state systems and their market selector were removed, so the settings focus on series strategies and alert delivery only.
            </div>
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
            MLB now runs as a dedicated pre-game module. The series-based strategies stay separate, backtestable and easier to tune without carrying any unused live-system noise.
          </p>
          <Button>Save MLB settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
