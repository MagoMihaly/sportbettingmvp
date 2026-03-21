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

function buildStats(
  signals: SignalRecord[],
  alerts: AlertRecord[],
  settings: UserSettings | null,
  trackedMatches: TrackedMatchRecord[],
  oddsSnapshots: OddsSnapshotRecord[],
  pushSubscriptions: PushSubscriptionRecord[],
) {
  return {
    totalSignals: signals.length,
    activeLeagues: settings?.selected_leagues.length ?? 0,
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

export async function getDashboardData(): Promise<DashboardPayload> {
  if (!hasSupabaseEnv()) {
    return getMockPayload();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return getMockPayload();
  }

  const [
    { data: profile },
    { data: signals },
    { data: alerts },
    { data: settings },
    { data: pushSubscriptions },
    { data: trackedMatches },
    { data: oddsSnapshots },
    { data: ingestRuns },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("signals").select("*").order("match_start_time", { ascending: false }).limit(12),
    supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(12),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("push_subscriptions").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
    supabase.from("tracked_matches").select("*").order("last_synced_at", { ascending: false }).limit(12),
    supabase.from("odds_snapshots").select("*").order("captured_at", { ascending: false }).limit(20),
    supabase.from("ingest_runs").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const resolvedSignals = (signals ?? []) as SignalRecord[];
  const resolvedAlerts = (alerts ?? []) as AlertRecord[];
  const resolvedSettings = (settings as UserSettings | null) ?? null;
  const resolvedPushSubscriptions = (pushSubscriptions ?? []) as PushSubscriptionRecord[];
  const resolvedTrackedMatches = (trackedMatches ?? []) as TrackedMatchRecord[];
  const resolvedOddsSnapshots = (oddsSnapshots ?? []) as OddsSnapshotRecord[];
  const resolvedIngestRuns = (ingestRuns ?? []) as IngestRunRecord[];

  return {
    viewer: {
      userId: user.id,
      email: user.email ?? "member@ehse.local",
      isDemo: false,
    },
    profile: (profile as ProfileRecord | null) ?? null,
    signals: resolvedSignals,
    alerts: resolvedAlerts,
    settings: resolvedSettings,
    pushSubscriptions: resolvedPushSubscriptions,
    trackedMatches: resolvedTrackedMatches,
    oddsSnapshots: resolvedOddsSnapshots,
    ingestRuns: resolvedIngestRuns,
    provider: getActiveProviderSummary(),
    stats: buildStats(
      resolvedSignals,
      resolvedAlerts,
      resolvedSettings,
      resolvedTrackedMatches,
      resolvedOddsSnapshots,
      resolvedPushSubscriptions,
    ),
  };
}

export async function getEngineData(): Promise<EnginePayload> {
  const payload = await getDashboardData();
  return {
    trackedMatches: payload.trackedMatches,
    oddsSnapshots: payload.oddsSnapshots,
    ingestRuns: payload.ingestRuns,
    settings: payload.settings,
    provider: payload.provider,
  };
}
