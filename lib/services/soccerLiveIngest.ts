import { createSoccerProvider } from "@/lib/providers/soccerApi";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv, isSoccerModuleEnabled } from "@/lib/supabase/env";
import { evaluateSoccerGameSignals, getTriggeredSoccerSignals, getSoccerDataQualityFlags } from "@/lib/services/soccerSignalEngine";
import { persistSoccerTriggeredAlerts } from "@/lib/services/soccerAlerts";
import type {
  SoccerGameRecord,
  SoccerUserSettings,
} from "@/lib/types/database";
import type { ExternalSoccerGame } from "@/lib/types/soccer";

const provider = createSoccerProvider();

export function getActiveSoccerProviderSummary() {
  return {
    providerKey: provider.providerKey,
    displayName: provider.displayName,
    supportsAutomaticTriggers: provider.supportsAutomaticTriggers,
  };
}

async function getWatchlistGames(settings: SoccerUserSettings) {
  const [scheduledGames, liveGames] = await Promise.all([
    provider.getScheduledGames(settings.selected_leagues),
    provider.getLiveGames(settings.selected_leagues),
  ]);

  const deduped = new Map<string, ExternalSoccerGame>();
  for (const game of [...liveGames, ...scheduledGames]) {
    deduped.set(`${game.source}:${game.externalMatchId}`, game);
  }

  return [...deduped.values()].sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
}

async function upsertSoccerGame(admin: ReturnType<typeof createAdminClient>, game: ExternalSoccerGame) {
  const { data, error } = await admin
    .from("soccer_games")
    .upsert(
      {
        provider: game.source,
        external_game_id: game.externalMatchId,
        league_name: game.leagueName,
        status: game.status,
        start_time: game.startTime,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        home_score: game.homeScore,
        away_score: game.awayScore,
        halftime_home_score: game.halftimeHomeScore,
        halftime_away_score: game.halftimeAwayScore,
        minute: game.minute,
        home_shots: game.homeShots,
        away_shots: game.awayShots,
        home_shots_on_target: game.homeShotsOnTarget,
        away_shots_on_target: game.awayShotsOnTarget,
        home_corners: game.homeCorners,
        away_corners: game.awayCorners,
        home_possession: game.homePossession,
        away_possession: game.awayPossession,
        raw_payload: game.rawPayload,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "provider,external_game_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to upsert soccer game.");
  }

  return data.id as string;
}

async function insertStateSnapshot(admin: ReturnType<typeof createAdminClient>, userId: string, gameId: string, game: ExternalSoccerGame) {
  await admin.from("soccer_match_state_snapshots").insert({
    user_id: userId,
    game_id: gameId,
    captured_at: new Date().toISOString(),
    minute: game.minute,
    home_score: game.homeScore,
    away_score: game.awayScore,
    halftime_home_score: game.halftimeHomeScore,
    halftime_away_score: game.halftimeAwayScore,
    home_shots: game.homeShots,
    away_shots: game.awayShots,
    home_shots_on_target: game.homeShotsOnTarget,
    away_shots_on_target: game.awayShotsOnTarget,
    home_corners: game.homeCorners,
    away_corners: game.awayCorners,
    payload: game.rawPayload,
  });
}

async function replaceDataQualityFlags(admin: ReturnType<typeof createAdminClient>, userId: string, gameId: string, game: ExternalSoccerGame, oddsAvailable = true) {
  await admin.from("soccer_data_quality_flags").delete().eq("user_id", userId).eq("game_id", gameId);

  const flags = getSoccerDataQualityFlags(game, oddsAvailable);
  if (flags.length === 0) {
    return;
  }

  await admin.from("soccer_data_quality_flags").insert(
    flags.map((flag) => ({
      user_id: userId,
      game_id: gameId,
      flag_code: flag.code,
      severity: flag.severity,
      message: flag.message,
      payload: game.rawPayload,
    })),
  );
}

async function ensureWatchlistRows(admin: ReturnType<typeof createAdminClient>, userId: string, gameId: string, game: ExternalSoccerGame) {
  const candidates = evaluateSoccerGameSignals(game);
  let created = 0;

  for (const candidate of candidates) {
    const { data: existing } = await admin
      .from("soccer_watchlists")
      .select("id")
      .eq("user_id", userId)
      .eq("game_id", gameId)
      .eq("market_key", candidate.marketKey)
      .maybeSingle();

    if (existing) {
      continue;
    }

    const { error } = await admin.from("soccer_watchlists").insert({
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

async function insertOddsSnapshots(
  admin: ReturnType<typeof createAdminClient>,
  settings: SoccerUserSettings,
  gameId: string,
  game: ExternalSoccerGame,
) {
  const marketData = await provider.getMarketData(game.externalMatchId, settings.preferred_market_key as never);
  let created = 0;

  for (const market of marketData) {
    if (market.odds === null || !market.bookmaker) {
      continue;
    }

    const { error } = await admin.from("soccer_odds_snapshots").insert({
      user_id: settings.user_id,
      game_id: gameId,
      signal_key: `${game.externalMatchId}:${market.marketKey}`,
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
  await admin.from("soccer_provider_sync_logs").insert({
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

export async function runSoccerProviderIngestForUser(settings: SoccerUserSettings) {
  if (!isSoccerModuleEnabled()) {
    return disabledPayload();
  }

  if (!hasSupabaseEnv()) {
    return emptyPayload();
  }

  const admin = createAdminClient();

  try {
    const games = await getWatchlistGames(settings);
    let gamesCreated = 0;
    let watchlistsCreated = 0;
    let oddsCreated = 0;
    let liveSignalsCreated = 0;
    let alertsCreated = 0;

    for (const game of games) {
      const gameId = await upsertSoccerGame(admin, game);
      gamesCreated += 1;
      await insertStateSnapshot(admin, settings.user_id, gameId, game);
      const leagueMeta = "getLeagueMeta" in provider
        ? await (provider as typeof provider & { getLeagueMeta?: (leagueSlug: string) => Promise<{ oddsAvailable: boolean } | null> }).getLeagueMeta?.(String(game.leagueSlug))
        : null;
      await replaceDataQualityFlags(admin, settings.user_id, gameId, game, leagueMeta?.oddsAvailable ?? true);
      watchlistsCreated += await ensureWatchlistRows(admin, settings.user_id, gameId, game);
      oddsCreated += await insertOddsSnapshots(admin, settings, gameId, game);

      const created = await persistSoccerTriggeredAlerts({
        userId: settings.user_id,
        gameId,
        game,
        settings,
        evaluatedSignals: getTriggeredSoccerSignals(game),
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
      message: `${provider.displayName} soccer ingest completed.`,
    });

    return { disabled: false, provider: provider.displayName, gamesCreated, watchlistsCreated, oddsCreated, liveSignalsCreated, alertsCreated, error: null as string | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown soccer ingest error";
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

export async function runSoccerProviderIngestForAllUsers() {
  if (!isSoccerModuleEnabled()) {
    return { disabled: true, provider: provider.displayName, runsCreated: 0, gamesCreated: 0, watchlistsCreated: 0, oddsCreated: 0, liveSignalsCreated: 0, alertsCreated: 0, errors: [] as string[] };
  }

  if (!hasSupabaseEnv()) {
    return { disabled: false, provider: provider.displayName, runsCreated: 0, gamesCreated: 0, watchlistsCreated: 0, oddsCreated: 0, liveSignalsCreated: 0, alertsCreated: 0, errors: [] as string[] };
  }

  const admin = createAdminClient();
  const { data: settingsRows, error } = await admin.from("soccer_user_settings").select("*");
  if (error || !settingsRows) {
    throw new Error(error?.message ?? "Failed to load soccer user settings.");
  }

  let runsCreated = 0;
  let gamesCreated = 0;
  let watchlistsCreated = 0;
  let oddsCreated = 0;
  let liveSignalsCreated = 0;
  let alertsCreated = 0;
  const errors: string[] = [];

  for (const row of settingsRows as SoccerUserSettings[]) {
    const result = await runSoccerProviderIngestForUser(row);
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

export async function captureSoccerOddsSnapshotsForAllUsers() {
  if (!isSoccerModuleEnabled()) {
    return { disabled: true, provider: provider.displayName, runsCreated: 0, snapshotsCreated: 0, errors: [] as string[] };
  }

  if (!hasSupabaseEnv()) {
    return { disabled: false, provider: provider.displayName, runsCreated: 0, snapshotsCreated: 0, errors: [] as string[] };
  }

  const admin = createAdminClient();
  const { data: settingsRows, error } = await admin.from("soccer_user_settings").select("*");
  if (error || !settingsRows) {
    throw new Error(error?.message ?? "Failed to load soccer user settings.");
  }

  let runsCreated = 0;
  let snapshotsCreated = 0;
  const errors: string[] = [];

  for (const settings of settingsRows as SoccerUserSettings[]) {
    try {
      const { data: games } = await admin
        .from("soccer_games")
        .select("*")
        .order("last_synced_at", { ascending: false })
        .limit(10);

      for (const game of (games ?? []) as SoccerGameRecord[]) {
        const marketData = await provider.getMarketData(game.external_game_id, settings.preferred_market_key as never);
        for (const market of marketData) {
          if (market.odds === null || !market.bookmaker) {
            continue;
          }

          const { error: insertError } = await admin.from("soccer_odds_snapshots").insert({
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
      const message = runError instanceof Error ? runError.message : "Unknown soccer odds sync error";
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
      message: `${provider.displayName} soccer odds sync completed.`,
    });
  }

  return { disabled: false, provider: provider.displayName, runsCreated, snapshotsCreated, errors };
}