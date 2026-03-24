import {
  mockMlbAlerts,
  mockMlbGames,
  mockMlbLiveSignals,
  mockMlbOddsSnapshots,
  mockMlbSettings,
  mockMlbStateSnapshots,
  mockMlbSyncLogs,
  mockMlbWatchlists,
} from "@/lib/mock/mlb";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, isMlbModuleEnabled } from "@/lib/supabase/env";
import { getActiveMlbProviderSummary } from "@/lib/services/mlbLiveIngest";
import type { MlbDashboardPayload } from "@/lib/types/dashboard";
import type {
  MlbAlertRecord,
  MlbGameRecord,
  MlbLiveSignalRecord,
  MlbOddsSnapshotRecord,
  MlbProviderSyncLogRecord,
  MlbStateSnapshotRecord,
  MlbUserSettings,
  MlbWatchlistRecord,
} from "@/lib/types/database";

function getMockPayload(): MlbDashboardPayload {
  return {
    viewer: {
      userId: "demo-mlb-user",
      email: "demo-mlb@ehse.local",
      isDemo: true,
    },
    settings: mockMlbSettings,
    games: mockMlbGames,
    watchlists: mockMlbWatchlists,
    liveSignals: mockMlbLiveSignals,
    alerts: mockMlbAlerts,
    oddsSnapshots: mockMlbOddsSnapshots,
    stateSnapshots: mockMlbStateSnapshots,
    syncLogs: mockMlbSyncLogs,
    stats: {
      trackedGames: mockMlbGames.length,
      activeSystems: mockMlbSettings.selected_systems.length,
      watchlistRows: mockMlbWatchlists.length,
      liveSignals: mockMlbLiveSignals.length,
      triggeredSignals: mockMlbLiveSignals.filter((signal) => signal.trigger_condition_met).length,
      alertsCount: mockMlbAlerts.length,
      oddsSnapshots: mockMlbOddsSnapshots.length,
    },
    provider: getActiveMlbProviderSummary(),
  };
}

async function safeListQuery<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`[mlb-dashboard] list query failed: ${error.message}`);
      return [] as T[];
    }
    return (data ?? []) as T[];
  } catch (error) {
    console.warn("[mlb-dashboard] list query threw", error);
    return [] as T[];
  }
}

async function safeSingleQuery<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`[mlb-dashboard] single query failed: ${error.message}`);
      return null as T | null;
    }
    return (data ?? null) as T | null;
  } catch (error) {
    console.warn("[mlb-dashboard] single query threw", error);
    return null as T | null;
  }
}

export async function getMlbDashboardData(): Promise<MlbDashboardPayload> {
  if (!isMlbModuleEnabled() || !hasSupabaseEnv()) {
    return getMockPayload();
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return getMockPayload();
    }

    const [
      settings,
      games,
      watchlists,
      liveSignals,
      alerts,
      oddsSnapshots,
      stateSnapshots,
      syncLogs,
    ] = await Promise.all([
      safeSingleQuery<MlbUserSettings>(supabase.from("mlb_user_settings").select("*").eq("user_id", user.id).maybeSingle()),
      safeListQuery<MlbGameRecord>(supabase.from("mlb_games").select("*").order("last_synced_at", { ascending: false }).limit(20)),
      safeListQuery<MlbWatchlistRecord>(supabase.from("mlb_watchlists").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<MlbLiveSignalRecord>(supabase.from("mlb_live_signals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<MlbAlertRecord>(supabase.from("mlb_alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<MlbOddsSnapshotRecord>(supabase.from("mlb_odds_snapshots").select("*").eq("user_id", user.id).order("captured_at", { ascending: false }).limit(20)),
      safeListQuery<MlbStateSnapshotRecord>(supabase.from("mlb_state_snapshots").select("*").eq("user_id", user.id).order("captured_at", { ascending: false }).limit(20)),
      safeListQuery<MlbProviderSyncLogRecord>(supabase.from("mlb_provider_sync_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
    ]);

    return {
      viewer: {
        userId: user.id,
        email: user.email ?? "member@ehse.local",
        isDemo: false,
      },
      settings,
      games,
      watchlists,
      liveSignals,
      alerts,
      oddsSnapshots,
      stateSnapshots,
      syncLogs,
      stats: {
        trackedGames: games.length,
        activeSystems: settings?.selected_systems.length ?? 0,
        watchlistRows: watchlists.length,
        liveSignals: liveSignals.length,
        triggeredSignals: liveSignals.filter((signal) => signal.trigger_condition_met).length,
        alertsCount: alerts.length,
        oddsSnapshots: oddsSnapshots.length,
      },
      provider: getActiveMlbProviderSummary(),
    };
  } catch (error) {
    console.warn("[mlb-dashboard] falling back to mock payload", error);
    return getMockPayload();
  }
}
