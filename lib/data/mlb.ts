import {
  mockMlbAlerts,
  mockMlbGames,
  mockMlbPregameSignals,
  mockMlbSettings,
  mockMlbStateSnapshots,
  mockMlbSyncLogs,
} from "@/lib/mock/mlb";
import { mlbPregameStrategies } from "@/lib/config/mlbPregameStrategies";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, isMlbModuleEnabled } from "@/lib/supabase/env";
import { getActiveMlbProviderSummary } from "@/lib/services/mlbLiveIngest";
import type { MlbDashboardPayload } from "@/lib/types/dashboard";
import type {
  MlbAlertRecord,
  MlbGameRecord,
  MlbPregameSignalRecord,
  MlbProviderSyncLogRecord,
  MlbStateSnapshotRecord,
  MlbUserSettings,
} from "@/lib/types/database";

const activeMlbPregameStrategyKeys = new Set<string>(mlbPregameStrategies.map((strategy) => strategy.key));

function filterActiveMlbAlerts<T extends { alert_type?: string }>(rows: T[]) {
  return rows.filter((row) => {
    if (row.alert_type) {
      return activeMlbPregameStrategyKeys.has(row.alert_type);
    }

    return true;
  });
}

function normalizeMlbSettings(settings: MlbUserSettings | null) {
  if (!settings) {
    return null;
  }

  return {
    ...settings,
    selected_systems: [],
    preferred_market_key: "",
    selected_pregame_strategies:
      settings.selected_pregame_strategies?.filter((strategy) => activeMlbPregameStrategyKeys.has(strategy)) ?? [],
  };
}

function getMockPayload(): MlbDashboardPayload {
  return {
    viewer: {
      userId: "demo-mlb-user",
      email: "demo-mlb@ehse.local",
      isDemo: true,
    },
    settings: mockMlbSettings,
    games: mockMlbGames,
    watchlists: [],
    liveSignals: [],
    pregameSignals: mockMlbPregameSignals,
    alerts: mockMlbAlerts,
    oddsSnapshots: [],
    stateSnapshots: mockMlbStateSnapshots,
    syncLogs: mockMlbSyncLogs,
    stats: {
      trackedGames: mockMlbGames.length,
      activeSystems: 0,
      activePregameStrategies: mockMlbSettings.selected_pregame_strategies?.length ?? 0,
      watchlistRows: 0,
      liveSignals: 0,
      triggeredSignals: 0,
      pregameSignals: mockMlbPregameSignals.length,
      qualifiedPregameSignals: mockMlbPregameSignals.filter((signal) => signal.evaluation_status === "qualified").length,
      alertsCount: mockMlbAlerts.length,
      oddsSnapshots: 0,
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
      pregameSignals,
      alerts,
      stateSnapshots,
      syncLogs,
    ] = await Promise.all([
      safeSingleQuery<MlbUserSettings>(supabase.from("mlb_user_settings").select("*").eq("user_id", user.id).maybeSingle()),
      safeListQuery<MlbGameRecord>(supabase.from("mlb_games").select("*").order("last_synced_at", { ascending: false }).limit(20)),
      safeListQuery<MlbPregameSignalRecord>(supabase.from("mlb_pregame_signals").select("*").eq("user_id", user.id).order("evaluated_at", { ascending: false }).limit(20)),
      safeListQuery<MlbAlertRecord>(supabase.from("mlb_alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<MlbStateSnapshotRecord>(supabase.from("mlb_state_snapshots").select("*").eq("user_id", user.id).order("captured_at", { ascending: false }).limit(20)),
      safeListQuery<MlbProviderSyncLogRecord>(supabase.from("mlb_provider_sync_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
    ]);

    const filteredAlerts = filterActiveMlbAlerts(alerts);

    const normalizedSettings = normalizeMlbSettings(settings);

    return {
      viewer: {
        userId: user.id,
        email: user.email ?? "member@ehse.local",
        isDemo: false,
      },
      settings: normalizedSettings,
      games,
      watchlists: [],
      liveSignals: [],
      pregameSignals,
      alerts: filteredAlerts,
      oddsSnapshots: [],
      stateSnapshots,
      syncLogs,
      stats: {
        trackedGames: games.length,
        activeSystems: 0,
        activePregameStrategies: normalizedSettings?.selected_pregame_strategies?.length ?? 0,
        watchlistRows: 0,
        liveSignals: 0,
        triggeredSignals: 0,
        pregameSignals: pregameSignals.length,
        qualifiedPregameSignals: pregameSignals.filter((signal) => signal.evaluation_status === "qualified").length,
        alertsCount: filteredAlerts.length,
        oddsSnapshots: 0,
      },
      provider: getActiveMlbProviderSummary(),
    };
  } catch (error) {
    console.warn("[mlb-dashboard] falling back to mock payload", error);
    return getMockPayload();
  }
}
