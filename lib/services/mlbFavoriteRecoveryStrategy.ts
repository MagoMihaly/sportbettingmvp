import type { MlbPregameSignalEvaluation, MlbSeriesContext } from "@/lib/types/mlbPregame";
import { getExtraInningsFlag, getRunDifferential, getTeamBySide, getWinnerSide } from "@/lib/services/mlbPregameShared";

const STRATEGY_ID = "MLB_FAVORITE_RECOVERY" as const;

function buildReasonSummary(evaluationStatus: MlbPregameSignalEvaluation["evaluationStatus"], parts: string[]) {
  if (evaluationStatus === "qualified") {
    return `Favorite recovery qualified: ${parts.join("; ")}.`;
  }

  if (evaluationStatus === "candidate") {
    return `Favorite recovery candidate: ${parts.join("; ")}.`;
  }

  return `Favorite recovery skipped: ${parts.join("; ")}.`;
}

export function evaluateMlbFavoriteRecoveryStrategy(context: MlbSeriesContext): MlbPregameSignalEvaluation | null {
  if (context.seriesGameNumber !== 2 && context.seriesGameNumber !== 3) {
    return null;
  }

  const filtersPassed: string[] = [];
  const filtersFailed: string[] = [];
  const qualitySignals: string[] = [];
  const [game1, game2] = context.priorGames;
  const game1Prices = context.priorPrices[0];

  if (!game1 || !game1Prices) {
    return null;
  }

  if (!context.locationContinuity) {
    filtersFailed.push("Series venue continuity broke before the recovery spot.");
  } else {
    filtersPassed.push("Clean same-venue series");
  }

  if (context.doubleheaderDetected) {
    filtersFailed.push("Series chain contains a doubleheader date.");
  } else {
    filtersPassed.push("No doubleheader distortion");
  }

  const game1Winner = getWinnerSide(game1);
  if (!game1Winner || !game1Prices.favoriteSide) {
    filtersFailed.push("Game 1 favorite and winner could not be validated.");
  } else if (game1Winner === game1Prices.favoriteSide) {
    filtersFailed.push("Game 1 was not an underdog upset.");
  } else {
    filtersPassed.push("Game 1 upset is confirmed");
  }

  const game1Margin = getRunDifferential(game1);
  if (game1Margin === null) {
    filtersFailed.push("Game 1 run differential is missing.");
  } else if (game1Margin > 3) {
    filtersFailed.push("Game 1 upset was too decisive for a recovery angle.");
  } else {
    filtersPassed.push("Game 1 upset stayed inside the controlled margin band");
  }

  if (!context.currentPrices.favoriteSide || context.currentPrices.favoriteOdds === null) {
    filtersFailed.push("Current game favorite price could not be resolved.");
  } else {
    filtersPassed.push("Current favorite price resolved");
  }

  if (context.currentPrices.favoriteOdds !== null && (context.currentPrices.favoriteOdds < 1.53 || context.currentPrices.favoriteOdds > 1.87)) {
    filtersFailed.push("Current favorite price is outside the disciplined recovery range.");
  } else if (context.currentPrices.favoriteOdds !== null) {
    filtersPassed.push("Current favorite price stays disciplined");
  }

  if (!context.currentStarters.homeStarter || !context.currentStarters.awayStarter) {
    filtersFailed.push("Probable starters are missing.");
  } else {
    filtersPassed.push("Probable starters confirmed");
  }

  if (context.currentPrices.favoriteSide && context.currentStarters.severeDisadvantageSide === context.currentPrices.favoriteSide) {
    filtersFailed.push("Favorite starter carries a severe mismatch flag.");
  }

  if (context.seriesGameNumber === 3) {
    if (!game2) {
      filtersFailed.push("Game 2 result is missing for the Game 3 continuation check.");
    } else {
      const game2Winner = getWinnerSide(game2);
      const game2Prices = context.priorPrices[1];
      const game2Margin = getRunDifferential(game2);

      if (!game2Winner || !game2Prices?.favoriteSide) {
        filtersFailed.push("Game 2 favorite and winner could not be validated.");
      } else if (game2Winner === game2Prices.favoriteSide) {
        filtersFailed.push("Game 2 did not fail, so a Game 3 continuation is not justified.");
      } else if ((game2Margin ?? 99) > 2) {
        filtersFailed.push("Game 2 favorite loss was too decisive for a controlled retry.");
      } else {
        filtersPassed.push("Game 2 favorite failed in a still-manageable spot");
        qualitySignals.push("Series still profiles as a contained favorite recovery chain");
      }
    }
  }

  if (context.currentPrices.favoriteSide === "home") {
    qualitySignals.push("Favorite keeps home field");
  }

  if (game1Margin === 1) {
    qualitySignals.push("Game 1 upset was only one run");
  }

  if (getExtraInningsFlag(game1)) {
    qualitySignals.push("Game 1 reached extras");
  }

  if (
    context.currentPrices.favoriteSide &&
    context.taxedBullpenSide &&
    context.taxedBullpenSide !== context.currentPrices.favoriteSide
  ) {
    qualitySignals.push("Bullpen workload leans against the current underdog");
  }

  if (
    context.currentPrices.favoriteSide === "home" &&
    context.currentStarters.homeRating !== null &&
    context.currentStarters.awayRating !== null &&
    context.currentStarters.homeRating - context.currentStarters.awayRating >= 4
  ) {
    qualitySignals.push("Home favorite starter shows a usable rating edge");
  }

  if (
    context.currentPrices.favoriteSide === "away" &&
    context.currentStarters.awayRating !== null &&
    context.currentStarters.homeRating !== null &&
    context.currentStarters.awayRating - context.currentStarters.homeRating >= 4
  ) {
    qualitySignals.push("Away favorite starter shows a usable rating edge");
  }

  const signalSide = context.currentPrices.favoriteSide ?? "home";
  const signalTeam = getTeamBySide(context.scheduledGame, signalSide);
  const minimumQualitySignals = context.seriesGameNumber === 3 ? 2 : 1;
  const evaluationStatus: MlbPregameSignalEvaluation["evaluationStatus"] =
    filtersFailed.length > 0 ? "skipped" : qualitySignals.length >= minimumQualitySignals ? "qualified" : "candidate";

  const reasonParts =
    evaluationStatus === "qualified"
      ? [...filtersPassed.slice(0, 3), ...qualitySignals.slice(0, minimumQualitySignals)]
      : evaluationStatus === "candidate"
        ? [...filtersPassed.slice(0, 3), "Supporting recovery quality is still light"]
        : [filtersFailed[0] ?? "Core favorite recovery conditions were not met"];

  return {
    strategyId: STRATEGY_ID,
    signalKey: `${context.scheduledGame.external_game_id}:${STRATEGY_ID}`,
    seriesKey: context.seriesKey,
    seriesGameNumber: context.seriesGameNumber,
    marketType: "moneyline",
    signalTeam,
    signalTeamSide: signalSide,
    signalDirection: "favorite",
    evaluationStatus,
    odds: context.currentPrices.favoriteOdds,
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
      taxedBullpenSide: context.taxedBullpenSide,
      game1ExtraInnings: getExtraInningsFlag(game1),
    },
  };
}
