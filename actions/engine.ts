"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { captureOddsSnapshotsForUser, runProviderIngestForUser } from "@/lib/services/liveIngest";
import type { TrackedMatchRecord, UserSettings } from "@/lib/types/database";

export type EngineActionState = {
  error: string;
  success: string;
};

async function loadSettingsAndMatches() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

export async function runManualLiveSyncAction(prevState: EngineActionState): Promise<EngineActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { error: "", success: "Mock mode active. Add Supabase SQL tables to persist provider ingest runs." };
  }

  const { user, settings } = await loadSettingsAndMatches();
  if (!user || !settings) {
    return { error: "User settings not found. Save your league settings first.", success: "" };
  }

  const result = await runProviderIngestForUser(settings);
  revalidatePath("/member");
  revalidatePath("/member/engine");
  revalidatePath("/member/signals");

  return {
    error: "",
    success: `${result.provider} sync stored ${result.matchesCreated} matches and ${result.oddsCreated} odds snapshots. Auto triggers created: ${result.signalsCreated}.`,
  };
}

export async function runManualOddsSyncAction(prevState: EngineActionState): Promise<EngineActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { error: "", success: "Mock mode active. Add Supabase SQL tables to persist odds snapshots." };
  }

  const { user, settings, matches } = await loadSettingsAndMatches();
  if (!user || !settings) {
    return { error: "User settings not found. Save your league settings first.", success: "" };
  }

  const result = await captureOddsSnapshotsForUser(settings, matches);
  revalidatePath("/member");
  revalidatePath("/member/engine");

  return {
    error: "",
    success: `Odds sync captured ${result.snapshotsCreated} new snapshots.`,
  };
}
