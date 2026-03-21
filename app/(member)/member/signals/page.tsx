import { AddSignalForm } from "@/components/add-signal-form";
import { SignalsTable } from "@/components/signals-table";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function SignalsPage() {
  const { signals } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Signals</div>
        <h1 className="text-3xl font-semibold text-white">Tracked signal records</h1>
      </div>
      <AddSignalForm />
      <SignalsTable signals={signals} />
    </div>
  );
}

