import type { MlbGameRecord, MlbOddsSnapshotRecord } from "@/lib/types/database";
import type { MlbPriceSnapshot, MlbSeriesContext, MlbStarterSnapshot, MlbTeamSide } from "@/lib/types/mlbPregame";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function readRecord(record: UnknownRecord | null, key: string) {
  return asRecord(record?.[key]);
}

function readNumber(record: UnknownRecord | null, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readString(record: UnknownRecord | null, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readBoolean(record: UnknownRecord | null, keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function getPregamePayload(game: MlbGameRecord) {
  const raw = asRecord(game.raw_payload);
  return readRecord(raw, "pregame") ?? readRecord(raw, "preGame") ?? raw;
}

function normalizeTeamSide(value: string | null): MlbTeamSide | null {
  if (!value) {
    return null;
  }

  return value.toLowerCase() === "home" ? "home" : value.toLowerCase() === "away" ? "away" : null;
}

function extractPriceFromSnapshots(gameId: string, oddsSnapshots: MlbOddsSnapshotRecord[]) {
  const snapshots = oddsSnapshots.filter((snapshot) => snapshot.game_id === gameId);
  let homeOdds: number | null = null;
  let awayOdds: number | null = null;

  for (const snapshot of snapshots) {
    const payload = asRecord(snapshot.payload);
    const side = normalizeTeamSide(readString(payload, ["side", "teamSide"]));
    if (side === "home" && homeOdds === null) {
      homeOdds = snapshot.decimal_odds;
    }
    if (side === "away" && awayOdds === null) {
      awayOdds = snapshot.decimal_odds;
    }
  }

  return { homeOdds, awayOdds };
}

export function getPriceSnapshot(game: MlbGameRecord, oddsSnapshots: MlbOddsSnapshotRecord[]): MlbPriceSnapshot {
  const pregame = getPregamePayload(game);
  const oddsFromSnapshots = extractPriceFromSnapshots(game.id, oddsSnapshots);
  const homeOdds =
    readNumber(pregame, ["homeMoneylineDecimal", "homeMoneyline", "homeOdds"]) ?? oddsFromSnapshots.homeOdds;
  const awayOdds =
    readNumber(pregame, ["awayMoneylineDecimal", "awayMoneyline", "awayOdds"]) ?? oddsFromSnapshots.awayOdds;

  if (homeOdds !== null && awayOdds !== null && homeOdds !== awayOdds) {
    const favoriteSide = homeOdds < awayOdds ? "home" : "away";
    const underdogSide = favoriteSide === "home" ? "away" : "home";

    return {
      homeOdds,
      awayOdds,
      favoriteSide,
      underdogSide,
      favoriteOdds: favoriteSide === "home" ? homeOdds : awayOdds,
      underdogOdds: underdogSide === "home" ? homeOdds : awayOdds,
    };
  }

  return {
    homeOdds,
    awayOdds,
    favoriteSide: null,
    underdogSide: null,
    favoriteOdds: null,
    underdogOdds: null,
  };
}

export function getStarterSnapshot(game: MlbGameRecord): MlbStarterSnapshot {
  const pregame = getPregamePayload(game);
  const homeStarterRecord = readRecord(pregame, "homeStarter");
  const awayStarterRecord = readRecord(pregame, "awayStarter");
  const homeStarter = readString(homeStarterRecord, ["name", "starter"]) ?? readString(pregame, ["homeStarterName"]);
  const awayStarter = readString(awayStarterRecord, ["name", "starter"]) ?? readString(pregame, ["awayStarterName"]);
  const homeRating = readNumber(homeStarterRecord, ["rating", "grade"]) ?? readNumber(pregame, ["homeStarterRating"]);
  const awayRating = readNumber(awayStarterRecord, ["rating", "grade"]) ?? readNumber(pregame, ["awayStarterRating"]);

  let severeDisadvantageSide: MlbTeamSide | null = null;
  if (homeRating !== null && awayRating !== null) {
    if (homeRating - awayRating >= 8) {
      severeDisadvantageSide = "away";
    } else if (awayRating - homeRating >= 8) {
      severeDisadvantageSide = "home";
    }
  }

  return {
    homeStarter,
    awayStarter,
    homeRating,
    awayRating,
    severeDisadvantageSide,
  };
}

export function getWinnerSide(game: MlbGameRecord): MlbTeamSide | null {
  if (game.status !== "finished" || game.home_score === game.away_score) {
    return null;
  }

  return game.home_score > game.away_score ? "home" : "away";
}

export function getRunDifferential(game: MlbGameRecord) {
  if (game.status !== "finished") {
    return null;
  }

  return Math.abs(game.home_score - game.away_score);
}

export function getTeamBySide(game: MlbGameRecord, side: MlbTeamSide) {
  return side === "home" ? game.home_team : game.away_team;
}

export function getOppositeSide(side: MlbTeamSide): MlbTeamSide {
  return side === "home" ? "away" : "home";
}

export function getExtraInningsFlag(game: MlbGameRecord) {
  const pregame = getPregamePayload(game);
  return readBoolean(pregame, ["extraInnings", "wentExtras"]);
}

function getLocalDateKey(input: string) {
  return new Date(input).toISOString().slice(0, 10);
}

function hasDoubleheader(chain: MlbGameRecord[]) {
  const seen = new Set<string>();

  for (const game of chain) {
    const dateKey = getLocalDateKey(game.start_time);
    if (seen.has(dateKey)) {
      return true;
    }
    seen.add(dateKey);
  }

  return false;
}

function getHoursBetween(earlier: string, later: string) {
  return (new Date(later).getTime() - new Date(earlier).getTime()) / (1000 * 60 * 60);
}

export function buildMlbSeriesContexts(games: MlbGameRecord[], oddsSnapshots: MlbOddsSnapshotRecord[]) {
  const scheduledGames = [...games]
    .filter((game) => game.status === "scheduled")
    .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime());

  const contexts: MlbSeriesContext[] = [];

  for (const scheduledGame of scheduledGames) {
    const relatedPriorGames = games
      .filter(
        (game) =>
          game.id !== scheduledGame.id &&
          game.home_team === scheduledGame.home_team &&
          game.away_team === scheduledGame.away_team &&
          new Date(game.start_time).getTime() < new Date(scheduledGame.start_time).getTime(),
      )
      .sort((left, right) => new Date(right.start_time).getTime() - new Date(left.start_time).getTime());

    const consecutivePriorGames: MlbGameRecord[] = [];
    let previousStart = scheduledGame.start_time;

    for (const game of relatedPriorGames) {
      const gapHours = getHoursBetween(game.start_time, previousStart);
      if (gapHours > 60) {
        break;
      }

      consecutivePriorGames.unshift(game);
      previousStart = game.start_time;

      if (consecutivePriorGames.length === 2) {
        break;
      }
    }

    const seriesGameNumber = (consecutivePriorGames.length + 1) as 1 | 2 | 3;
    if (seriesGameNumber < 2) {
      continue;
    }

    const chain = [...consecutivePriorGames, scheduledGame];
    const seriesKey = `${scheduledGame.home_team}::${scheduledGame.away_team}::${consecutivePriorGames[0]?.external_game_id ?? scheduledGame.external_game_id}`;
    const pregame = getPregamePayload(scheduledGame);

    contexts.push({
      seriesKey,
      seriesGameNumber: seriesGameNumber as 2 | 3,
      scheduledGame,
      priorGames: consecutivePriorGames,
      currentPrices: getPriceSnapshot(scheduledGame, oddsSnapshots),
      priorPrices: consecutivePriorGames.map((game) => getPriceSnapshot(game, oddsSnapshots)),
      currentStarters: getStarterSnapshot(scheduledGame),
      locationContinuity: consecutivePriorGames.every(
        (game) => game.home_team === scheduledGame.home_team && game.away_team === scheduledGame.away_team,
      ),
      doubleheaderDetected: hasDoubleheader(chain),
      divisionMatchup: readBoolean(pregame, ["divisionMatchup"]),
      getawayDay: readBoolean(pregame, ["getawayDay"]),
      travelFlag: readBoolean(pregame, ["travelFlag"]),
      taxedBullpenSide: normalizeTeamSide(readString(pregame, ["taxedBullpenSide"])),
      oddsSnapshots,
    });
  }

  return contexts;
}
