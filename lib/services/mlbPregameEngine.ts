import { mlbPregameStrategies } from "@/lib/config/mlbPregameStrategies";
import { createMlbProvider } from "@/lib/providers/mlbApi";
import { deliverPushAlert, getEnabledNotificationChannels } from "@/lib/services/notifications";
import { buildMlbSeriesContexts } from "@/lib/services/mlbPregameShared";
import { evaluateMlbFavoriteRecoveryStrategy } from "@/lib/services/mlbFavoriteRecoveryStrategy";
import { evaluateMlbSeriesGame3UnderdogStrategy } from "@/lib/services/mlbSeriesGame3UnderdogStrategy";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { AlertRecord, MlbGameRecord, MlbOddsSnapshotRecord, MlbUserSettings } from "@/lib/types/database";
import type { MlbPregameSignalEvaluation } from "@/lib/types/mlbPregame";

const provider = createMlbProvider();

function getSelectedPregameStrategies(settings: MlbUserSettings) {
  const selected = settings.selected_pregame_strategies?.filter(Boolean);
  return selected?.length ? selected : mlbPregameStrategies.map((strategy) => strategy.key);
}

export function evaluateMlbPregameSignals(params: {
  games: MlbGameRecord[];
  oddsSnapshots: MlbOddsSnapshotRecord[];
  selectedStrategies: string[];
}) {
  const contexts = buildMlbSeriesContexts(params.games, params.oddsSnapshots);
  const evaluations: MlbPregameSignalEvaluation[] = [];

  for (const context of contexts) {
    if (params.selectedStrategies.includes("MLB_SERIES_G3_UNDERDOG")) {
      const evaluation = evaluateMlbSeriesGame3UnderdogStrategy(context);
      if (evaluation) {
        evaluations.push(evaluation);
      }
    }

    if (params.selectedStrategies.includes("MLB_FAVORITE_RECOVERY")) {
      const evaluation = evaluateMlbFavoriteRecoveryStrategy(context);
      if (evaluation) {
        evaluations.push(evaluation);
      }
    }
  }

  return evaluations.sort((left, right) => {
    if (left.evaluationStatus === right.evaluationStatus) {
      return right.seriesGameNumber - left.seriesGameNumber;
    }

    const rank = { qualified: 0, candidate: 1, skipped: 2 } as const;
    return rank[left.evaluationStatus] - rank[right.evaluationStatus];
  });
}

function buildAlertCopy(evaluation: MlbPregameSignalEvaluation) {
  const title = "MLB pre-game signal";
  const body =
    evaluation.signalDirection === "underdog"
      ? `${evaluation.signalTeam} qualifies as a ${evaluation.seriesGameNumber === 3 ? "Game 3" : "series"} underdog signal. ${evaluation.reasonSummary}`
      : `${evaluation.signalTeam} qualifies for the favorite recovery model in Game ${evaluation.seriesGameNumber}. ${evaluation.reasonSummary}`;

  return { title, body };
}

async function persistAlertForEvaluation(params: {
  userId: string;
  signalId: string;
  evaluation: MlbPregameSignalEvaluation;
  settings: MlbUserSettings;
}) {
  const admin = createAdminClient();
  const channels = getEnabledNotificationChannels(params.settings);
  const copy = buildAlertCopy(params.evaluation);
  let alertsCreated = 0;

  for (const channel of channels) {
    const fingerprint = `${params.userId}:${params.evaluation.signalKey}:${channel}`;
    const { data: existing } = await admin
      .from("mlb_alerts")
      .select("id")
      .eq("user_id", params.userId)
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (existing) {
      continue;
    }

    const initialStatus = channel === "dashboard" ? "sent" : channel === "push" ? "queued" : "pending";
    const { data: insertedAlert, error } = await admin.from("mlb_alerts").insert({
      user_id: params.userId,
      mlb_live_signal_id: null,
      mlb_pregame_signal_id: params.signalId,
      alert_type: params.evaluation.strategyId,
      channel,
      title: copy.title,
      body: copy.body,
      status: initialStatus,
      fingerprint,
      payload: {
        sport: "mlb",
        strategyId: params.evaluation.strategyId,
        marketType: params.evaluation.marketType,
        signalTeam: params.evaluation.signalTeam,
        seriesKey: params.evaluation.seriesKey,
      },
    }).select("*").single();

    if (!error && insertedAlert) {
      if (channel === "push") {
        const delivery = await deliverPushAlert(insertedAlert as AlertRecord);
        await admin
          .from("mlb_alerts")
          .update({
            status: delivery.delivered ? "sent" : "failed",
            delivered_at: delivery.delivered ? new Date().toISOString() : null,
            payload: {
              ...(((insertedAlert.payload ?? {}) as Record<string, unknown>)),
              pushDelivery: {
                provider: delivery.provider,
                sentCount: delivery.sentCount,
                failedCount: delivery.failedCount,
                revokedCount: delivery.revokedCount,
                reason: delivery.reason,
              },
            },
          })
          .eq("id", insertedAlert.id);
      }

      alertsCreated += 1;
    }
  }

  return alertsCreated;
}

async function persistEvaluations(params: {
  userId: string;
  settings: MlbUserSettings;
  games: MlbGameRecord[];
  evaluations: MlbPregameSignalEvaluation[];
}) {
  const admin = createAdminClient();
  let created = 0;
  let alertsCreated = 0;

  for (const evaluation of params.evaluations) {
    const scheduledGameId = typeof evaluation.payload.scheduledGameId === "string" ? evaluation.payload.scheduledGameId : "";
    const game = params.games.find((entry) => entry.id === scheduledGameId);
    if (!game) {
      continue;
    }

    const { data, error } = await admin
      .from("mlb_pregame_signals")
      .upsert(
        {
          user_id: params.userId,
          game_id: game.id,
          strategy_id: evaluation.strategyId,
          signal_key: evaluation.signalKey,
          series_key: evaluation.seriesKey,
          series_game_number: evaluation.seriesGameNumber,
          signal_team: evaluation.signalTeam,
          signal_team_side: evaluation.signalTeamSide,
          signal_direction: evaluation.signalDirection,
          market_type: evaluation.marketType,
          evaluation_status: evaluation.evaluationStatus,
          odds: evaluation.odds,
          reason_summary: evaluation.reasonSummary,
          skip_reason: evaluation.skipReason,
          source_provider: evaluation.sourceProvider,
          evaluated_at: new Date().toISOString(),
          payload: evaluation.payload,
        },
        { onConflict: "user_id,signal_key" },
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to persist MLB pre-game evaluation.");
    }

    created += 1;

    if (evaluation.evaluationStatus === "qualified") {
      alertsCreated += await persistAlertForEvaluation({
        userId: params.userId,
        signalId: data.id as string,
        evaluation,
        settings: params.settings,
      });
    }
  }

  return { created, alertsCreated };
}

async function writePregameSyncLog(params: {
  userId: string;
  status: "synced" | "error";
  recordsProcessed: number;
  recordsCreated: number;
  message: string;
}) {
  const admin = createAdminClient();
  await admin.from("mlb_provider_sync_logs").insert({
    user_id: params.userId,
    provider: provider.providerKey,
    sync_type: "pregame_eval",
    status: params.status,
    records_processed: params.recordsProcessed,
    records_created: params.recordsCreated,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    message: params.message,
  });
}

export async function runMlbPregameEvaluationForUser(params: {
  settings: MlbUserSettings;
  games?: MlbGameRecord[];
  oddsSnapshots?: MlbOddsSnapshotRecord[];
}) {
  if (!hasSupabaseEnv()) {
    return { disabled: false, provider: provider.displayName, evaluatedCount: 0, qualifiedCount: 0, alertsCreated: 0, error: null as string | null };
  }

  const admin = createAdminClient();

  try {
    const games =
      params.games ??
      (((await admin.from("mlb_games").select("*").order("start_time", { ascending: false }).limit(40)).data ?? []) as MlbGameRecord[]);
    const oddsSnapshots =
      params.oddsSnapshots ??
      (((await admin
        .from("mlb_odds_snapshots")
        .select("*")
        .eq("user_id", params.settings.user_id)
        .order("captured_at", { ascending: false })
        .limit(80)).data ?? []) as MlbOddsSnapshotRecord[]);

    const selectedStrategies = getSelectedPregameStrategies(params.settings);
    const evaluations = evaluateMlbPregameSignals({
      games,
      oddsSnapshots,
      selectedStrategies,
    });

    if (evaluations.length === 0) {
      await writePregameSyncLog({
        userId: params.settings.user_id,
        status: "synced",
        recordsProcessed: 0,
        recordsCreated: 0,
        message: "No MLB pre-game series candidates qualified for evaluation.",
      });

      return { disabled: false, provider: provider.displayName, evaluatedCount: 0, qualifiedCount: 0, alertsCreated: 0, error: null as string | null };
    }

    const persisted = await persistEvaluations({
      userId: params.settings.user_id,
      settings: params.settings,
      games,
      evaluations,
    });
    const qualifiedCount = evaluations.filter((evaluation) => evaluation.evaluationStatus === "qualified").length;

    await writePregameSyncLog({
      userId: params.settings.user_id,
      status: "synced",
      recordsProcessed: evaluations.length,
      recordsCreated: persisted.created + persisted.alertsCreated,
      message: `${qualifiedCount} MLB pre-game signals qualified across ${selectedStrategies.length} strategies.`,
    });

    return {
      disabled: false,
      provider: provider.displayName,
      evaluatedCount: evaluations.length,
      qualifiedCount,
      alertsCreated: persisted.alertsCreated,
      error: null as string | null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MLB pre-game evaluation error";
    await writePregameSyncLog({
      userId: params.settings.user_id,
      status: "error",
      recordsProcessed: 0,
      recordsCreated: 0,
      message,
    });

    return {
      disabled: false,
      provider: provider.displayName,
      evaluatedCount: 0,
      qualifiedCount: 0,
      alertsCreated: 0,
      error: message,
    };
  }
}
