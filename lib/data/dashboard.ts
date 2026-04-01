import {
  mockAlerts,
  mockIngestRuns,
  mockOddsSnapshots,
  mockProfile,
  mockPushSubscriptions,
  mockSettings,
  mockSignals,
  mockTrackedMatches,
} from "@/lib/mock/signals";
import { sanitizeHockeyLeagues } from "@/lib/config/leagues";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveProviderSummary } from "@/lib/services/liveIngest";
import type { DashboardPayload, EnginePayload } from "@/lib/types/dashboard";
import type {
  AlertRecord,
  IngestRunRecord,
  OddsSnapshotRecord,
  ProfileRecord,
  PushSubscriptionRecord,
  SignalRecord,
  TrackedMatchRecord,
  UserSettings,
} from "@/lib/types/database";

type QueryResult<T> = {
  data: T;
  failed: boolean;
};

function buildStats(
  signals: SignalRecord[],
  alerts: AlertRecord[],
  settings: UserSettings | null,
  trackedMatches: TrackedMatchRecord[],
  oddsSnapshots: OddsSnapshotRecord[],
  pushSubscriptions: PushSubscriptionRecord[],
) {
  const selectedLeagues = sanitizeHockeyLeagues(settings?.selected_leagues);

  return {
    totalSignals: signals.length,
    activeLeagues: selectedLeagues.length,
    triggeredSignals: signals.filter((signal) => signal.trigger_condition_met).length,
    wonSignals: signals.filter((signal) => signal.result === "won").length,
    lostSignals: signals.filter((signal) => signal.result === "lost").length,
    pendingSignals: signals.filter((signal) => signal.result === "pending").length,
    notificationStatus: settings?.notifications_enabled ? "Armed" : "Muted",
    trackedMatches: trackedMatches.length,
    oddsSnapshots: oddsSnapshots.length,
    alertsCount: alerts.length,
    activePushSubscriptions: pushSubscriptions.filter((subscription) => subscription.status === "active").length,
  };
}

function getMockPayload(): DashboardPayload {
  return {
    viewer: {
      userId: "demo-user",
      email: mockProfile.email ?? "demo@ehse.local",
      isDemo: true,
    },
    profile: mockProfile,
    signals: mockSignals,
    alerts: mockAlerts,
    settings: mockSettings,
    pushSubscriptions: mockPushSubscriptions,
    trackedMatches: mockTrackedMatches,
    oddsSnapshots: mockOddsSnapshots,
    ingestRuns: mockIngestRuns,
    provider: getActiveProviderSummary(),
    stats: buildStats(mockSignals, mockAlerts, mockSettings, mockTrackedMatches, mockOddsSnapshots, mockPushSubscriptions),
  };
}

async function safeListQuery<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<QueryResult<T[]>> {
  try {
    const { data, error } = await query;

    if (error) {
      console.warn(`[dashboard] list query failed: ${error.message}`);
      return { data: [], failed: true };
    }

    return { data: (data ?? []) as T[], failed: false };
  } catch (error) {
    console.warn("[dashboard] list query threw", error);
    return { data: [], failed: true };
  }
}

async function safeSingleQuery<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<QueryResult<T | null>> {
  try {
    const { data, error } = await query;

    if (error) {
      console.warn(`[dashboard] single query failed: ${error.message}`);
      return { data: null, failed: true };
    }

    return { data: (data ?? null) as T | null, failed: false };
  } catch (error) {
    console.warn("[dashboard] single query threw", error);
    return { data: null, failed: true };
  }
}

export async function getDashboardData(): Promise<DashboardPayload> {
  if (!hasSupabaseEnv()) {
    return getMockPayload();
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError) {
        console.warn(`[dashboard] auth lookup failed: ${userError.message}`);
      }
      return getMockPayload();
    }

    const [
      profileResult,
      signalsResult,
      alertsResult,
      settingsResult,
      pushSubscriptionsResult,
      trackedMatchesResult,
      oddsSnapshotsResult,
      ingestRunsResult,
    ] = await Promise.all([
      safeSingleQuery<ProfileRecord>(supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()),
      safeListQuery<SignalRecord>(supabase.from("signals").select("*").order("match_start_time", { ascending: false }).limit(12)),
      safeListQuery<AlertRecord>(supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(12)),
      safeSingleQuery<UserSettings>(supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()),
      safeListQuery<PushSubscriptionRecord>(supabase.from("push_subscriptions").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5)),
      safeListQuery<TrackedMatchRecord>(supabase.from("tracked_matches").select("*").order("last_synced_at", { ascending: false }).limit(12)),
      safeListQuery<OddsSnapshotRecord>(supabase.from("odds_snapshots").select("*").order("captured_at", { ascending: false }).limit(20)),
      safeListQuery<IngestRunRecord>(supabase.from("ingest_runs").select("*").order("created_at", { ascending: false }).limit(10)),
    ]);

    const profile = profileResult.data ?? null;
    const signals = signalsResult.data;
    const alerts = alertsResult.data;
    const settings = settingsResult.data
      ? {
          ...settingsResult.data,
          selected_leagues: sanitizeHockeyLeagues(settingsResult.data.selected_leagues),
        }
      : null;
    const pushSubscriptions = pushSubscriptionsResult.data;
    const trackedMatches = trackedMatchesResult.data;
    const oddsSnapshots = oddsSnapshotsResult.data;
    const ingestRuns = ingestRunsResult.data;

    return {
      viewer: {
        userId: user.id,
        email: user.email ?? "member@ehse.local",
        isDemo: false,
      },
      profile,
      signals,
      alerts,
      settings,
      pushSubscriptions,
      trackedMatches,
      oddsSnapshots,
      ingestRuns,
      provider: getActiveProviderSummary(),
      stats: buildStats(
        signals,
        alerts,
        settings,
        trackedMatches,
        oddsSnapshots,
        pushSubscriptions,
      ),
    };
  } catch (error) {
    console.warn("[dashboard] falling back to mock payload", error);
    return getMockPayload();
  }
}

export async function getEngineData(): Promise<EnginePayload> {
  const payload = await getDashboardData();
  return {
    trackedMatches: payload.trackedMatches,
    oddsSnapshots: payload.oddsSnapshots,
    ingestRuns: payload.ingestRuns.filter((run) => run.run_type === "odds_sync").slice(0, 3),
    settings: payload.settings,
    provider: payload.provider,
  };
}
