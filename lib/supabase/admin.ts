import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createAdminClient() {
  const env = getSupabaseEnv();

  if (!env.secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY");
  }

  return createClient(env.url, env.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
