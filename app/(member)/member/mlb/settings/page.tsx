import { MlbSectionNav } from "@/components/mlb-section-nav";
import { MlbSettingsForm } from "@/components/mlb-settings-form";
import { getMlbDashboardData } from "@/lib/data/mlb";

export default async function MlbSettingsPage() {
  const { settings } = await getMlbDashboardData();

  return (
    <div className="space-y-6">
      <MlbSectionNav pathname="/member/mlb/settings" />
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-amber-300">MLB settings</div>
        <h1 className="text-3xl font-semibold text-white">MLB pre-game strategies and alerts</h1>
      </div>
      <MlbSettingsForm settings={settings} />
    </div>
  );
}
