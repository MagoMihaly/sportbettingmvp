"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { captureOddsSnapshotsForUser, runProviderIngestForUser } from "@/lib/services/liveIngest";
import { runMlbProviderIngestForUser } from "@/lib/services/mlbLiveIngest";
import { captureSoccerOddsSnapshotsForUser, runSoccerProviderIngestForUser } from "@/lib/services/soccerLiveIngest";
import type {
  MlbUserSettings,
  SoccerGameRecord,
  SoccerUserSettings,
  TrackedMatchRecord,
  UserSettings,
} from "@/lib/types/database";

export type EngineActionState = {
  error: string;
  success: string;
};

const initialSuccess = { error: "", success: "" };

async function getBaseContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

async function loadHockeyContext() {
  const { supabase, user } = await getBaseContext();

  if (!user) {
    return { user: null, settings: null, matches: [] as TrackedMatchRecord[] };
  }

  const [{ data: settings }, { data: matches }] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("tracked_matches").select("*").eq("user_id", user.id).order("last_synced_at", { ascending: false }).limit(12),
  ]);

  return {
    user,
    settings: settings as UserSettings | null,
    matches: (matches ?? []) as TrackedMatchRecord[],
  };
}

async function loadSoccerContext() {
  const { supabase, user } = await getBaseContext();

  if (!user) {
    return { user: null, settings: null, games: [] as SoccerGameRecord[] };
  }

  const [{ data: settings }, { data: games }] = await Promise.all([
    supabase.from("soccer_user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("soccer_games").select("*").order("last_synced_at", { ascending: false }).limit(16),
  ]);

  return {
    user,
    settings: settings as SoccerUserSettings | null,
    games: (games ?? []) as SoccerGameRecord[],
  };
}

async function loadMlbContext() {
  const { supabase, user } = await getBaseContext();

  if (!user) {
    return { user: null, settings: null };
  }

  const { data: settings } = await supabase.from("mlb_user_settings").select("*").eq("user_id", user.id).maybeSingle();

  return {
    user,
    settings: settings as MlbUserSettings | null,
  };
}

function revalidateEnginePaths() {
  revalidatePath("/member");
  revalidatePath("/member/engine");
  revalidatePath("/member/hockey");
  revalidatePath("/member/soccer");
  revalidatePath("/member/mlb");
  revalidatePath("/member/signals");
  revalidatePath("/member/soccer/signals");
  revalidatePath("/member/mlb/signals");
}

export async function runManualLiveSyncAction(prevState: EngineActionState): Promise<EngineActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { ...initialSuccess, success: "Mock mode active. Add Supabase SQL tables to persist provider ingest runs." };
  }

  const { user, settings } = await loadHockeyContext();
  if (!user || !settings) {
    return { error: "Hockey user settings not found. Save your hockey league settings first.", success: "" };
  }

  const result = await runProviderIngestForUser(settings);
  revalidateEnginePaths();

  return {
    error: "",
    success: `${result.provider} sync stored ${result.matchesCreated} matches, ${result.oddsCreated} odds snapshots, ${result.signalsCreated} live signals and ${result.alertsCreated} alerts.`,
  };
}

export async function runManualOddsSyncAction(prevState: EngineActionState): Promise<EngineActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { ...initialSuccess, success: "Mock mode active. Add Supabase SQL tables to persist odds snapshots." };
  }

  const { user, settings, matches } = await loadHockeyContext();
  if (!user || !settings) {
    return { error: "Hockey user settings not found. Save your hockey league settings first.", success: "" };
  }

  const result = await captureOddsSnapshotsForUser(settings, matches);
  revalidateEnginePaths();

  return {
    error: "",
    success: `Hockey odds sync captured ${result.snapshotsCreated} new snapshots.`,
  };
}

export async function runManualSoccerLiveSyncAction(prevState: EngineActionState): Promise<EngineActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { ...initialSuccess, success: "Mock mode active. Soccer ingest falls back to demo-safe payloads until Supabase is connected." };
  }

  const { user, settings } = await loadSoccerContext();
  if (!user || !settings) {
    return { error: "Soccer settings not found. Save your soccer settings first.", success: "" };
  }

  const result = await runSoccerProviderIngestForUser(settings);
  revalidateEnginePaths();

  if (result.error) {
    return { error: result.error, success: "" };
  }

  return {
    error: "",
    success: `${result.provider} sync stored ${result.gamesCreated} games, ${result.watchlistsCreated} watchlist rows, ${result.oddsCreated} odds snapshots and ${result.alertsCreated} alerts.`,
  };
}

export async function runManualSoccerOddsSyncAction(prevState: EngineActionState): Promise<EngineActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { ...initialSuccess, success: "Mock mode active. Soccer odds sync falls back to demo-safe payloads until Supabase is connected." };
  }

  const { user, settings, games } = await loadSoccerContext();
  if (!user || !settings) {
    return { error: "Soccer settings not found. Save your soccer settings first.", success: "" };
  }

  const result = await captureSoccerOddsSnapshotsForUser(settings, games);
  revalidateEnginePaths();

  if (result.error) {
    return { error: result.error, success: "" };
  }

  return {
    error: "",
    success: `Soccer odds sync captured ${result.snapshotsCreated} new snapshots.`,
  };
}

export async function runManualMlbLiveSyncAction(prevState: EngineActionState): Promise<EngineActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { ...initialSuccess, success: "Mock mode active. MLB sync uses the internal mock provider until Supabase is connected." };
  }

  const { user, settings } = await loadMlbContext();
  if (!user || !settings) {
    return { error: "MLB settings not found. Save your MLB settings first.", success: "" };
  }

  const result = await runMlbProviderIngestForUser(settings);
  revalidateEnginePaths();

  if (result.error) {
    return { error: result.error, success: "" };
  }

  return {
    error: "",
    success: `${result.provider} sync stored ${result.gamesCreated} games, evaluated ${result.pregameSignalsEvaluated} pre-game series spots, qualified ${result.qualifiedPregameSignals} signals and prepared ${result.alertsCreated} alerts.`,
  };
}
