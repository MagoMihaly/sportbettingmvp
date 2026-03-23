import { createAdminClient } from "@/lib/supabase/admin";
import { getEnabledNotificationChannels } from "@/lib/services/notifications";
import type { SoccerUserSettings } from "@/lib/types/database";
import type { EvaluatedSoccerSignal, ExternalSoccerGame } from "@/lib/types/soccer";

function buildAlertCopy(game: ExternalSoccerGame, signal: EvaluatedSoccerSignal) {
  return {
    title: "Soccer live alert",
    body:
      signal.ruleType === "SOCCER_HT_0_0_OVER_1_5"
        ? `${game.homeTeam} vs ${game.awayTeam} reached HT 0-0 in ${game.leagueName}.`
        : `${game.homeTeam} vs ${game.awayTeam} is 0-0 from minute ${signal.minute ?? "?"} in ${game.leagueName}.`,
  };
}

export async function persistSoccerTriggeredAlerts(params: {
  userId: string;
  gameId: string;
  game: ExternalSoccerGame;
  settings: SoccerUserSettings;
  evaluatedSignals: EvaluatedSoccerSignal[];
}) {
  const admin = createAdminClient();
  let liveSignalsCreated = 0;
  let alertsCreated = 0;

  for (const signal of params.evaluatedSignals.filter((entry) => entry.triggerConditionMet)) {
    const { data: existingSignal } = await admin
      .from("soccer_live_signals")
      .select("id")
      .eq("user_id", params.userId)
      .eq("signal_key", signal.signalKey)
      .maybeSingle();

    let liveSignalId = existingSignal?.id as string | undefined;

    if (!liveSignalId) {
      const { data: insertedSignal, error } = await admin
        .from("soccer_live_signals")
        .insert({
          user_id: params.userId,
          game_id: params.gameId,
          rule_type: signal.ruleType,
          signal_key: signal.signalKey,
          market_key: signal.marketKey,
          home_score: signal.homeScore,
          away_score: signal.awayScore,
          minute: signal.minute,
          trigger_condition_met: signal.triggerConditionMet,
          triggered_at: new Date().toISOString(),
          source_provider: params.game.source,
          payload: params.game.rawPayload,
        })
        .select("id")
        .single();

      if (error || !insertedSignal) {
        throw new Error(error?.message ?? "Failed to create soccer live signal.");
      }

      liveSignalId = insertedSignal.id as string;
      liveSignalsCreated += 1;
    }

    const channels = getEnabledNotificationChannels(params.settings);
    const copy = buildAlertCopy(params.game, signal);

    for (const channel of channels) {
      const fingerprint = `${params.userId}:${signal.signalKey}:${channel}`;
      const { data: existingAlert } = await admin
        .from("soccer_alerts")
        .select("id")
        .eq("user_id", params.userId)
        .eq("fingerprint", fingerprint)
        .maybeSingle();

      if (existingAlert) {
        continue;
      }

      const { error } = await admin.from("soccer_alerts").insert({
        user_id: params.userId,
        soccer_live_signal_id: liveSignalId,
        alert_type: signal.ruleType,
        channel,
        title: copy.title,
        body: copy.body,
        status: channel === "dashboard" ? "sent" : "pending",
        fingerprint,
        payload: {
          sport: "soccer",
          marketKey: signal.marketKey,
          externalGameId: params.game.externalMatchId,
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