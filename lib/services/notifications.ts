import type { SignalRecord, UserSettings } from "@/lib/types/database";

export type NotificationChannel = "dashboard" | "email" | "push" | "telegram" | "discord";

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

export function getEnabledNotificationChannels(settings: UserSettings | null) {
  if (!settings || !settings.notifications_enabled) {
    return ["dashboard"] as NotificationChannel[];
  }

  const channels: NotificationChannel[] = ["dashboard"];
  if (settings.email_notifications) channels.push("email");
  if (settings.push_notifications) channels.push("push");
  return channels;
}

