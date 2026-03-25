import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SportOverviewCard({
  label,
  description,
  accentVariant,
  statusLabel,
  notificationsEnabled,
  summaryItems,
  href,
  settingsHref,
  toggleAction,
}: {
  label: string;
  description: string;
  accentVariant: "info" | "success" | "warning";
  statusLabel: string;
  notificationsEnabled: boolean;
  summaryItems: Array<{ label: string; value: string | number }>;
  href: string;
  settingsHref: string;
  toggleAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle>{statusLabel}</CardTitle>
          </div>
          <Badge variant={accentVariant}>{notificationsEnabled ? "Signals on" : "Signals off"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-7 text-slate-300">{description}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
              <div className="mt-2 text-base font-medium text-white">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={href}>Open workspace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={settingsHref}>Open settings</Link>
          </Button>
          <form action={toggleAction}>
            <input type="hidden" name="enabled" value={notificationsEnabled ? "false" : "true"} />
            <Button variant="ghost">{notificationsEnabled ? "Mute signals" : "Enable signals"}</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
