"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PushSubscriptionRecord } from "@/lib/types/database";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = globalThis.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushSubscriptionCard({
  subscriptions,
  pushEnabled,
}: {
  subscriptions: PushSubscriptionRecord[];
  pushEnabled: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("Idle");
  const supported = typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
  const activeCount = subscriptions.filter((entry) => entry.status === "active").length;

  async function enablePush() {
    try {
      setStatus("Checking permission...");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Push permission was not granted.");
        return;
      }

      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const publicKeyResponse = await fetch("/api/push/public-key", { cache: "no-store" });
      const publicKeyPayload = (await publicKeyResponse.json()) as { publicKey?: string; error?: string };
      const publicKey = publicKeyPayload.publicKey ?? "";

      if (!publicKeyResponse.ok || !publicKey) {
        setStatus(publicKeyPayload.error ?? "Missing WEB_PUSH_VAPID_PUBLIC_KEY on the server.");
        return;
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(payload?.error ?? "Failed to store the push subscription.");
        return;
      }

      setStatus("Push subscription saved.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected push subscription error.");
    }
  }

  async function disablePush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();

      const response = await fetch("/api/push/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription?.endpoint ?? null }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(payload?.error ?? "Failed to remove the stored push subscription.");
        return;
      }

      setStatus("Push subscription removed.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected unsubscribe error.");
    }
  }

  async function sendTestPush() {
    try {
      setStatus("Sending test push...");
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; sentCount?: number; revokedCount?: number } | null;
      if (!response.ok) {
        setStatus(payload?.error ?? "Test push failed.");
        return;
      }

      setStatus(`Test push sent to ${payload?.sentCount ?? 0} device(s).${(payload?.revokedCount ?? 0) > 0 ? ` Revoked ${payload?.revokedCount} stale subscription(s).` : ""}`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected test push error.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Web push readiness</CardDescription>
        <CardTitle>Browser push subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Capability</div>
            <div className="mt-2 flex items-center gap-2 text-white"><ShieldCheck className="h-4 w-4 text-cyan-300" />{supported ? "Supported" : "Unavailable"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Saved subscriptions</div>
            <div className="mt-2 flex items-center gap-2 text-white"><Smartphone className="h-4 w-4 text-cyan-300" />{activeCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Preference</div>
            <div className="mt-2 flex items-center gap-2 text-white"><BellRing className="h-4 w-4 text-cyan-300" />{pushEnabled ? "Push enabled" : "Push muted"}</div>
          </div>
        </div>
        <p className="text-sm leading-6 text-slate-400">
          This stores the browser subscription in Supabase and keeps the project ready for later Web Push, Edge Function or provider-based delivery.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={enablePush} disabled={!supported}>Enable browser push</Button>
          <Button type="button" variant="secondary" onClick={sendTestPush} disabled={!supported || activeCount === 0}>Send test push</Button>
          <Button type="button" variant="outline" onClick={disablePush} disabled={!supported}>Remove subscription</Button>
        </div>
        <div className="text-sm text-slate-400">{status}</div>
      </CardContent>
    </Card>
  );
}
