import { getWebPushEnv } from "@/lib/supabase/env";

export type PushPublicKeyState =
  | {
      ok: true;
      status: 200;
      publicKey: string;
    }
  | {
      ok: false;
      status: 503;
      error: string;
    };

export function resolvePushPublicKeyState(): PushPublicKeyState {
  const { publicKey } = getWebPushEnv();
  if (!publicKey) {
    return {
      ok: false,
      status: 503,
      error: "Missing WEB_PUSH_VAPID_PUBLIC_KEY",
    };
  }

  return {
    ok: true,
    status: 200,
    publicKey,
  };
}
