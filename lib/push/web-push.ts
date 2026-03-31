import webpush from "web-push";
import { getWebPushEnv } from "@/lib/supabase/env";
import type { PushSubscriptionRecord } from "@/lib/types/database";

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
};

export type WebPushReadiness = {
  ok: boolean;
  summary: "Config Missing" | "Invalid Response";
  details: string;
  provider: "web-push";
};

export type WebPushDeliveryResult = {
  provider: "web-push";
  sentCount: number;
  failedCount: number;
  revokedEndpoints: string[];
  reason: string | null;
};

export function parsePushSubscription(input: PushSubscriptionJSON) {
  const p256dh = input.keys?.p256dh;
  const auth = input.keys?.auth;

  if (!input.endpoint || !p256dh || !auth) {
    throw new Error("Incomplete push subscription payload.");
  }

  return {
    endpoint: input.endpoint,
    p256dh,
    auth,
    expiration_time: input.expirationTime ? new Date(input.expirationTime).toISOString() : null,
  };
}

export function toSubscriptionInsert(record: ReturnType<typeof parsePushSubscription>, userId: string, userAgent?: string | null) {
  return {
    user_id: userId,
    endpoint: record.endpoint,
    p256dh: record.p256dh,
    auth: record.auth,
    expiration_time: record.expiration_time,
    status: "active",
    user_agent: userAgent ?? null,
    last_seen_at: new Date().toISOString(),
  } satisfies Partial<PushSubscriptionRecord>;
}

function configureWebPush() {
  const env = getWebPushEnv();

  if (!env.publicKey || !env.privateKey) {
    return {
      ok: false,
      summary: "Config Missing" as const,
      details: "WEB_PUSH_VAPID_PUBLIC_KEY and WEB_PUSH_VAPID_PRIVATE_KEY must both be configured on the server.",
      provider: "web-push" as const,
    };
  }

  try {
    webpush.setVapidDetails(env.subject, env.publicKey, env.privateKey);
    return {
      ok: true,
      summary: "Invalid Response" as const,
      details: `Web push sender initialized with subject ${env.subject}.`,
      provider: "web-push" as const,
    };
  } catch (error) {
    return {
      ok: false,
      summary: "Invalid Response" as const,
      details: error instanceof Error ? error.message : "Unknown web push initialization error.",
      provider: "web-push" as const,
    };
  }
}

function toWebPushSubscription(subscription: PushSubscriptionRecord) {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expiration_time ? new Date(subscription.expiration_time).getTime() : null,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

export function validateWebPushConfiguration(): WebPushReadiness {
  return configureWebPush();
}

export async function sendWebPushToSubscriptions(subscriptions: PushSubscriptionRecord[], payload: WebPushPayload): Promise<WebPushDeliveryResult> {
  const readiness = configureWebPush();
  if (!readiness.ok) {
    return {
      provider: "web-push",
      sentCount: 0,
      failedCount: subscriptions.length,
      revokedEndpoints: [],
      reason: readiness.details,
    };
  }

  let sentCount = 0;
  let failedCount = 0;
  const revokedEndpoints: string[] = [];
  const failureMessages: string[] = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(toWebPushSubscription(subscription), JSON.stringify(payload));
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : null;
      const message =
        typeof error === "object" && error && "body" in error && typeof (error as { body?: unknown }).body === "string"
          ? (error as { body: string }).body
          : error instanceof Error
            ? error.message
            : "Unknown web push delivery error.";

      if (statusCode === 404 || statusCode === 410) {
        revokedEndpoints.push(subscription.endpoint);
      }

      failureMessages.push(message);
    }
  }

  return {
    provider: "web-push",
    sentCount,
    failedCount,
    revokedEndpoints,
    reason: sentCount > 0 ? null : failureMessages[0] ?? "No web push message was delivered.",
  };
}
