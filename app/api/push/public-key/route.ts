import { NextResponse } from "next/server";
import { resolvePushPublicKeyState } from "@/lib/push/public-key";

export async function GET() {
  const state = resolvePushPublicKeyState();
  if (!state.ok) {
    return NextResponse.json({ error: state.error }, { status: state.status });
  }

  return NextResponse.json({ publicKey: state.publicKey });
}
