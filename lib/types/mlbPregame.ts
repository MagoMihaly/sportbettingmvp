import type { MlbPregameStrategyKey } from "@/lib/config/mlbPregameStrategies";
import type { MlbGameRecord, MlbOddsSnapshotRecord } from "@/lib/types/database";

export type MlbTeamSide = "home" | "away";
export type MlbSignalDirection = "favorite" | "underdog";
export type MlbPregameEvaluationStatus = "candidate" | "qualified" | "skipped";
export type MlbSeriesGameNumber = 2 | 3;

export type MlbPriceSnapshot = {
  homeOdds: number | null;
  awayOdds: number | null;
  favoriteSide: MlbTeamSide | null;
  underdogSide: MlbTeamSide | null;
  favoriteOdds: number | null;
  underdogOdds: number | null;
};

export type MlbStarterSnapshot = {
  homeStarter: string | null;
  awayStarter: string | null;
  homeRating: number | null;
  awayRating: number | null;
  severeDisadvantageSide: MlbTeamSide | null;
};

export type MlbSeriesContext = {
  seriesKey: string;
  seriesGameNumber: MlbSeriesGameNumber;
  scheduledGame: MlbGameRecord;
  priorGames: MlbGameRecord[];
  currentPrices: MlbPriceSnapshot;
  priorPrices: MlbPriceSnapshot[];
  currentStarters: MlbStarterSnapshot;
  locationContinuity: boolean;
  doubleheaderDetected: boolean;
  divisionMatchup: boolean | null;
  getawayDay: boolean | null;
  travelFlag: boolean | null;
  taxedBullpenSide: MlbTeamSide | null;
  oddsSnapshots: MlbOddsSnapshotRecord[];
};

export type MlbPregameSignalEvaluation = {
  strategyId: MlbPregameStrategyKey;
  signalKey: string;
  seriesKey: string;
  seriesGameNumber: MlbSeriesGameNumber;
  marketType: "moneyline";
  signalTeam: string;
  signalTeamSide: MlbTeamSide;
  signalDirection: MlbSignalDirection;
  evaluationStatus: MlbPregameEvaluationStatus;
  odds: number | null;
  reasonSummary: string;
  skipReason: string | null;
  filtersPassed: string[];
  filtersFailed: string[];
  qualitySignals: string[];
  sourceProvider: string;
  payload: Record<string, unknown>;
};
