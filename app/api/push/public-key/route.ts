import { NextResponse } from "next/server";
import { getWebPushEnv } from "@/lib/supabase/env";

export async function GET() {
  const { publicKey } = getWebPushEnv();
  return NextResponse.json({ publicKey });
}
