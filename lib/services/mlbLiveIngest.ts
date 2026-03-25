import { createMlbProvider } from "@/lib/providers/mlbApi";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv, isMlbModuleEnabled } from "@/lib/supabase/env";
import { runMlbPregameEvaluationForUser } from "@/lib/services/mlbPregameEngine";
import type { MlbUserSettings } from "@/lib/types/database";
import type { ExternalMlbGame } from "@/lib/types/mlb";

const provider = createMlbProvider();

type MlbIngestResult = {
  disabled: boolean;
  provider: string;
  gamesCreated: number;
  watchlistsCreated: number;
  oddsCreated: number;
  liveSignalsCreated: number;
  pregameSignalsEvaluated: number;
  qualifiedPregameSignals: number;
  alertsCreated: number;
  error: string | null;
};

type MlbIngestAllUsersResult = {
  disabled: boolean;
  provider: string;
  runsCreated: number;
  gamesCreated: number;
  watchlistsCreated: number;
  oddsCreated: number;
  liveSignalsCreated: number;
  pregameSignalsEvaluated: number;
  qualifiedPregameSignals: number;
  alertsCreated: number;
  errors: string[];
};

export function getActiveMlbProviderSummary() {
  return {
    providerKey: provider.providerKey,
    displayName: provider.displayName,
    supportsAutomaticTriggers: provider.supportsAutomaticTriggers,
  };
}

async function getTrackedGames() {
  const [scheduledGames, contextGames] = await Promise.all([provider.getScheduledGames(), provider.getLiveGames()]);
  const deduped = new Map<string, ExternalMlbGame>();

  // MLB now runs pre-game only, but we still keep short series context rows in the
  // ingest window so the evaluator can score Game 2 / Game 3 setups from cached data.
  for (const game of [...contextGames, ...scheduledGames]) {
    deduped.set(`${game.source}:${game.externalGameId}`, game);
  }

  return [...deduped.values()].sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
}

async function upsertGame(admin: ReturnType<typeof createAdminClient>, game: ExternalMlbGame) {
  const { data, error } = await admin
    .from("mlb_games")
    .upsert(
      {
        provider: game.source,
        external_game_id: game.externalGameId,
        league_name: game.leagueName,
        status: game.status,
        start_time: game.startTime,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        home_score: game.homeScore,
        away_score: game.awayScore,
        inning: game.inning,
        half_inning: game.halfInning,
        home_hits: game.homeHits,
        away_hits: game.awayHits,
        home_errors: game.homeErrors,
        away_errors: game.awayErrors,
        raw_payload: game.rawPayload,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "provider,external_game_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to upsert MLB game.");
  }

  return data.id as string;
}

async function insertStateSnapshot(admin: ReturnType<typeof createAdminClient>, userId: string, gameId: string, game: ExternalMlbGame) {
  await admin.from("mlb_state_snapshots").insert({
    user_id: userId,
    game_id: gameId,
    captured_at: new Date().toISOString(),
    inning: game.inning,
    half_inning: game.halfInning,
    home_score: game.homeScore,
    away_score: game.awayScore,
    home_hits: game.homeHits,
    away_hits: game.awayHits,
    payload: game.rawPayload,
  });
}

async function writeSyncLog(params: {
  userId: string | null;
  syncType: string;
  status: "synced" | "error";
  recordsProcessed: number;
  recordsCreated: number;
  message: string;
}) {
  const admin = createAdminClient();
  await admin.from("mlb_provider_sync_logs").insert({
    user_id: params.userId,
    provider: provider.providerKey,
    sync_type: params.syncType,
    status: params.status,
    records_processed: params.recordsProcessed,
    records_created: params.recordsCreated,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    message: params.message,
  });
}

function disabledPayload(): MlbIngestResult {
  return {
    disabled: true,
    provider: provider.displayName,
    gamesCreated: 0,
    watchlistsCreated: 0,
    oddsCreated: 0,
    liveSignalsCreated: 0,
    pregameSignalsEvaluated: 0,
    qualifiedPregameSignals: 0,
    alertsCreated: 0,
    error: null as string | null,
  };
}

function emptyPayload(): MlbIngestResult {
  return {
    disabled: false,
    provider: provider.displayName,
    gamesCreated: 0,
    watchlistsCreated: 0,
    oddsCreated: 0,
    liveSignalsCreated: 0,
    pregameSignalsEvaluated: 0,
    qualifiedPregameSignals: 0,
    alertsCreated: 0,
    error: null as string | null,
  };
}

export async function runMlbProviderIngestForUser(settings: MlbUserSettings): Promise<MlbIngestResult> {
  if (!isMlbModuleEnabled()) {
    return disabledPayload();
  }

  if (!hasSupabaseEnv()) {
    return emptyPayload();
  }

  const admin = createAdminClient();

  try {
    const games = await getTrackedGames();
    let gamesCreated = 0;
    let alertsCreated = 0;

    for (const game of games) {
      const gameId = await upsertGame(admin, game);
      gamesCreated += 1;
      await insertStateSnapshot(admin, settings.user_id, gameId, game);
    }

    const pregameEvaluation = await runMlbPregameEvaluationForUser({ settings });
    alertsCreated += pregameEvaluation.alertsCreated;

    await writeSyncLog({
      userId: settings.user_id,
      syncType: "fixture_sync",
      status: "synced",
      recordsProcessed: games.length,
      recordsCreated: gamesCreated + alertsCreated + pregameEvaluation.qualifiedCount,
      message: `${provider.displayName} MLB ingest completed.`,
    });

    return {
      disabled: false,
      provider: provider.displayName,
      gamesCreated,
      watchlistsCreated: 0,
      oddsCreated: 0,
      liveSignalsCreated: 0,
      pregameSignalsEvaluated: pregameEvaluation.evaluatedCount,
      qualifiedPregameSignals: pregameEvaluation.qualifiedCount,
      alertsCreated,
      error: pregameEvaluation.error,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MLB ingest error";
    await writeSyncLog({
      userId: settings.user_id,
      syncType: "fixture_sync",
      status: "error",
      recordsProcessed: 0,
      recordsCreated: 0,
      message,
    });
    return { ...emptyPayload(), error: message };
  }
}

export async function runMlbProviderIngestForAllUsers(): Promise<MlbIngestAllUsersResult> {
  if (!isMlbModuleEnabled()) {
    return {
      disabled: true,
      provider: provider.displayName,
      runsCreated: 0,
      gamesCreated: 0,
      watchlistsCreated: 0,
      oddsCreated: 0,
      liveSignalsCreated: 0,
      pregameSignalsEvaluated: 0,
      qualifiedPregameSignals: 0,
      alertsCreated: 0,
      errors: [] as string[],
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      disabled: false,
      provider: provider.displayName,
      runsCreated: 0,
      gamesCreated: 0,
      watchlistsCreated: 0,
      oddsCreated: 0,
      liveSignalsCreated: 0,
      pregameSignalsEvaluated: 0,
      qualifiedPregameSignals: 0,
      alertsCreated: 0,
      errors: [] as string[],
    };
  }

  const admin = createAdminClient();
  const { data: settingsRows, error } = await admin.from("mlb_user_settings").select("*");
  if (error || !settingsRows) {
    throw new Error(error?.message ?? "Failed to load MLB user settings.");
  }

  let runsCreated = 0;
  let gamesCreated = 0;
  let pregameSignalsEvaluated = 0;
  let qualifiedPregameSignals = 0;
  let alertsCreated = 0;
  const errors: string[] = [];

  for (const row of settingsRows as MlbUserSettings[]) {
    const result = await runMlbProviderIngestForUser(row);
    runsCreated += 1;
    gamesCreated += result.gamesCreated;
    pregameSignalsEvaluated += result.pregameSignalsEvaluated;
    qualifiedPregameSignals += result.qualifiedPregameSignals;
    alertsCreated += result.alertsCreated;
    if (result.error) {
      errors.push(result.error);
    }
  }

  return {
    disabled: false,
    provider: provider.displayName,
    runsCreated,
    gamesCreated,
    watchlistsCreated: 0,
    oddsCreated: 0,
    liveSignalsCreated: 0,
    pregameSignalsEvaluated,
    qualifiedPregameSignals,
    alertsCreated,
    errors,
  };
}
