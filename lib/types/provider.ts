export type ExternalHockeyFixture = {
  externalMatchId: string;
  externalLeagueId: string | null;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: "scheduled" | "live" | "finished";
  homeScore: number;
  awayScore: number;
  period1HomeGoals: number | null;
  period1AwayGoals: number | null;
  period2HomeGoals: number | null;
  period2AwayGoals: number | null;
  bookmaker: string | null;
  odds: number | null;
  source: string;
  rawPayload: Record<string, unknown>;
};

export interface HockeyApiProvider {
  readonly providerKey: string;
  readonly displayName: string;
  readonly supportsAutomaticTriggers: boolean;
  supportsLeague(league: string): boolean;
  getUpcomingFixtures(leagues: string[]): Promise<ExternalHockeyFixture[]>;
}
