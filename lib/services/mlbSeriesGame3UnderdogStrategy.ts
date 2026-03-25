import type { MlbPregameSignalEvaluation } from "@/lib/types/mlbPregame";
import type { MlbSeriesContext } from "@/lib/types/mlbPregame";
import { getRunDifferential, getTeamBySide, getWinnerSide } from "@/lib/services/mlbPregameShared";

const STRATEGY_ID = "MLB_SERIES_G3_UNDERDOG" as const;

function buildReasonSummary(evaluationStatus: MlbPregameSignalEvaluation["evaluationStatus"], parts: string[]) {
  if (evaluationStatus === "qualified") {
    return `Game 3 underdog qualified: ${parts.join("; ")}.`;
  }

  if (evaluationStatus === "candidate") {
    return `Game 3 underdog candidate: ${parts.join("; ")}.`;
  }

  return `Game 3 underdog skipped: ${parts.join("; ")}.`;
}

export function evaluateMlbSeriesGame3UnderdogStrategy(context: MlbSeriesContext): MlbPregameSignalEvaluation | null {
  if (context.seriesGameNumber !== 3 || context.priorGames.length < 2) {
    return null;
  }

  const filtersPassed: string[] = [];
  const filtersFailed: string[] = [];
  const qualitySignals: string[] = [];

  if (!context.locationContinuity) {
    filtersFailed.push("Series venue continuity broke before Game 3.");
  } else {
    filtersPassed.push("Clean same-venue series");
  }

  if (context.doubleheaderDetected) {
    filtersFailed.push("Series chain contains a doubleheader date.");
  } else {
    filtersPassed.push("No doubleheader distortion");
  }

  if (!context.currentPrices.underdogSide || context.currentPrices.underdogOdds === null || context.currentPrices.favoriteOdds === null) {
    filtersFailed.push("Current game favorite/underdog price could not be resolved.");
  } else {
    filtersPassed.push("Current favorite and underdog prices resolved");
  }

  if (context.currentPrices.underdogOdds !== null && (context.currentPrices.underdogOdds < 2 || context.currentPrices.underdogOdds > 2.55)) {
    filtersFailed.push("Underdog price sits outside the playable Game 3 range.");
  } else if (context.currentPrices.underdogOdds !== null) {
    filtersPassed.push("Underdog price stays in the disciplined range");
  }

  if (context.currentPrices.favoriteOdds !== null && context.currentPrices.favoriteOdds < 1.45) {
    filtersFailed.push("Favorite price is too short for a controlled Game 3 underdog setup.");
  }

  if (!context.currentStarters.homeStarter || !context.currentStarters.awayStarter) {
    filtersFailed.push("Probable starters are missing.");
  } else {
    filtersPassed.push("Probable starters confirmed");
  }

  if (context.currentPrices.underdogSide && context.currentStarters.severeDisadvantageSide === context.currentPrices.underdogSide) {
    filtersFailed.push("Underdog starter carries a severe mismatch flag.");
  }

  const priorWinners = context.priorGames.map(getWinnerSide);
  const priorFavoriteSides = context.priorPrices.map((price) => price.favoriteSide);

  if (priorWinners.some((winner) => winner === null) || priorFavoriteSides.some((side) => side === null)) {
    filtersFailed.push("First two games do not have reliable finished-state favorite data.");
  } else if (!priorWinners.every((winner, index) => winner === priorFavoriteSides[index])) {
    filtersFailed.push("The favorite did not win both of the first two games.");
  } else {
    filtersPassed.push("Favorites won the first two games");
  }

  const priorMargins = context.priorGames.map(getRunDifferential);
  if (priorMargins.some((margin) => margin === null)) {
    filtersFailed.push("Prior games do not have a reliable run differential.");
  } else {
    const numericMargins = priorMargins as number[];
    if (numericMargins.some((margin) => margin > 4)) {
      filtersFailed.push("At least one favorite win was too comfortable for a sweep-avoidance angle.");
    } else if (numericMargins.reduce((sum, margin) => sum + margin, 0) > 7) {
      filtersFailed.push("Combined run differential is too wide.");
    } else {
      filtersPassed.push("Prior game margins stayed inside the controlled band");
      if (numericMargins.some((margin) => margin <= 2)) {
        qualitySignals.push("At least one prior game stayed close");
      }
    }
  }

  if (context.currentPrices.underdogSide === "home") {
    qualitySignals.push("Underdog keeps home field for Game 3");
  }

  if (context.divisionMatchup) {
    qualitySignals.push("Division familiarity reduces matchup noise");
  }

  if (context.taxedBullpenSide && context.taxedBullpenSide === context.currentPrices.favoriteSide) {
    qualitySignals.push("Favorite bullpen shows carry-over workload");
  }

  if (context.getawayDay) {
    qualitySignals.push("Getaway-day spot can weaken favorite urgency");
  }

  const signalSide = context.currentPrices.underdogSide ?? "away";
  const signalTeam = getTeamBySide(context.scheduledGame, signalSide);
  const evaluationStatus: MlbPregameSignalEvaluation["evaluationStatus"] =
    filtersFailed.length > 0 ? "skipped" : qualitySignals.length > 0 ? "qualified" : "candidate";

  const reasonParts =
    evaluationStatus === "qualified"
      ? [...filtersPassed.slice(0, 3), ...qualitySignals.slice(0, 2)]
      : evaluationStatus === "candidate"
        ? [...filtersPassed.slice(0, 3), "No quality boost confirmed yet"]
        : [filtersFailed[0] ?? "Core Game 3 underdog conditions were not met"];

  return {
    strategyId: STRATEGY_ID,
    signalKey: `${context.scheduledGame.external_game_id}:${STRATEGY_ID}`,
    seriesKey: context.seriesKey,
    seriesGameNumber: 3,
    marketType: "moneyline",
    signalTeam,
    signalTeamSide: signalSide,
    signalDirection: "underdog",
    evaluationStatus,
    odds: context.currentPrices.underdogOdds,
    reasonSummary: buildReasonSummary(evaluationStatus, reasonParts),
    skipReason: evaluationStatus === "skipped" ? filtersFailed[0] ?? "Unknown skip rule" : null,
    filtersPassed,
    filtersFailed,
    qualitySignals,
    sourceProvider: context.scheduledGame.provider,
    payload: {
      scheduledGameId: context.scheduledGame.id,
      priorGameIds: context.priorGames.map((game) => game.id),
      currentPrices: context.currentPrices,
      currentStarters: context.currentStarters,
      divisionMatchup: context.divisionMatchup,
      getawayDay: context.getawayDay,
      taxedBullpenSide: context.taxedBullpenSide,
    },
  };
}
