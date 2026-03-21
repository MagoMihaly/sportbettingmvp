"use client";

import { Bell, Radio } from "lucide-react";
import { useAlertsFeed } from "@/hooks/use-alerts-feed";
import { formatDateTime } from "@/lib/utils";
import type { AlertRecord } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function statusVariant(status: AlertRecord["status"]) {
  if (status === "sent" || status === "read") return "success" as const;
  if (status === "failed") return "danger" as const;
  if (status === "pending" || status === "queued") return "warning" as const;
  return "neutral" as const;
}

export function RealtimeAlertsFeed({
  initialAlerts,
  userId,
  isDemo,
}: {
  initialAlerts: AlertRecord[];
  userId: string;
  isDemo: boolean;
}) {
  const alerts = useAlertsFeed(initialAlerts, userId, !isDemo);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardDescription>Realtime alerts</CardDescription>
            <CardTitle>Recent alert feed</CardTitle>
          </div>
          <Badge variant={isDemo ? "neutral" : "info"}>
            <Radio className="mr-1 h-3.5 w-3.5" />
            {isDemo ? "Demo feed" : "Realtime ready"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            No alerts yet. Once the evaluator creates alerts, this feed updates automatically.
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-medium text-white">{alert.title}</div>
                <Badge variant={statusVariant(alert.status)}>{alert.status}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{alert.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Bell className="h-3.5 w-3.5" />{alert.channel}</span>
                <span>{formatDateTime(alert.created_at)}</span>
                <span>{alert.alert_type}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
