import { createAdminClient } from "@/lib/supabase/admin";
import { getEnabledNotificationChannels } from "@/lib/services/notifications";
import type { MlbUserSettings } from "@/lib/types/database";
import type { EvaluatedMlbSignal, ExternalMlbGame } from "@/lib/types/mlb";

function buildAlertCopy(game: ExternalMlbGame, signal: EvaluatedMlbSignal) {
  return {
    title: "MLB live alert",
    body:
      signal.ruleType === "MLB_F5_SCORELESS"
        ? `${game.homeTeam} vs ${game.awayTeam} stayed scoreless through five innings.`
        : `${game.homeTeam} vs ${game.awayTeam} is in inning ${signal.inning ?? "?"} with one run or fewer.`,
  };
}

export async function persistMlbTriggeredAlerts(params: {
  userId: string;
  gameId: string;
  game: ExternalMlbGame;
  settings: MlbUserSettings;
  evaluatedSignals: EvaluatedMlbSignal[];
}) {
  const admin = createAdminClient();
  let liveSignalsCreated = 0;
  let alertsCreated = 0;

  for (const signal of params.evaluatedSignals.filter((entry) => entry.triggerConditionMet)) {
    const { data: existingSignal } = await admin
      .from("mlb_live_signals")
      .select("id")
      .eq("user_id", params.userId)
      .eq("signal_key", signal.signalKey)
      .maybeSingle();

    let liveSignalId = existingSignal?.id as string | undefined;

    if (!liveSignalId) {
      const { data: insertedSignal, error } = await admin
        .from("mlb_live_signals")
        .insert({
          user_id: params.userId,
          game_id: params.gameId,
          rule_type: signal.ruleType,
          signal_key: signal.signalKey,
          market_key: signal.marketKey,
          inning: signal.inning,
          home_score: signal.homeScore,
          away_score: signal.awayScore,
          trigger_condition_met: signal.triggerConditionMet,
          triggered_at: new Date().toISOString(),
          source_provider: params.game.source,
          payload: params.game.rawPayload,
        })
        .select("id")
        .single();

      if (error || !insertedSignal) {
        throw new Error(error?.message ?? "Failed to create MLB live signal.");
      }

      liveSignalId = insertedSignal.id as string;
      liveSignalsCreated += 1;
    }

    const channels = getEnabledNotificationChannels(params.settings);
    const copy = buildAlertCopy(params.game, signal);

    for (const channel of channels) {
      const fingerprint = `${params.userId}:${signal.signalKey}:${channel}`;
      const { data: existingAlert } = await admin
        .from("mlb_alerts")
        .select("id")
        .eq("user_id", params.userId)
        .eq("fingerprint", fingerprint)
        .maybeSingle();

      if (existingAlert) {
        continue;
      }

      const { error } = await admin.from("mlb_alerts").insert({
        user_id: params.userId,
        mlb_live_signal_id: liveSignalId,
        alert_type: signal.ruleType,
        channel,
        title: copy.title,
        body: copy.body,
        status: channel === "dashboard" ? "sent" : "pending",
        fingerprint,
        payload: {
          sport: "mlb",
          marketKey: signal.marketKey,
          externalGameId: params.game.externalGameId,
          league: params.game.leagueName,
        },
      });

      if (!error) {
        alertsCreated += 1;
      }
    }
  }

  return { liveSignalsCreated, alertsCreated };
}
