import { priorityLeagues } from "@/lib/config/leagues";
import { updateLeagueSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LeagueSettingsForm({ selectedLeagues }: { selectedLeagues: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Priority market coverage</CardDescription>
        <CardTitle>League settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateLeagueSettingsAction} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {priorityLeagues.map((league) => (
              <label key={league} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <input type="checkbox" name="selected_leagues" value={league} defaultChecked={selectedLeagues.includes(league)} className="h-4 w-4 rounded border-white/10 bg-slate-950" />
                <span>{league}</span>
              </label>
            ))}
          </div>
          <Button>Save league settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}

