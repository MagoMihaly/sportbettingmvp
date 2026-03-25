import type { MlbSystemKey } from "@/lib/config/mlbSystems";
import type { EvaluatedMlbSignal, ExternalMlbGame, MlbSignalRuleType } from "@/lib/types/mlb";

const DEFAULT_RULES: Array<{ ruleType: MlbSignalRuleType; marketKey: MlbSystemKey }> = [
  { ruleType: "MLB_F5_SCORELESS", marketKey: "MLB_F5_SCORELESS" },
  { ruleType: "MLB_LATE_ONE_RUN_GAME", marketKey: "MLB_LATE_ONE_RUN_GAME" },
];

function buildSignalKey(game: ExternalMlbGame, marketKey: MlbSystemKey) {
  return `${game.externalGameId}:${marketKey}`;
}

function evaluateRule(game: ExternalMlbGame, ruleType: MlbSignalRuleType) {
  if (ruleType === "MLB_F5_SCORELESS") {
    return (game.inning ?? 0) >= 5 && game.homeScore === 0 && game.awayScore === 0;
  }

  return (game.inning ?? 0) >= 7 && game.homeScore + game.awayScore <= 1;
}

export function evaluateMlbGameSignals(game: ExternalMlbGame) {
  return DEFAULT_RULES.map(({ ruleType, marketKey }) => ({
    ruleType,
    marketKey,
    signalKey: buildSignalKey(game, marketKey),
    triggerConditionMet: evaluateRule(game, ruleType),
    inning: game.inning,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    watchState: ruleType === "MLB_F5_SCORELESS" ? "f5-scoreless" : "late-one-run-game",
  })) satisfies EvaluatedMlbSignal[];
}

export function getTriggeredMlbSignals(game: ExternalMlbGame) {
  return evaluateMlbGameSignals(game).filter((signal) => signal.triggerConditionMet);
}
