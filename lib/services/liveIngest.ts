import { createHockeyProvider } from "@/lib/providers/hockeyApi";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { isEligibleThirdPeriodTrigger } from "@/lib/services/signalEngine";
import type { TrackedMatchRecord, UserSettings } from "@/lib/types/database";
import type { ExternalHockeyFixture } from "@/lib/types/provider";

const provider = createHockeyProvider();

function determineSelection(fixture: ExternalHockeyFixture) {
  const homeEligible = fixture.period1HomeGoals !== null && fixture.period2HomeGoals !== null
    ? isEligibleThirdPeriodTrigger(fixture.period1HomeGoals, fixture.period2HomeGoals)
    : false;
  const awayEligible = fixture.period1AwayGoals !== null && fixture.period2AwayGoals !== null
    ? isEligibleThirdPeriodTrigger(fixture.period1AwayGoals, fixture.period2AwayGoals)
    : false;

  if (homeEligible) {
    return {
      selectedTeam: fixture.homeTeam,
      selectedTeamSide: "home" as const,
      period1Goals: fixture.period1HomeGoals,
      period2Goals: fixture.period2HomeGoals,
      triggerConditionMet: true,
    };
  }

  if (awayEligible) {
    return {
      selectedTeam: fixture.awayTeam,
      selectedTeamSide: "away" as const,
      period1Goals: fixture.period1AwayGoals,
      period2Goals: fixture.period2AwayGoals,
      triggerConditionMet: true,
    };
  }

  return {
    selectedTeam: fixture.homeTeam,
    selectedTeamSide: "home" as const,
    period1Goals: fixture.period1HomeGoals ?? 0,
    period2Goals: fixture.period2HomeGoals ?? 0,
    triggerConditionMet: false,
  };
}

export function getActiveProviderSummary() {
  return {
    providerKey: provider.providerKey,
    displayName: provider.displayName,
    supportsAutomaticTriggers: provider.supportsAutomaticTriggers,
  };
}

export async function buildTrackedMatches(settings: UserSettings) {
  const fixtures = await provider.getUpcomingFixtures(settings.selected_leagues);
  return fixtures.map((fixture) => ({ fixture, selection: determineSelection(fixture) }));
}

async function upsertTrackedMatch(admin: ReturnType<typeof createAdminClient>, settings: UserSettings, fixture: ExternalHockeyFixture) {
  const now = new Date().toISOString();

  const { data: trackedMatch, error } = await admin
    .from("tracked_matches")
    .upsert(
      {
        user_id: settings.user_id,
        external_match_id: fixture.externalMatchId,
        league: fixture.league,
        home_team: fixture.homeTeam,
        away_team: fixture.awayTeam,
        match_start_time: fixture.startTime,
        home_score: fixture.homeScore,
        away_score: fixture.awayScore,
        period1_home_goals: fixture.period1HomeGoals ?? 0,
        period1_away_goals: fixture.period1AwayGoals ?? 0,
        period2_home_goals: fixture.period2HomeGoals ?? 0,
        period2_away_goals: fixture.period2AwayGoals ?? 0,
        source: fixture.source,
        ingest_status: "synced",
        last_synced_at: now,
        raw_payload: fixture.rawPayload,
      },
      { onConflict: "user_id,external_match_id" },
    )
    .select("id")
    .single();

  if (error || !trackedMatch) {
    throw new Error(error?.message ?? "Failed to upsert tracked match.");
  }

  return trackedMatch.id as string;
}

async function insertSignalIfTriggered(
  admin: ReturnType<typeof createAdminClient>,
  settings: UserSettings,
  fixture: ExternalHockeyFixture,
) {
  const selection = determineSelection(fixture);

  if (!selection.triggerConditionMet) {
    return false;
  }

  const { error } = await admin.from("signals").insert({
    user_id: settings.user_id,
    sport: "ice_hockey",
    league: fixture.league,
    match_id: fixture.externalMatchId,
    home_team: fixture.homeTeam,
    away_team: fixture.awayTeam,
    match_start_time: fixture.startTime,
    selected_team: selection.selectedTeam,
    selected_team_side: selection.selectedTeamSide,
    period1_goals: selection.period1Goals,
    period2_goals: selection.period2Goals,
    trigger_condition_met: true,
    trigger_time: new Date().toISOString(),
    odds: fixture.odds,
    bookmaker: fixture.bookmaker,
    stake: 1,
    status: "triggered",
    result: "pending",
    notes: `Created by ${provider.displayName} ingest pipeline.`,
  });

  return !error;
}

export async function runProviderIngestForUser(settings: UserSettings) {
  if (!hasSupabaseEnv()) {
    return { matchesCreated: 0, oddsCreated: 0, signalsCreated: 0, provider: provider.displayName };
  }

  const admin = createAdminClient();
  const records = await buildTrackedMatches(settings);
  let matchesCreated = 0;
  let oddsCreated = 0;
  let signalsCreated = 0;

  for (const { fixture } of records) {
    const trackedMatchId = await upsertTrackedMatch(admin, settings, fixture);
    matchesCreated += 1;

    if (fixture.odds !== null && fixture.bookmaker) {
      const { error: oddsError } = await admin.from("odds_snapshots").insert({
        user_id: settings.user_id,
        tracked_match_id: trackedMatchId,
        market_type: settings.preferred_market_type,
        bookmaker: fixture.bookmaker,
        decimal_odds: Number(fixture.odds.toFixed(2)),
        captured_at: new Date().toISOString(),
        source: fixture.source,
      });

      if (!oddsError) {
        oddsCreated += 1;
      }
    }

    if (provider.supportsAutomaticTriggers && await insertSignalIfTriggered(admin, settings, fixture)) {
      signalsCreated += 1;
    }
  }

  await admin.from("ingest_runs").insert({
    user_id: settings.user_id,
    provider: provider.providerKey,
    run_type: "fixture_sync",
    status: "synced",
    records_created: records.length,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    notes: `${provider.displayName} ingest completed successfully.`,
  });

  return { matchesCreated, oddsCreated, signalsCreated, provider: provider.displayName };
}

export async function runProviderIngestForAllUsers() {
  if (!hasSupabaseEnv()) {
    return { runsCreated: 0, matchesCreated: 0, oddsCreated: 0, signalsCreated: 0, provider: provider.displayName };
  }

  const admin = createAdminClient();
  const { data: settingsRows, error } = await admin.from("user_settings").select("*");
  if (error || !settingsRows) {
    throw new Error(error?.message ?? "Failed to load user settings.");
  }

  let runsCreated = 0;
  let matchesCreated = 0;
  let oddsCreated = 0;
  let signalsCreated = 0;

  for (const settings of settingsRows as UserSettings[]) {
    const result = await runProviderIngestForUser(settings);
    runsCreated += 1;
    matchesCreated += result.matchesCreated;
    oddsCreated += result.oddsCreated;
    signalsCreated += result.signalsCreated;
  }

  return { runsCreated, matchesCreated, oddsCreated, signalsCreated, provider: provider.displayName };
}

export async function captureOddsSnapshotsForUser(settings: UserSettings, matches: TrackedMatchRecord[]) {
  if (!hasSupabaseEnv()) {
    return { snapshotsCreated: 0 };
  }

  const admin = createAdminClient();
  let snapshotsCreated = 0;

  for (const match of matches) {
    const dynamicOdds = 1.72 + (snapshotsCreated % 6) * 0.11;
    const { error } = await admin.from("odds_snapshots").insert({
      user_id: settings.user_id,
      tracked_match_id: match.id,
      market_type: settings.preferred_market_type,
      bookmaker: snapshotsCreated % 2 === 0 ? "Pinnacle" : "Bet365",
      decimal_odds: Number(dynamicOdds.toFixed(2)),
      captured_at: new Date().toISOString(),
      source: match.source,
    });

    if (!error) {
      snapshotsCreated += 1;
    }
  }

  await admin.from("ingest_runs").insert({
    user_id: settings.user_id,
    provider: provider.providerKey,
    run_type: "odds_sync",
    status: "synced",
    records_created: snapshotsCreated,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    notes: `${provider.displayName} odds snapshot sync completed.`,
  });

  return { snapshotsCreated };
}

export async function captureOddsSnapshotsForAllUsers() {
  if (!hasSupabaseEnv()) {
    return { runsCreated: 0, snapshotsCreated: 0 };
  }

  const admin = createAdminClient();
  const { data: settingsRows, error: settingsError } = await admin.from("user_settings").select("*");
  if (settingsError || !settingsRows) {
    throw new Error(settingsError?.message ?? "Failed to load user settings.");
  }

  let runsCreated = 0;
  let snapshotsCreated = 0;

  for (const settings of settingsRows as UserSettings[]) {
    const { data: matches } = await admin
      .from("tracked_matches")
      .select("*")
      .eq("user_id", settings.user_id)
      .order("last_synced_at", { ascending: false })
      .limit(8);

    const result = await captureOddsSnapshotsForUser(settings, (matches ?? []) as TrackedMatchRecord[]);
    snapshotsCreated += result.snapshotsCreated;
    runsCreated += 1;
  }

  return { runsCreated, snapshotsCreated };
}
