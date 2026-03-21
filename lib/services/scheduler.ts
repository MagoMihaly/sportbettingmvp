import { captureOddsSnapshotsForAllUsers, runProviderIngestForAllUsers } from "@/lib/services/liveIngest";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function runScheduledTriggerCheck() {
  if (!hasSupabaseEnv()) {
    return {
      job: "check-hockey-triggers",
      mode: "demo",
      ok: true,
      result: {
        runsCreated: 0,
        matchesCreated: 0,
        oddsCreated: 0,
        signalsCreated: 0,
        alertsCreated: 0,
      },
    };
  }

  const result = await runProviderIngestForAllUsers();
  return {
    job: "check-hockey-triggers",
    mode: "live",
    ok: true,
    result,
  };
}

export async function runScheduledOddsSync() {
  if (!hasSupabaseEnv()) {
    return {
      job: "capture-odds-snapshots",
      mode: "demo",
      ok: true,
      result: {
        runsCreated: 0,
        snapshotsCreated: 0,
      },
    };
  }

  const result = await captureOddsSnapshotsForAllUsers();
  return {
    job: "capture-odds-snapshots",
    mode: "live",
    ok: true,
    result,
  };
}
