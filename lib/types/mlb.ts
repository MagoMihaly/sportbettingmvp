export type MlbGameStatus = "scheduled" | "live" | "finished";

export type ExternalMlbGame = {
  externalGameId: string;
  leagueName: string;
  startTime: string;
  status: MlbGameStatus;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  inning: number | null;
  halfInning: "top" | "bottom" | null;
  homeHits: number | null;
  awayHits: number | null;
  homeErrors: number | null;
  awayErrors: number | null;
  source: string;
  rawPayload: Record<string, unknown>;
};

export interface MlbApiProvider {
  readonly providerKey: string;
  readonly displayName: string;
  readonly supportsAutomaticTriggers: boolean;
  getScheduledGames(): Promise<ExternalMlbGame[]>;
  getLiveGames(): Promise<ExternalMlbGame[]>;
  getGameDetails(externalGameId: string): Promise<ExternalMlbGame | null>;
}
