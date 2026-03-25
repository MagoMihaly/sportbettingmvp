import type { MlbSystemKey } from "@/lib/config/mlbSystems";

export type MlbGameStatus = "scheduled" | "live" | "finished";

export type ExternalMlbMarketData = {
  marketKey: MlbSystemKey;
  bookmaker: string | null;
  odds: number | null;
  suspended: boolean;
  source: string;
  payload: Record<string, unknown>;
};

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

export type MlbSignalRuleType = "MLB_F5_SCORELESS" | "MLB_LATE_ONE_RUN_GAME";

export type EvaluatedMlbSignal = {
  ruleType: MlbSignalRuleType;
  marketKey: MlbSystemKey;
  signalKey: string;
  triggerConditionMet: boolean;
  inning: number | null;
  homeScore: number;
  awayScore: number;
  watchState: "f5-scoreless" | "late-one-run-game";
};

export interface MlbApiProvider {
  readonly providerKey: string;
  readonly displayName: string;
  readonly supportsAutomaticTriggers: boolean;
  getScheduledGames(): Promise<ExternalMlbGame[]>;
  getLiveGames(): Promise<ExternalMlbGame[]>;
  getGameDetails(externalGameId: string): Promise<ExternalMlbGame | null>;
  getMarketData(externalGameId: string, marketKey: MlbSystemKey): Promise<ExternalMlbMarketData[]>;
}
