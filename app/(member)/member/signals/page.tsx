import { SignalsTable } from "@/components/signals-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function SignalsPage() {
  const { signals } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Signals</div>
        <h1 className="text-3xl font-semibold text-white">Tracked signal records</h1>
      </div>
      <Card>
        <CardHeader>
          <CardDescription>Input policy</CardDescription>
          <CardTitle>Automatic signal ingestion only</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-slate-300">
          Manual signal creation is disabled. New rows are expected to be created by the provider ingest and trigger evaluation pipeline.
        </CardContent>
      </Card>
      <SignalsTable signals={signals} />
    </div>
  );
}
