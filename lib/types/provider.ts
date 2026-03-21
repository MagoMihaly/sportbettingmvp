export type ExternalGameStatus = "scheduled" | "live" | "finished";

export type ExternalMarketData = {
  marketType: string;
  bookmaker: string | null;
  odds: number | null;
  source: string;
  payload: Record<string, unknown>;
};

export type ExternalHockeyGame = {
  externalMatchId: string;
  externalLeagueId: string | null;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: ExternalGameStatus;
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
  getScheduledGames(leagues: string[]): Promise<ExternalHockeyGame[]>;
  getLiveGames(leagues: string[]): Promise<ExternalHockeyGame[]>;
  getGameDetails(externalMatchId: string, league?: string): Promise<ExternalHockeyGame | null>;
  getMarketData(externalMatchId: string, marketType: string): Promise<ExternalMarketData[]>;
}
