import { updateNotificationSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserSettings } from "@/lib/types/database";

export function NotificationSettingsForm({ settings }: { settings: UserSettings | null }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Alert delivery controls</CardDescription>
        <CardTitle>Notification settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateNotificationSettingsAction} className="space-y-4">
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <span>Notifications enabled</span>
            <input type="checkbox" name="notifications_enabled" defaultChecked={settings?.notifications_enabled ?? true} />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <span>Email alerts</span>
            <input type="checkbox" name="email_notifications" defaultChecked={settings?.email_notifications ?? true} />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <span>Push alerts</span>
            <input type="checkbox" name="push_notifications" defaultChecked={settings?.push_notifications ?? false} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Timezone</span>
              <input name="timezone" defaultValue={settings?.timezone ?? "Europe/Budapest"} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Preferred market type</span>
              <input name="preferred_market_type" defaultValue={settings?.preferred_market_type ?? "3rd period team goal"} className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white" />
            </label>
          </div>
          <p className="text-sm leading-6 text-slate-400">
            Push delivery is saved separately through the browser subscription step below. This form controls whether alerts are eligible for delivery.
          </p>
          <Button>Save notification settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
