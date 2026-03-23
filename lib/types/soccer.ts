import type { SoccerMarketKey } from "@/lib/config/soccerMarkets";
import type { SoccerLeagueSlug } from "@/lib/config/soccerLeagues";

export type SoccerGameStatus = "scheduled" | "live" | "finished";

export type ExternalSoccerMarketData = {
  marketKey: SoccerMarketKey;
  bookmaker: string | null;
  odds: number | null;
  suspended: boolean;
  source: string;
  payload: Record<string, unknown>;
};

export type ExternalSoccerGame = {
  externalMatchId: string;
  leagueSlug: SoccerLeagueSlug | string;
  leagueName: string;
  startTime: string;
  status: SoccerGameStatus;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  halftimeHomeScore: number | null;
  halftimeAwayScore: number | null;
  minute: number | null;
  homeShots: number | null;
  awayShots: number | null;
  homeShotsOnTarget: number | null;
  awayShotsOnTarget: number | null;
  homeCorners: number | null;
  awayCorners: number | null;
  homePossession: number | null;
  awayPossession: number | null;
  source: string;
  rawPayload: Record<string, unknown>;
};

export type SoccerSignalRuleType =
  | "SOCCER_HT_0_0_OVER_1_5"
  | "SOCCER_MINUTE_60_0_0_OVER_0_5";

export type EvaluatedSoccerSignal = {
  ruleType: SoccerSignalRuleType;
  marketKey: SoccerMarketKey;
  signalKey: string;
  triggerConditionMet: boolean;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  watchState: "ht_0_0" | "minute_60_0_0";
};

export interface SoccerApiProvider {
  readonly providerKey: string;
  readonly displayName: string;
  readonly supportsAutomaticTriggers: boolean;
  supportsLeague(leagueSlug: string): boolean;
  getScheduledGames(leagueSlugs: string[]): Promise<ExternalSoccerGame[]>;
  getLiveGames(leagueSlugs: string[]): Promise<ExternalSoccerGame[]>;
  getGameDetails(externalMatchId: string, leagueSlug?: string): Promise<ExternalSoccerGame | null>;
  getMarketData(externalMatchId: string, marketKey: SoccerMarketKey): Promise<ExternalSoccerMarketData[]>;
}