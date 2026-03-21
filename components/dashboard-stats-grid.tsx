import { BellRing, ChartNoAxesColumn, CircleAlert, Trophy, Waves } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types/dashboard";

const statConfig = [
  { key: "totalSignals", label: "Total signals", icon: ChartNoAxesColumn },
  { key: "activeLeagues", label: "Watched leagues", icon: Waves },
  { key: "triggeredSignals", label: "Triggered", icon: CircleAlert },
  { key: "wonSignals", label: "Won", icon: Trophy },
  { key: "pendingSignals", label: "Pending", icon: BellRing },
] as const;

export function DashboardStatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {statConfig.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="mt-2 text-3xl">{stats[key]}</CardTitle>
            </div>
            <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
              <Icon className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
