import { createAdminClient } from "@/lib/supabase/admin";
import { deliverPushAlert, getEnabledNotificationChannels } from "@/lib/services/notifications";
import type { UserSettings } from "@/lib/types/database";
import type { EvaluatedSignal } from "@/lib/types/signals";
import type { ExternalHockeyGame } from "@/lib/types/provider";

function buildAlertCopy(game: ExternalHockeyGame, signal: EvaluatedSignal) {
  return {
    title: "Live hockey alert",
    body: `${signal.selectedTeam} stayed scoreless through the tracked period condition in ${game.league}.`,
  };
}

async function ensureResearchSignal(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  game: ExternalHockeyGame,
  signal: EvaluatedSignal,
) {
  const { data: existing } = await admin
    .from("signals")
    .select("id")
    .eq("user_id", userId)
    .eq("match_id", game.externalMatchId)
    .eq("selected_team", signal.selectedTeam)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing.id as string;
  }

  const { data, error } = await admin
    .from("signals")
    .insert({
      user_id: userId,
      sport: "ice_hockey",
      league: game.league,
      match_id: game.externalMatchId,
      home_team: game.homeTeam,
      away_team: game.awayTeam,
      match_start_time: game.startTime,
      selected_team: signal.selectedTeam,
      selected_team_side: signal.selectedTeamSide,
      period1_goals: signal.period1Goals,
      period2_goals: signal.period2Goals,
      trigger_condition_met: signal.triggerConditionMet,
      trigger_time: signal.triggerConditionMet ? new Date().toISOString() : null,
      odds: game.odds,
      bookmaker: game.bookmaker,
      stake: 1,
      status: signal.triggerConditionMet ? "triggered" : "watching",
      result: "pending",
      notes: `Signal key: ${signal.signalKey}`,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to persist signal log.");
  }

  return data.id as string;
}

export async function persistTriggeredAlerts(params: {
  userId: string;
  settings: UserSettings;
  gameId: string;
  game: ExternalHockeyGame;
  evaluatedSignals: EvaluatedSignal[];
}) {
  const admin = createAdminClient();
  let alertsCreated = 0;
  let liveSignalsCreated = 0;

  for (const signal of params.evaluatedSignals.filter((entry) => entry.triggerConditionMet)) {
    const { data: existingSignal } = await admin
      .from("live_signals")
      .select("id")
      .eq("user_id", params.userId)
      .eq("signal_key", signal.signalKey)
      .maybeSingle();

    let liveSignalId = existingSignal?.id as string | undefined;

    if (!liveSignalId) {
      const { data: insertedSignal, error: signalError } = await admin
        .from("live_signals")
        .insert({
          user_id: params.userId,
          game_id: params.gameId,
          rule_type: signal.ruleType,
          signal_key: signal.signalKey,
          selected_team: signal.selectedTeam,
          selected_team_side: signal.selectedTeamSide,
          period1_goals: signal.period1Goals,
          period2_goals: signal.period2Goals,
          trigger_condition_met: signal.triggerConditionMet,
          triggered_at: new Date().toISOString(),
          source_provider: params.game.source,
          payload: params.game.rawPayload,
        })
        .select("id")
        .single();

      if (signalError || !insertedSignal) {
        throw new Error(signalError?.message ?? "Failed to create live signal.");
      }

      liveSignalId = insertedSignal.id as string;
      liveSignalsCreated += 1;
      await ensureResearchSignal(admin, params.userId, params.game, signal);
    }

    const channels = getEnabledNotificationChannels(params.settings);
    const copy = buildAlertCopy(params.game, signal);

    for (const channel of channels) {
      const fingerprint = `${params.userId}:${signal.signalKey}:${channel}`;
      const { data: existingAlert } = await admin
        .from("alerts")
        .select("id")
        .eq("user_id", params.userId)
        .eq("fingerprint", fingerprint)
        .maybeSingle();

      if (existingAlert) {
        continue;
      }

      const initialStatus = channel === "dashboard" ? "sent" : channel === "push" ? "queued" : "pending";
      const { data: insertedAlert, error: alertError } = await admin.from("alerts").insert({
        user_id: params.userId,
        live_signal_id: liveSignalId,
        alert_type: signal.ruleType,
        channel,
        title: copy.title,
        body: copy.body,
        status: initialStatus,
        fingerprint,
        payload: {
          sport: "hockey",
          gameId: params.game.externalMatchId,
          league: params.game.league,
          selectedTeam: signal.selectedTeam,
        },
      }).select("*").single();

      if (!alertError && insertedAlert) {
        if (channel === "push") {
          const delivery = await deliverPushAlert(insertedAlert as { [key: string]: unknown } as import("@/lib/types/database").AlertRecord);
          await admin
            .from("alerts")
            .update({
              status: delivery.delivered ? "sent" : "failed",
              delivered_at: delivery.delivered ? new Date().toISOString() : null,
              payload: {
                ...(((insertedAlert as { payload?: Record<string, unknown> | null }).payload ?? {}) as Record<string, unknown>),
                pushDelivery: {
                  provider: delivery.provider,
                  sentCount: delivery.sentCount,
                  failedCount: delivery.failedCount,
                  revokedCount: delivery.revokedCount,
                  reason: delivery.reason,
                },
              },
            })
            .eq("id", String((insertedAlert as { id: string }).id));
        }

        alertsCreated += 1;
      }
    }
  }

  return { alertsCreated, liveSignalsCreated };
}

export async function upsertGameRecord(game: ExternalHockeyGame) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("games")
    .upsert(
      {
        provider: game.source,
        external_game_id: game.externalMatchId,
        league_name: game.league,
        status: game.status,
        start_time: game.startTime,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        home_score: game.homeScore,
        away_score: game.awayScore,
        period1_home_goals: game.period1HomeGoals ?? 0,
        period1_away_goals: game.period1AwayGoals ?? 0,
        period2_home_goals: game.period2HomeGoals ?? 0,
        period2_away_goals: game.period2AwayGoals ?? 0,
        raw_payload: game.rawPayload,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "provider,external_game_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to upsert game record.");
  }

  return data.id as string;
}
