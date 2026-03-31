import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPushToSubscriptions, validateWebPushConfiguration } from "@/lib/push/web-push";
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

function resolveAlertUrl(alert: Pick<AlertRecord, "payload">) {
  const payload = alert.payload ?? {};
  const sport = typeof payload.sport === "string" ? payload.sport : "hockey";

  switch (sport) {
    case "soccer":
      return "/member/soccer";
    case "mlb":
      return "/member/mlb";
    default:
      return "/member/hockey";
  }
}

export function validatePushDeliverySetup() {
  return validateWebPushConfiguration();
}

export async function sendPushMessageToUser(params: {
  userId: string;
  title: string;
  message: string;
  url?: string;
}) {
  const readiness = validateWebPushConfiguration();
  if (!readiness.ok) {
    return {
      delivered: false,
      provider: readiness.provider,
      sentCount: 0,
      failedCount: 0,
      revokedCount: 0,
      reason: readiness.details,
    };
  }

  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", params.userId)
    .eq("status", "active");

  if (error) {
    return {
      delivered: false,
      provider: "web-push" as const,
      sentCount: 0,
      failedCount: 0,
      revokedCount: 0,
      reason: error.message,
    };
  }

  const activeSubscriptions = (subscriptions ?? []) as PushSubscriptionRecord[];
  if (activeSubscriptions.length === 0) {
    return {
      delivered: false,
      provider: "web-push" as const,
      sentCount: 0,
      failedCount: 0,
      revokedCount: 0,
      reason: "No active push subscriptions are stored for this user.",
    };
  }

  const result = await sendWebPushToSubscriptions(activeSubscriptions, {
    title: params.title,
    body: params.message,
    url: params.url ?? "/member",
  });

  if (result.revokedEndpoints.length > 0) {
    await admin
      .from("push_subscriptions")
      .update({ status: "revoked", last_seen_at: new Date().toISOString() })
      .eq("user_id", params.userId)
      .in("endpoint", result.revokedEndpoints);
  }

  return {
    delivered: result.sentCount > 0,
    provider: result.provider,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
    revokedCount: result.revokedEndpoints.length,
    reason: result.reason,
  };
}

export async function deliverPushAlert(alert: AlertRecord) {
  return sendPushMessageToUser({
    userId: alert.user_id,
    title: alert.title,
    message: alert.body,
    url: resolveAlertUrl(alert),
  });
}

export async function sendTestPushToUser(userId: string) {
  return sendPushMessageToUser({
    userId,
    title: "Signal Ops test push",
    message: "Browser push is configured correctly and can deliver notifications to this device.",
    url: "/member/diagnostics",
  });
}
