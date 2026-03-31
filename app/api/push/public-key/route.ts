import { NextResponse } from "next/server";
import { getWebPushEnv } from "@/lib/supabase/env";

export async function GET() {
  const { publicKey } = getWebPushEnv();
  if (!publicKey) {
    return NextResponse.json({ error: "Missing WEB_PUSH_VAPID_PUBLIC_KEY" }, { status: 503 });
  }

  return NextResponse.json({ publicKey });
}
