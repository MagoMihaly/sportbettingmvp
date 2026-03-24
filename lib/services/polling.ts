import type { ExternalHockeyGame } from "@/lib/types/provider";
import type { ExternalSoccerGame } from "@/lib/types/soccer";

export type PollingStage =
  | "ignore"
  | "prefilter"
  | "watchlist"
  | "trigger-zone"
  | "cooldown";

function hoursBetween(input: string) {
  return (new Date(input).getTime() - Date.now()) / 3_600_000;
}

function isFinished(status: string) {
  return status === "finished";
}

function isLive(status: string) {
  return status === "live";
}

export function getHockeyPollingStage(game: ExternalHockeyGame): PollingStage {
  if (isFinished(game.status)) {
    return "ignore";
  }

  if (isLive(game.status)) {
    const homeEligible = game.period1HomeGoals === 0 && game.period2HomeGoals === 0;
    const awayEligible = game.period1AwayGoals === 0 && game.period2AwayGoals === 0;
    return homeEligible || awayEligible ? "trigger-zone" : "watchlist";
  }

  const hoursToStart = hoursBetween(game.startTime);
  if (hoursToStart <= 12 && hoursToStart >= -2) {
    return "prefilter";
  }

  return "ignore";
}

export function getSoccerPollingStage(game: ExternalSoccerGame): PollingStage {
  if (isFinished(game.status)) {
    return "ignore";
  }

  if (isLive(game.status)) {
    if ((game.minute ?? 0) >= 60 && game.homeScore === 0 && game.awayScore === 0) {
      return "trigger-zone";
    }

    if (game.halftimeHomeScore === 0 && game.halftimeAwayScore === 0) {
      return "watchlist";
    }

    return "prefilter";
  }

  const hoursToStart = hoursBetween(game.startTime);
  if (hoursToStart <= 8 && hoursToStart >= -2) {
    return "prefilter";
  }

  return "ignore";
}

export function shouldPersistHockeyGame(game: ExternalHockeyGame) {
  return getHockeyPollingStage(game) !== "ignore";
}

export function shouldPersistSoccerGame(game: ExternalSoccerGame) {
  return getSoccerPollingStage(game) !== "ignore";
}

export function shouldCaptureHockeyOdds(game: ExternalHockeyGame) {
  const stage = getHockeyPollingStage(game);
  return stage === "watchlist" || stage === "trigger-zone";
}

export function shouldCaptureSoccerOdds(game: ExternalSoccerGame) {
  const stage = getSoccerPollingStage(game);
  return stage === "watchlist" || stage === "trigger-zone";
}

export function shouldCaptureHockeyOddsSnapshotRow(match: {
  ingest_status: string;
  match_start_time: string;
  period1_home_goals: number;
  period1_away_goals: number;
  period2_home_goals: number;
  period2_away_goals: number;
}) {
  if (match.ingest_status !== "synced") {
    return false;
  }

  const hoursToStart = hoursBetween(match.match_start_time);
  if (hoursToStart < -4 || hoursToStart > 12) {
    return false;
  }

  const homeEligible = match.period1_home_goals === 0 && match.period2_home_goals === 0;
  const awayEligible = match.period1_away_goals === 0 && match.period2_away_goals === 0;
  return homeEligible || awayEligible || hoursToStart <= 2;
}

export function shouldCaptureSoccerOddsSnapshotRow(game: {
  status: string;
  start_time: string;
  minute: number | null;
  home_score: number;
  away_score: number;
  halftime_home_score: number | null;
  halftime_away_score: number | null;
}) {
  if (game.status === "finished") {
    return false;
  }

  if (game.status === "live") {
    const minute = game.minute ?? 0;
    if (minute >= 60 && game.home_score === 0 && game.away_score === 0) {
      return true;
    }

    if (game.halftime_home_score === 0 && game.halftime_away_score === 0) {
      return true;
    }
  }

  const hoursToStart = hoursBetween(game.start_time);
  return hoursToStart <= 2 && hoursToStart >= -2;
}
