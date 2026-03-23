import { SoccerSectionNav } from "@/components/soccer-section-nav";
import { SoccerSettingsForm } from "@/components/soccer-settings-form";
import { getSoccerDashboardData } from "@/lib/data/soccer";

export default async function SoccerSettingsPage() {
  const { settings } = await getSoccerDashboardData();

  return (
    <div className="space-y-6">
      <SoccerSectionNav pathname="/member/soccer/settings" />
      <SoccerSettingsForm settings={settings} />
    </div>
  );
}