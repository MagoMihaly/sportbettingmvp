import { NotificationSettingsForm } from "@/components/notification-settings-form";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function NotificationsPage() {
  const { settings } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Notifications</div>
        <h1 className="text-3xl font-semibold text-white">Alert preferences</h1>
      </div>
      <NotificationSettingsForm settings={settings} />
    </div>
  );
}

