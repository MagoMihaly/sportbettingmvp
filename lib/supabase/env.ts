export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publicKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "",
    secretKey:
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      "",
  };
}

export function hasSupabaseEnv() {
  const env = getSupabaseEnv();
  return Boolean(env.url && env.publicKey);
}

export function getCronSecret() {
  return process.env.CRON_SECRET ?? "";
}

export function getWebPushEnv() {
  return {
    publicKey: process.env.WEB_PUSH_VAPID_PUBLIC_KEY ?? "",
    privateKey: process.env.WEB_PUSH_VAPID_PRIVATE_KEY ?? "",
    subject: process.env.WEB_PUSH_VAPID_SUBJECT ?? "mailto:notifications@signalops.local",
  };
}

export function getProviderApiKey() {
  return process.env.PROVIDER_API_KEY ?? "";
}

export function getSportradarHockeyEnv() {
  return {
    apiKey: process.env.SPORTRADAR_HOCKEY_API_KEY ?? "",
    baseUrl: process.env.SPORTRADAR_HOCKEY_BASE_URL ?? "https://api.sportradar.com",
    accessLevel: process.env.SPORTRADAR_HOCKEY_ACCESS_LEVEL ?? "trial",
    language: process.env.SPORTRADAR_HOCKEY_LANGUAGE ?? "en",
  };
}

export function isSoccerModuleEnabled() {
  return (process.env.SOCCER_MODULE_ENABLED ?? "true").toLowerCase() === "true";
}

export function isMlbModuleEnabled() {
  return (process.env.MLB_MODULE_ENABLED ?? "true").toLowerCase() === "true";
}

export function isSoccerFreePlanSafeMode() {
  return (process.env.SOCCER_FREE_PLAN_SAFE_MODE ?? "false").toLowerCase() === "true";
}

export function getSoccerResearchReferenceDate() {
  return process.env.SOCCER_RESEARCH_REFERENCE_DATE ?? "";
}

export function getApiFootballEnv() {
  return {
    apiKey: process.env.API_FOOTBALL_API_KEY ?? "",
    baseUrl: process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io",
  };
}

export function getSportradarSoccerEnv() {
  return {
    apiKey: process.env.SPORTRADAR_SOCCER_API_KEY ?? "",
    baseUrl: process.env.SPORTRADAR_SOCCER_BASE_URL ?? "https://api.sportradar.com",
    accessLevel: process.env.SPORTRADAR_SOCCER_ACCESS_LEVEL ?? "trial",
    extendedAccessLevel:
      process.env.SPORTRADAR_SOCCER_EXTENDED_ACCESS_LEVEL ??
      process.env.SPORTRADAR_SOCCER_ACCESS_LEVEL ??
      "trial",
    language: process.env.SPORTRADAR_SOCCER_LANGUAGE ?? "en",
  };
}

export function getApiBaseballEnv() {
  return {
    apiKey: process.env.API_BASEBALL_API_KEY ?? "",
    baseUrl: process.env.API_BASEBALL_BASE_URL ?? "https://v1.baseball.api-sports.io",
  };
}

export function getSportradarMlbEnv() {
  return {
    apiKey: process.env.SPORTRADAR_MLB_API_KEY ?? "",
    baseUrl: process.env.SPORTRADAR_MLB_BASE_URL ?? "https://api.sportradar.com",
    accessLevel: process.env.SPORTRADAR_MLB_ACCESS_LEVEL ?? "trial",
    language: process.env.SPORTRADAR_MLB_LANGUAGE ?? "en",
  };
}
