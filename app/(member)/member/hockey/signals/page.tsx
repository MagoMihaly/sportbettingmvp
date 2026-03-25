import Link from "next/link";
import { HockeySectionNav } from "@/components/hockey-section-nav";
import { SignalsTable } from "@/components/signals-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function HockeySignalsPage() {
  const { signals } = await getDashboardData();

  return (
    <div className="space-y-6">
      <HockeySectionNav pathname="/member/hockey/signals" />
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Hockey signals</div>
        <h1 className="text-3xl font-semibold text-white">Tracked hockey signal records</h1>
      </div>
      <Card>
        <CardHeader>
          <CardDescription>Other sports</CardDescription>
          <CardTitle>Sport-specific signal views</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm leading-7 text-slate-300">
          <Button variant="outline" asChild>
            <Link href="/member/soccer/signals">Open soccer signals</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/member/mlb/signals">Open MLB signals</Link>
          </Button>
        </CardContent>
      </Card>
      <SignalsTable signals={signals} />
    </div>
  );
}
