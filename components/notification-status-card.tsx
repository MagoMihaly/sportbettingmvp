import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function NotificationStatusCard({ status, triggeredSignals }: { status: string; triggeredSignals: number }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Notification readiness</CardDescription>
        <CardTitle>Alert state</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge variant={status === "Armed" ? "success" : "warning"}>{status}</Badge>
        <p className="text-sm leading-7 text-slate-300">
          The MVP notification layer is prepared for dashboard, email, push and webhook-style channels. Current triggered signal count: {triggeredSignals}.
        </p>
      </CardContent>
    </Card>
  );
}

