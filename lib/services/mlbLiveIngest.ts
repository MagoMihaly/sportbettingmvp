import { createMlbProvider } from "@/lib/providers/mlbApi";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv, isMlbModuleEnabled } from "@/lib/supabase/env";
import { persistMlbTriggeredAlerts } from "@/lib/services/mlbAlerts";
import { getTriggeredMlbSignals, evaluateMlbGameSignals } from "@/lib/services/mlbSignalEngine";
import type { MlbGameRecord, MlbUserSettings } from "@/lib/types/database";
import type { ExternalMlbGame } from "@/lib/types/mlb";

const provider = createMlbProvider();

export function getActiveMlbProviderSummary() {
  return {
    providerKey: provider.providerKey,
    displayName: provider.displayName,
    supportsAutomaticTriggers: provider.supportsAutomaticTriggers,
  };
}

async function getTrackedGames() {
  const [scheduledGames, liveGames] = await Promise.all([provider.getScheduledGames(), provider.getLiveGames()]);
  const deduped = new Map<string, ExternalMlbGame>();

  for (const game of [...liveGames, ...scheduledGames]) {
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

async function ensureWatchlistRows(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  gameId: string,
  game: ExternalMlbGame,
  selectedSystems: string[],
) {
  const candidates = evaluateMlbGameSignals(game).filter((candidate) => selectedSystems.includes(candidate.marketKey));
  let created = 0;

  for (const candidate of candidates) {
    const { data: existing } = await admin
      .from("mlb_watchlists")
      .select("id")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .eq("market_key", candidate.marketKey)
      .maybeSingle();

    if (existing) {
      continue;
    }

    const { error } = await admin.from("mlb_watchlists").insert({
      user_id: userId,
      game_id: gameId,
      market_key: candidate.marketKey,
      rule_type: candidate.ruleType,
      status: candidate.triggerConditionMet ? "triggered" : "watching",
      notes: `Generated from ${game.leagueName}`,
    });

    if (!error) {
      created += 1;
    }
  }

  return created;
}

async function insertOddsSnapshots(admin: ReturnType<typeof createAdminClient>, settings: MlbUserSettings, gameId: string, game: ExternalMlbGame) {
  const marketData = await provider.getMarketData(game.externalGameId, settings.preferred_market_key as never);
  let created = 0;

  for (const market of marketData) {
    if (market.odds === null || !market.bookmaker) {
      continue;
    }

    const { error } = await admin.from("mlb_odds_snapshots").insert({
      user_id: settings.user_id,
      game_id: gameId,
      signal_key: `${game.externalGameId}:${market.marketKey}`,
      market_key: market.marketKey,
      bookmaker: market.bookmaker,
      decimal_odds: Number(market.odds.toFixed(2)),
      suspended: market.suspended,
      captured_at: new Date().toISOString(),
      source: market.source,
      payload: market.payload,
    });

    if (!error) {
      created += 1;
    }
  }

  return created;
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

function disabledPayload() {
  return { disabled: true, provider: provider.displayName, gamesCreated: 0, watchlistsCreated: 0, oddsCreated: 0, liveSignalsCreated: 0, alertsCreated: 0, error: null as string | null };
}

function emptyPayload() {
  return { disabled: false, provider: provider.displayName, gamesCreated: 0, watchlistsCreated: 0, oddsCreated: 0, liveSignalsCreated: 0, alertsCreated: 0, error: null as string | null };
}

export async function runMlbProviderIngestForUser(settings: MlbUserSettings) {
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
    let watchlistsCreated = 0;
    let oddsCreated = 0;
    let liveSignalsCreated = 0;
    let alertsCreated = 0;

    for (const game of games) {
      const gameId = await upsertGame(admin, game);
      gamesCreated += 1;
      await insertStateSnapshot(admin, settings.user_id, gameId, game);
      watchlistsCreated += await ensureWatchlistRows(admin, settings.user_id, gameId, game, settings.selected_systems);
      oddsCreated += await insertOddsSnapshots(admin, settings, gameId, game);

      const created = await persistMlbTriggeredAlerts({
        userId: settings.user_id,
        gameId,
        game,
        settings,
        evaluatedSignals: getTriggeredMlbSignals(game).filter((signal) => settings.selected_systems.includes(signal.marketKey)),
      });
      liveSignalsCreated += created.liveSignalsCreated;
      alertsCreated += created.alertsCreated;
    }

    await writeSyncLog({
      userId: settings.user_id,
      syncType: "fixture_sync",
      status: "synced",
      recordsProcessed: games.length,
      recordsCreated: gamesCreated + alertsCreated,
      message: `${provider.displayName} MLB ingest completed.`,
    });

    return { disabled: false, provider: provider.displayName, gamesCreated, watchlistsCreated, oddsCreated, liveSignalsCreated, alertsCreated, error: null as string | null };
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

export async function runMlbProviderIngestForAllUsers() {
  if (!isMlbModuleEnabled()) {
    return { disabled: true, provider: provider.displayName, runsCreated: 0, gamesCreated: 0, watchlistsCreated: 0, oddsCreated: 0, liveSignalsCreated: 0, alertsCreated: 0, errors: [] as string[] };
  }

  if (!hasSupabaseEnv()) {
    return { disabled: false, provider: provider.displayName, runsCreated: 0, gamesCreated: 0, watchlistsCreated: 0, oddsCreated: 0, liveSignalsCreated: 0, alertsCreated: 0, errors: [] as string[] };
  }

  const admin = createAdminClient();
  const { data: settingsRows, error } = await admin.from("mlb_user_settings").select("*");
  if (error || !settingsRows) {
    throw new Error(error?.message ?? "Failed to load MLB user settings.");
  }

  let runsCreated = 0;
  let gamesCreated = 0;
  let watchlistsCreated = 0;
  let oddsCreated = 0;
  let liveSignalsCreated = 0;
  let alertsCreated = 0;
  const errors: string[] = [];

  for (const row of settingsRows as MlbUserSettings[]) {
    const result = await runMlbProviderIngestForUser(row);
    runsCreated += 1;
    gamesCreated += result.gamesCreated;
    watchlistsCreated += result.watchlistsCreated;
    oddsCreated += result.oddsCreated;
    liveSignalsCreated += result.liveSignalsCreated;
    alertsCreated += result.alertsCreated;
    if (result.error) {
      errors.push(result.error);
    }
  }

  return { disabled: false, provider: provider.displayName, runsCreated, gamesCreated, watchlistsCreated, oddsCreated, liveSignalsCreated, alertsCreated, errors };
}

export async function captureMlbOddsSnapshotsForAllUsers() {
  if (!isMlbModuleEnabled()) {
    return { disabled: true, provider: provider.displayName, runsCreated: 0, snapshotsCreated: 0, errors: [] as string[] };
  }

  if (!hasSupabaseEnv()) {
    return { disabled: false, provider: provider.displayName, runsCreated: 0, snapshotsCreated: 0, errors: [] as string[] };
  }

  const admin = createAdminClient();
  const { data: settingsRows, error } = await admin.from("mlb_user_settings").select("*");
  if (error || !settingsRows) {
    throw new Error(error?.message ?? "Failed to load MLB user settings.");
  }

  let runsCreated = 0;
  let snapshotsCreated = 0;
  const errors: string[] = [];

  for (const settings of settingsRows as MlbUserSettings[]) {
    try {
      const { data: games } = await admin
        .from("mlb_games")
        .select("*")
        .order("last_synced_at", { ascending: false })
        .limit(10);

      for (const game of (games ?? []) as MlbGameRecord[]) {
        const marketData = await provider.getMarketData(game.external_game_id, settings.preferred_market_key as never);
        for (const market of marketData) {
          if (market.odds === null || !market.bookmaker) {
            continue;
          }

          const { error: insertError } = await admin.from("mlb_odds_snapshots").insert({
            user_id: settings.user_id,
            game_id: game.id,
            signal_key: `${game.external_game_id}:${market.marketKey}`,
            market_key: market.marketKey,
            bookmaker: market.bookmaker,
            decimal_odds: Number(market.odds.toFixed(2)),
            suspended: market.suspended,
            captured_at: new Date().toISOString(),
            source: market.source,
            payload: market.payload,
          });

          if (!insertError) {
            snapshotsCreated += 1;
          }
        }
      }
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Unknown MLB odds sync error";
      errors.push(message);
      await writeSyncLog({
        userId: settings.user_id,
        syncType: "odds_sync",
        status: "error",
        recordsProcessed: 0,
        recordsCreated: 0,
        message,
      });
    }

    runsCreated += 1;
  }

  if (errors.length === 0) {
    await writeSyncLog({
      userId: null,
      syncType: "odds_sync",
      status: "synced",
      recordsProcessed: runsCreated,
      recordsCreated: snapshotsCreated,
      message: `${provider.displayName} MLB odds sync completed.`,
    });
  }

  return { disabled: false, provider: provider.displayName, runsCreated, snapshotsCreated, errors };
}

export async function captureMlbOddsSnapshotsForUser(settings: MlbUserSettings, games: MlbGameRecord[]) {
  if (!isMlbModuleEnabled()) {
    return { disabled: true, provider: provider.displayName, snapshotsCreated: 0, error: null as string | null };
  }

  if (!hasSupabaseEnv()) {
    return { disabled: false, provider: provider.displayName, snapshotsCreated: 0, error: null as string | null };
  }

  const admin = createAdminClient();
  let snapshotsCreated = 0;

  try {
    for (const game of games) {
      const marketData = await provider.getMarketData(game.external_game_id, settings.preferred_market_key as never);
      for (const market of marketData) {
        if (market.odds === null || !market.bookmaker) {
          continue;
        }

        const { error } = await admin.from("mlb_odds_snapshots").insert({
          user_id: settings.user_id,
          game_id: game.id,
          signal_key: `${game.external_game_id}:${market.marketKey}`,
          market_key: market.marketKey,
          bookmaker: market.bookmaker,
          decimal_odds: Number(market.odds.toFixed(2)),
          suspended: market.suspended,
          captured_at: new Date().toISOString(),
          source: market.source,
          payload: market.payload,
        });

        if (!error) {
          snapshotsCreated += 1;
        }
      }
    }

    await writeSyncLog({
      userId: settings.user_id,
      syncType: "odds_sync",
      status: "synced",
      recordsProcessed: games.length,
      recordsCreated: snapshotsCreated,
      message: `${provider.displayName} MLB odds sync completed.`,
    });

    return { disabled: false, provider: provider.displayName, snapshotsCreated, error: null as string | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MLB odds sync error";
    await writeSyncLog({
      userId: settings.user_id,
      syncType: "odds_sync",
      status: "error",
      recordsProcessed: 0,
      recordsCreated: 0,
      message,
    });
    return { disabled: false, provider: provider.displayName, snapshotsCreated, error: message };
  }
}
