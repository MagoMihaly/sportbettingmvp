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
  };
}

export function getProviderApiKey() {
  return process.env.PROVIDER_API_KEY ?? "";
}
