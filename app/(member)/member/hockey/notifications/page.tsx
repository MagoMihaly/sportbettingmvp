import Link from "next/link";
import { HockeySectionNav } from "@/components/hockey-section-nav";
import { NotificationSettingsForm } from "@/components/notification-settings-form";
import { PushSubscriptionCard } from "@/components/push-subscription-card";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function HockeyNotificationsPage() {
  const { pushSubscriptions, settings } = await getDashboardData();

  return (
    <div className="space-y-6">
      <HockeySectionNav pathname="/member/hockey/notifications" />
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Hockey notifications</div>
        <h1 className="text-3xl font-semibold text-white">Alert preferences</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/member/soccer/settings">Soccer notification settings</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/member/mlb/settings">MLB notification settings</Link>
        </Button>
      </div>
      <NotificationSettingsForm settings={settings} />
      <PushSubscriptionCard subscriptions={pushSubscriptions} pushEnabled={settings?.push_notifications ?? false} />
    </div>
  );
}
