import { MlbPregameSignalsTable } from "@/components/mlb-pregame-signals-table";
import { MlbSectionNav } from "@/components/mlb-section-nav";
import { getMlbDashboardData } from "@/lib/data/mlb";

export default async function MlbSignalsPage() {
  const { games, pregameSignals } = await getMlbDashboardData();

  return (
    <div className="space-y-6">
      <MlbSectionNav pathname="/member/mlb/signals" />
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-amber-300">MLB signals</div>
        <h1 className="text-3xl font-semibold text-white">Tracked MLB pre-game signals</h1>
      </div>
      <MlbPregameSignalsTable games={games} pregameSignals={pregameSignals} />
    </div>
  );
}
