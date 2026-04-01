import type { SoccerMarketKey } from "@/lib/config/soccerMarkets";
import type { ExternalSoccerGame, EvaluatedSoccerSignal, SoccerSignalRuleType } from "@/lib/types/soccer";

const DEFAULT_RULES: Array<{ ruleType: SoccerSignalRuleType; marketKey: SoccerMarketKey }> = [
  { ruleType: "SOCCER_HT_0_0_OVER_1_5", marketKey: "H2_2H_OVER_1_5" },
  { ruleType: "SOCCER_MINUTE_60_0_0_OVER_0_5", marketKey: "H3_REMAINING_OVER_0_5" },
];

function buildSignalKey(game: ExternalSoccerGame, marketKey: SoccerMarketKey) {
  return `${game.externalMatchId}:${marketKey}`;
}

function evaluateRule(game: ExternalSoccerGame, ruleType: SoccerSignalRuleType) {
  if (ruleType === "SOCCER_HT_0_0_OVER_1_5") {
    return game.halftimeHomeScore === 0 && game.halftimeAwayScore === 0;
  }

  return (game.minute ?? 0) >= 60 && game.homeScore === 0 && game.awayScore === 0;
}

export function evaluateSoccerGameSignals(game: ExternalSoccerGame) {
  return DEFAULT_RULES.map(({ ruleType, marketKey }) => ({
    ruleType,
    marketKey,
    signalKey: buildSignalKey(game, marketKey),
    triggerConditionMet: evaluateRule(game, ruleType),
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    minute: game.minute,
    watchState: ruleType === "SOCCER_HT_0_0_OVER_1_5" ? "ht_0_0" : "minute_60_0_0",
  })) satisfies EvaluatedSoccerSignal[];
}

export function getTriggeredSoccerSignals(game: ExternalSoccerGame) {
  return evaluateSoccerGameSignals(game).filter((signal) => signal.triggerConditionMet);
}

export function getSoccerDataQualityFlags(game: ExternalSoccerGame, oddsAvailable = true) {
  const flags: Array<{ code: string; severity: "info" | "warning" | "critical"; message: string }> = [];

  if (game.halftimeHomeScore === null || game.halftimeAwayScore === null) {
    flags.push({ code: "MISSING_HALFTIME_SCORE", severity: "warning", message: "Halftime score missing for H2 evaluation." });
  }

  if (game.minute === null) {
    flags.push({ code: "MISSING_LIVE_MINUTE", severity: "warning", message: "Live minute missing for H3 evaluation." });
  }

  if (!oddsAvailable) {
    flags.push({
      code: "ODDS_NOT_AVAILABLE_FOR_PROVIDER",
      severity: "warning",
      message: "The active soccer provider is not supplying supported odds data for this game in the current setup.",
    });
  }

  return flags;
}
