import { LeagueSettingsForm } from "@/components/league-settings-form";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function LeaguesPage() {
  const { settings } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Leagues</div>
        <h1 className="text-3xl font-semibold text-white">Priority league watchlist</h1>
      </div>
      <LeagueSettingsForm selectedLeagues={settings?.selected_leagues ?? []} />
    </div>
  );
}

