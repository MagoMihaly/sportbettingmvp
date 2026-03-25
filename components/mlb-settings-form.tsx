import { mlbSystems } from "@/lib/config/mlbSystems";
import { updateMlbSettingsAction } from "@/actions/mlb-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MlbUserSettings } from "@/lib/types/database";

export function MlbSettingsForm({ settings }: { settings: MlbUserSettings | null }) {
  const selectedSystems = settings?.selected_systems ?? mlbSystems.map((system) => system.key);

  return (
    <Card>
      <CardHeader>
        <CardDescription>MLB signal controls</CardDescription>
        <CardTitle>MLB watchlist and alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateMlbSettingsAction} className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-200">Active systems</div>
            <div className="grid gap-3 md:grid-cols-2">
              {mlbSystems.map((system) => (
                <label key={system.key} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" name="selected_systems" value={system.key} defaultChecked={selectedSystems.includes(system.key)} className="h-4 w-4 rounded border-white/10 bg-slate-950" />
                    <span>{system.label}</span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{system.description}</p>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Preferred market</span>
              <select name="preferred_market_key" defaultValue={settings?.preferred_market_key ?? "MLB_F5_SCORELESS"} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white">
                {mlbSystems.map((system) => (
                  <option key={system.key} value={system.key}>{system.label}</option>
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
            MLB runs in mock-safe mode by default so the multi-sport pipeline stays testable without adding a new provider before we actually need it.
          </p>
          <Button>Save MLB settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
