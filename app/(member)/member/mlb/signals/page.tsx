import { MlbSectionNav } from "@/components/mlb-section-nav";
import { MlbSignalsTable } from "@/components/mlb-signals-table";
import { getMlbDashboardData } from "@/lib/data/mlb";

export default async function MlbSignalsPage() {
  const { games, liveSignals, oddsSnapshots } = await getMlbDashboardData();

  return (
    <div className="space-y-6">
      <MlbSectionNav pathname="/member/mlb/signals" />
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-amber-300">MLB signals</div>
        <h1 className="text-3xl font-semibold text-white">Tracked MLB signal records</h1>
      </div>
      <MlbSignalsTable games={games} liveSignals={liveSignals} oddsSnapshots={oddsSnapshots} />
    </div>
  );
}
