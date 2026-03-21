import type { PushSubscriptionRecord } from "@/lib/types/database";

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
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

export async function sendWebPushPlaceholder(subscription: PushSubscriptionRecord, payload: WebPushPayload) {
  void subscription;
  void payload;
  return { sent: false, reason: "Web push delivery placeholder. Add a sender implementation or Edge Function." };
}
