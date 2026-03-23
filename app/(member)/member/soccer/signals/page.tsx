import { SoccerSectionNav } from "@/components/soccer-section-nav";
import { SoccerSignalsTable } from "@/components/soccer-signals-table";
import { getSoccerDashboardData } from "@/lib/data/soccer";

export default async function SoccerSignalsPage() {
  const { alerts, liveSignals, oddsSnapshots } = await getSoccerDashboardData();

  return (
    <div className="space-y-6">
      <SoccerSectionNav pathname="/member/soccer/signals" />
      <SoccerSignalsTable liveSignals={liveSignals} alerts={alerts} oddsSnapshots={oddsSnapshots} />
    </div>
  );
}