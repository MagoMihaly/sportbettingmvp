import {
  mockSoccerAlerts,
  mockSoccerDataQualityFlags,
  mockSoccerGames,
  mockSoccerLiveSignals,
  mockSoccerOddsSnapshots,
  mockSoccerSettings,
  mockSoccerStateSnapshots,
  mockSoccerSyncLogs,
  mockSoccerWatchlists,
} from "@/lib/mock/soccer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, isSoccerModuleEnabled } from "@/lib/supabase/env";
import { getActiveSoccerProviderSummary } from "@/lib/services/soccerLiveIngest";
import type { SoccerDashboardPayload } from "@/lib/types/dashboard";
import type {
  SoccerAlertRecord,
  SoccerDataQualityFlagRecord,
  SoccerGameRecord,
  SoccerLiveSignalRecord,
  SoccerMatchStateSnapshotRecord,
  SoccerOddsSnapshotRecord,
  SoccerProviderSyncLogRecord,
  SoccerUserSettings,
  SoccerWatchlistRecord,
} from "@/lib/types/database";

function getMockPayload(): SoccerDashboardPayload {
  return {
    viewer: {
      userId: "demo-soccer-user",
      email: "demo-soccer@ehse.local",
      isDemo: true,
    },
    settings: mockSoccerSettings,
    games: mockSoccerGames,
    watchlists: mockSoccerWatchlists,
    liveSignals: mockSoccerLiveSignals,
    alerts: mockSoccerAlerts,
    oddsSnapshots: mockSoccerOddsSnapshots,
    stateSnapshots: mockSoccerStateSnapshots,
    syncLogs: mockSoccerSyncLogs,
    dataQualityFlags: mockSoccerDataQualityFlags,
    stats: {
      trackedGames: mockSoccerGames.length,
      activeLeagues: mockSoccerSettings.selected_leagues.length,
      watchlistRows: mockSoccerWatchlists.length,
      liveSignals: mockSoccerLiveSignals.length,
      triggeredSignals: mockSoccerLiveSignals.filter((signal) => signal.trigger_condition_met).length,
      alertsCount: mockSoccerAlerts.length,
      oddsSnapshots: mockSoccerOddsSnapshots.length,
      dataQualityFlags: mockSoccerDataQualityFlags.length,
    },
    provider: getActiveSoccerProviderSummary(),
  };
}

async function safeListQuery<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`[soccer-dashboard] list query failed: ${error.message}`);
      return [] as T[];
    }
    return (data ?? []) as T[];
  } catch (error) {
    console.warn("[soccer-dashboard] list query threw", error);
    return [] as T[];
  }
}

async function safeSingleQuery<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`[soccer-dashboard] single query failed: ${error.message}`);
      return null as T | null;
    }
    return (data ?? null) as T | null;
  } catch (error) {
    console.warn("[soccer-dashboard] single query threw", error);
    return null as T | null;
  }
}

export async function getSoccerDashboardData(): Promise<SoccerDashboardPayload> {
  if (!isSoccerModuleEnabled() || !hasSupabaseEnv()) {
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
      dataQualityFlags,
    ] = await Promise.all([
      safeSingleQuery<SoccerUserSettings>(supabase.from("soccer_user_settings").select("*").eq("user_id", user.id).maybeSingle()),
      safeListQuery<SoccerGameRecord>(supabase.from("soccer_games").select("*").order("last_synced_at", { ascending: false }).limit(20)),
      safeListQuery<SoccerWatchlistRecord>(supabase.from("soccer_watchlists").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<SoccerLiveSignalRecord>(supabase.from("soccer_live_signals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<SoccerAlertRecord>(supabase.from("soccer_alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<SoccerOddsSnapshotRecord>(supabase.from("soccer_odds_snapshots").select("*").eq("user_id", user.id).order("captured_at", { ascending: false }).limit(20)),
      safeListQuery<SoccerMatchStateSnapshotRecord>(supabase.from("soccer_match_state_snapshots").select("*").eq("user_id", user.id).order("captured_at", { ascending: false }).limit(20)),
      safeListQuery<SoccerProviderSyncLogRecord>(supabase.from("soccer_provider_sync_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
      safeListQuery<SoccerDataQualityFlagRecord>(supabase.from("soccer_data_quality_flags").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)),
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
      dataQualityFlags,
      stats: {
        trackedGames: games.length,
        activeLeagues: settings?.selected_leagues.length ?? 0,
        watchlistRows: watchlists.length,
        liveSignals: liveSignals.length,
        triggeredSignals: liveSignals.filter((signal) => signal.trigger_condition_met).length,
        alertsCount: alerts.length,
        oddsSnapshots: oddsSnapshots.length,
        dataQualityFlags: dataQualityFlags.length,
      },
      provider: getActiveSoccerProviderSummary(),
    };
  } catch (error) {
    console.warn("[soccer-dashboard] falling back to mock payload", error);
    return getMockPayload();
  }
}