import type { AlertRecord, MlbUserSettings, PushSubscriptionRecord, SignalRecord, SoccerUserSettings, UserSettings } from "@/lib/types/database";

export type NotificationChannel = "dashboard" | "email" | "push" | "telegram" | "discord";

type NotificationSettingsLike =
  | Pick<UserSettings, "notifications_enabled" | "email_notifications" | "push_notifications">
  | Pick<SoccerUserSettings, "notifications_enabled" | "email_notifications" | "push_notifications">
  | Pick<MlbUserSettings, "notifications_enabled" | "email_notifications" | "push_notifications">;

export type NotificationPayload = {
  channel: NotificationChannel;
  title: string;
  message: string;
};

export function buildTriggeredSignalNotification(signal: SignalRecord): NotificationPayload[] {
  const baseMessage = `${signal.selected_team} is eligible for a 3rd period trigger in ${signal.league}.`;

  return [
    {
      channel: "dashboard",
      title: "Triggered signal",
      message: baseMessage,
    },
  ];
}

export function buildAlertDeliveryPayload(alert: AlertRecord): NotificationPayload {
  return {
    channel: alert.channel as NotificationChannel,
    title: alert.title,
    message: alert.body,
  };
}

export function getEnabledNotificationChannels(settings: NotificationSettingsLike | null) {
  if (!settings || !settings.notifications_enabled) {
    return ["dashboard"] as NotificationChannel[];
  }

  const channels: NotificationChannel[] = ["dashboard"];
  if (settings.email_notifications) channels.push("email");
  if (settings.push_notifications) channels.push("push");
  return channels;
}

export function canDeliverPush(settings: NotificationSettingsLike | null, subscriptions: PushSubscriptionRecord[]) {
  return Boolean(settings?.notifications_enabled && settings?.push_notifications && subscriptions.some((subscription) => subscription.status === "active"));
}

export async function deliverAlertPlaceholder(alert: AlertRecord) {
  void alert;
  return { delivered: false, provider: "placeholder" };
}
