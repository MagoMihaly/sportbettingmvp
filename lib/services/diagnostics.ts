import { diagnosticsTests } from "@/lib/config/diagnostics";
import { priorityLeagues } from "@/lib/config/leagues";
import { defaultSoccerLeagueSlugs } from "@/lib/config/soccerLeagues";
import { mockMlbGames, mockMlbOddsSnapshots } from "@/lib/mock/mlb";
import { buildTriggeredSignalNotification, deliverAlertPlaceholder, getEnabledNotificationChannels } from "@/lib/services/notifications";
import { getTriggeredSignals } from "@/lib/services/signalEngine";
import { evaluateMlbPregameSignals } from "@/lib/services/mlbPregameEngine";
import { getTriggeredSoccerSignals } from "@/lib/services/soccerSignalEngine";
import { createMlbProvider } from "@/lib/providers/mlbApi";
import { createHockeyProvider } from "@/lib/providers/hockeyApi";
import { createSoccerProvider } from "@/lib/providers/soccerApi";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getApiBaseballEnv,
  getApiFootballEnv,
  getCronSecret,
  getSupabaseEnv,
  getWebPushEnv,
  hasSupabaseEnv,
  isMlbModuleEnabled,
  isSoccerModuleEnabled,
} from "@/lib/supabase/env";
import { getActiveMlbProviderSummary } from "@/lib/services/mlbLiveIngest";
import { getActiveProviderSummary } from "@/lib/services/liveIngest";
import { getActiveSoccerProviderSummary } from "@/lib/services/soccerLiveIngest";
import { isSchedulerAuthorized } from "@/lib/services/schedulerAuth";
import type { AlertRecord, SignalRecord } from "@/lib/types/database";
import type { DiagnosticsCheckMode, DiagnosticsCheckResult, DiagnosticsTestId } from "@/lib/types/diagnostics";
import type { ExternalHockeyGame } from "@/lib/types/provider";
import type { ExternalSoccerGame } from "@/lib/types/soccer";

const diagnosticsTestSet = new Set(diagnosticsTests.map((test) => test.id));

function buildResult(
  id: DiagnosticsTestId,
  status: DiagnosticsCheckResult["status"],
  summary: string,
  details: string,
  mode: DiagnosticsCheckMode = "full",
): DiagnosticsCheckResult {
  return {
    id,
    status,
    summary,
    details,
    mode,
    checkedAt: new Date().toISOString(),
  };
}

function buildSuccess(id: DiagnosticsTestId, details: string, mode: DiagnosticsCheckMode = "full") {
  return buildResult(id, "success", "Test - Working", details, mode);
}

function buildFailure(
  id: DiagnosticsTestId,
  summary: "Config Missing" | "Auth Failed" | "Provider Unreachable" | "Invalid Response",
  details: string,
  mode: DiagnosticsCheckMode = "full",
) {
  const resolvedMode = summary === "Config Missing" && mode === "full" ? "config" : mode;
  return buildResult(id, "failed", summary, details, resolvedMode);
}

function assertKnownTestId(testId: string): testId is DiagnosticsTestId {
  return diagnosticsTestSet.has(testId as DiagnosticsTestId);
}

async function withTimeout<T>(task: Promise<T>, timeoutMs: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function requireAuthenticatedUser() {
  if (!hasSupabaseEnv()) {
    return { ok: false as const, summary: "Config Missing" as const, error: "Supabase environment is missing. The app is currently running in demo mode." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, summary: "Auth Failed" as const, error: error?.message ?? "No authenticated member session was found." };
  }

  return { ok: true as const, supabase, user };
}

function classifyProviderError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("api key is missing") ||
    normalized.includes("missing critical configuration") ||
    normalized.includes("missing supabase") ||
    normalized.includes("missing cron_secret")
  ) {
    return "Config Missing" as const;
  }

  if (
    normalized.includes("missing application key") ||
    normalized.includes("invalid api key") ||
    normalized.includes("invalid key") ||
    normalized.includes("application error") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden")
  ) {
    return "Auth Failed" as const;
  }

  if (
    normalized.includes("timed out") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("econn") ||
    normalized.includes("enotfound") ||
    normalized.includes("request failed with 5")
  ) {
    return "Provider Unreachable" as const;
  }

  return "Invalid Response" as const;
}

function buildSampleHockeyGame(): ExternalHockeyGame {
  return {
    externalMatchId: "diag-hockey-1",
    externalLeagueId: "diag-league",
    league: "Diagnostics League",
    homeTeam: "Diagnostics Home",
    awayTeam: "Diagnostics Away",
    startTime: new Date().toISOString(),
    status: "live",
    homeScore: 0,
    awayScore: 1,
    period1HomeGoals: 0,
    period1AwayGoals: 1,
    period2HomeGoals: 0,
    period2AwayGoals: 0,
    bookmaker: null,
    odds: null,
    source: "diagnostics",
    rawPayload: { diagnostics: true },
  };
}

function buildSampleSoccerGame(): ExternalSoccerGame {
  return {
    externalMatchId: "diag-soccer-1",
    leagueSlug: defaultSoccerLeagueSlugs[0],
    leagueName: "Diagnostics Soccer",
    startTime: new Date().toISOString(),
    status: "live",
    homeTeam: "Diagnostics FC",
    awayTeam: "Signals United",
    homeScore: 0,
    awayScore: 0,
    halftimeHomeScore: 0,
    halftimeAwayScore: 0,
    minute: 62,
    homeShots: 7,
    awayShots: 5,
    homeShotsOnTarget: 2,
    awayShotsOnTarget: 1,
    homeCorners: 4,
    awayCorners: 3,
    homePossession: 54,
    awayPossession: 46,
    source: "diagnostics",
    rawPayload: { diagnostics: true },
  };
}

async function runAuthSessionCheck() {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) {
    return buildFailure("auth-user-session", auth.summary, auth.error, auth.summary === "Config Missing" ? "config" : "full");
  }

  return buildSuccess("auth-user-session", `Member session resolved for ${auth.user.email ?? auth.user.id}.`);
}

async function runDatabaseConnectionCheck() {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) {
    return buildFailure("database-connection", auth.summary, auth.error, auth.summary === "Config Missing" ? "config" : "full");
  }

  const { error, data } = await auth.supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .limit(1);

  if (error) {
    return buildFailure("database-connection", "Invalid Response", `Supabase query failed: ${error.message}`);
  }

  const profileState = data && data.length > 0 ? "profile row reachable" : "database reachable, profile row not found";
  return buildSuccess("database-connection", `Supabase read completed successfully: ${profileState}.`);
}

async function runApiRoutesCheck(request: Request) {
  const pushKeyResponse = await fetch(new URL("/api/push/public-key", request.url), {
    cache: "no-store",
  });
  const hockeyProtectedResponse = await fetch(new URL("/api/internal/check-hockey-triggers", request.url), {
    method: "GET",
    cache: "no-store",
    headers: { authorization: "Bearer diagnostics-invalid-token" },
  });

  if (!pushKeyResponse.ok) {
    return buildFailure("api-routes", "Invalid Response", `Push public key route returned ${pushKeyResponse.status}.`);
  }

  if (hockeyProtectedResponse.status !== 401) {
    return buildFailure("api-routes", "Invalid Response", `Protected hockey route returned ${hockeyProtectedResponse.status} instead of 401.`);
  }

  return buildSuccess("api-routes", "Public push route answered and protected scheduler route enforced authorization.");
}

async function runExternalProvidersCheck() {
  const providerMessages: string[] = [];
  const failures: Array<{ summary: ReturnType<typeof classifyProviderError>; details: string }> = [];

  try {
    const hockeyProvider = createHockeyProvider();
    if (hockeyProvider.providerKey === "mock") {
      providerMessages.push("Hockey is using the mock provider.");
    } else {
      const hockeyGames = await withTimeout(
        hockeyProvider.getScheduledGames([priorityLeagues[0]]),
        10000,
        "Hockey provider timed out during diagnostics.",
      );
      providerMessages.push(`Hockey provider ${hockeyProvider.displayName} answered with ${hockeyGames.length} scheduled sample rows.`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    failures.push({
      summary: classifyProviderError(message),
      details: `Hockey provider check failed: ${message}`,
    });
  }

  if (isSoccerModuleEnabled()) {
    try {
      const apiFootballEnv = getApiFootballEnv();
      const soccerProvider = createSoccerProvider();
      if (soccerProvider.providerKey === "mock-soccer") {
        providerMessages.push("Soccer is using the mock provider.");
      } else if (!apiFootballEnv.apiKey) {
        failures.push({
          summary: "Config Missing",
          details: "Soccer provider is set to API-Football, but API_FOOTBALL_API_KEY is not available on the server.",
        });
      } else {
        const soccerGames = await withTimeout(
          soccerProvider.getScheduledGames([defaultSoccerLeagueSlugs[0]]),
          12000,
          "Soccer provider timed out during diagnostics.",
        );
        providerMessages.push(
          `Soccer provider ${soccerProvider.displayName} answered with ${soccerGames.length} scheduled sample rows. Server env present=yes, header=x-apisports-key, base URL=${apiFootballEnv.baseUrl}.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push({
        summary: classifyProviderError(message),
        details: `Soccer provider check failed: ${message}`,
      });
    }
  } else {
    providerMessages.push("Soccer module is disabled by feature flag.");
  }

  if (isMlbModuleEnabled()) {
    try {
      const mlbProvider = createMlbProvider();
      const mlbGames = await withTimeout(
        mlbProvider.getScheduledGames(),
        10000,
        "MLB provider timed out during diagnostics.",
      );
      providerMessages.push(`MLB provider ${mlbProvider.displayName} answered with ${mlbGames.length} scheduled sample rows.`);
  } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push({
        summary: classifyProviderError(message),
        details: `MLB provider check failed: ${message}`,
      });
    }
  } else {
    providerMessages.push("MLB module is disabled by feature flag.");
  }

  if (failures.length > 0) {
    const primaryFailure = failures[0];
    const combinedDetails = [...providerMessages, ...failures.map((failure) => failure.details)].join(" ");
    return buildFailure("external-providers", primaryFailure.summary, combinedDetails);
  }

  const usedPartialMode = providerMessages.some((message) => message.includes("mock provider") || message.includes("disabled"));
  return buildSuccess("external-providers", providerMessages.join(" "), usedPartialMode ? "partial" : "full");
}

async function runSignalEngineCommunicationCheck() {
  const hockeyTriggered = getTriggeredSignals(buildSampleHockeyGame());
  const soccerTriggered = getTriggeredSoccerSignals(buildSampleSoccerGame());
  const mlbTriggered = evaluateMlbPregameSignals({
    games: mockMlbGames,
    oddsSnapshots: mockMlbOddsSnapshots,
    selectedStrategies: ["MLB_SERIES_G3_UNDERDOG", "MLB_FAVORITE_RECOVERY"],
  }).filter((signal) => signal.evaluationStatus === "qualified");

  if (hockeyTriggered.length === 0 || soccerTriggered.length === 0 || mlbTriggered.length === 0) {
    return buildFailure(
      "signal-engine-communication",
      "Invalid Response",
      `Expected sample triggers were not produced. Hockey=${hockeyTriggered.length}, Soccer=${soccerTriggered.length}, MLB pre-game=${mlbTriggered.length}.`,
    );
  }

  return buildSuccess(
    "signal-engine-communication",
    `Signal evaluators produced sample triggers successfully. Hockey=${hockeyTriggered.length}, Soccer=${soccerTriggered.length}, MLB pre-game=${mlbTriggered.length}.`,
  );
}

async function runNotificationSubsystemCheck() {
  const notificationChannels = getEnabledNotificationChannels({
    notifications_enabled: true,
    email_notifications: false,
    push_notifications: true,
  });
  const sampleNotifications = buildTriggeredSignalNotification({
    selected_team: "Diagnostics Team",
    league: "Diagnostics League",
  } as SignalRecord);

  const placeholderResult = await deliverAlertPlaceholder({} as AlertRecord);
  const webPushEnv = getWebPushEnv();
  const pushConfigured = Boolean(webPushEnv.publicKey && webPushEnv.privateKey);

  if (sampleNotifications.length === 0 || notificationChannels.length === 0) {
    return buildFailure("notification-subsystem", "Invalid Response", "Notification payload construction returned no channels.");
  }

  const details = pushConfigured
    ? `Notification payloads are buildable, ${notificationChannels.join(", ")} channels are available and push keys are configured.`
    : `Notification payloads are buildable, ${notificationChannels.join(", ")} channels are available and placeholder delivery is ready (${placeholderResult.provider}). Web push keys are not fully configured.`;

  return buildSuccess("notification-subsystem", details, pushConfigured ? "full" : "partial");
}

async function runEnvConfigCheck() {
  const supabaseEnv = getSupabaseEnv();
  const apiFootballEnv = getApiFootballEnv();
  const apiBaseballEnv = getApiBaseballEnv();
  const webPushEnv = getWebPushEnv();

  const missingCore = [
    !process.env.NEXT_PUBLIC_APP_URL ? "NEXT_PUBLIC_APP_URL" : null,
    !supabaseEnv.url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabaseEnv.publicKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null,
    !getCronSecret() ? "CRON_SECRET" : null,
  ].filter((value): value is string => Boolean(value));

  if (missingCore.length > 0) {
    return buildFailure("env-config", "Config Missing", `Missing critical configuration: ${missingCore.join(", ")}.`, "config");
  }

  const warnings = [
    isSoccerModuleEnabled() && !apiFootballEnv.apiKey ? "API_FOOTBALL_API_KEY missing for real soccer provider checks" : null,
    (process.env.LIVE_MLB_PROVIDER ?? "mock").toLowerCase() === "api-baseball" && !apiBaseballEnv.apiKey
      ? "API_BASEBALL_API_KEY missing for real MLB provider checks"
      : null,
    !webPushEnv.publicKey || !webPushEnv.privateKey ? "Web push VAPID keys are not fully configured" : null,
  ].filter((value): value is string => Boolean(value));

  return buildSuccess(
    "env-config",
    warnings.length > 0 ? `Critical env is present. ${warnings.join(". ")}.` : "Critical environment configuration is present.",
    warnings.length > 0 ? "partial" : "full",
  );
}

async function runSchedulerReadinessCheck() {
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return buildFailure("scheduler-readiness", "Config Missing", "CRON_SECRET is missing, so protected scheduler endpoints cannot be authorized.", "config");
  }

  const authorized = isSchedulerAuthorized(
    new Request("https://diagnostics.local/internal", {
      headers: {
        authorization: `Bearer ${cronSecret}`,
      },
    }),
  );

  if (!authorized) {
    return buildFailure("scheduler-readiness", "Invalid Response", "Scheduler authorization helper did not accept the configured CRON_SECRET.", "config");
  }

  return buildSuccess(
    "scheduler-readiness",
    "Protected scheduler auth is configured. External scheduler wiring remains a configuration-level check from inside the app.",
    "partial",
  );
}

async function runEndToEndCommunicationCheck() {
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) {
    return buildFailure("end-to-end-communication", auth.summary, auth.error, auth.summary === "Config Missing" ? "config" : "full");
  }

  const profileQuery = await auth.supabase.from("profiles").select("user_id").eq("user_id", auth.user.id).limit(1);
  if (profileQuery.error) {
    return buildFailure("end-to-end-communication", "Invalid Response", `Database read failed inside end-to-end check: ${profileQuery.error.message}`);
  }

  const providerChain = [
    getActiveProviderSummary().displayName,
    getActiveSoccerProviderSummary().displayName,
    getActiveMlbProviderSummary().displayName,
  ];
  const notificationPayloads = buildTriggeredSignalNotification({
    selected_team: "Diagnostics Team",
    league: "Diagnostics League",
  } as SignalRecord);

  return buildSuccess(
    "end-to-end-communication",
    `Frontend request reached the diagnostics API, Supabase auth/db responded, providers resolved (${providerChain.join(" / ")}) and ${notificationPayloads.length} notification payload was generated.`,
  );
}

export async function runDiagnosticsCheck(testId: string, request: Request) {
  if (!assertKnownTestId(testId) || testId === "frontend-app-loaded") {
    throw new Error("Unsupported diagnostics test id.");
  }

  switch (testId) {
    case "auth-user-session":
      return runAuthSessionCheck();
    case "database-connection":
      return runDatabaseConnectionCheck();
    case "api-routes":
      return runApiRoutesCheck(request);
    case "external-providers":
      return runExternalProvidersCheck();
    case "signal-engine-communication":
      return runSignalEngineCommunicationCheck();
    case "notification-subsystem":
      return runNotificationSubsystemCheck();
    case "env-config":
      return runEnvConfigCheck();
    case "scheduler-readiness":
      return runSchedulerReadinessCheck();
    case "end-to-end-communication":
      return runEndToEndCommunicationCheck();
    default:
      throw new Error("Unknown diagnostics test id.");
  }
}
