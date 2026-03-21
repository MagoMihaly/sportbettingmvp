import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/supabase/env";
import { captureOddsSnapshotsForAllUsers } from "@/lib/services/liveIngest";

function isAuthorized(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace("Bearer ", "");
  return token && token === getCronSecret();
}

async function handleOddsSync(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await captureOddsSnapshotsForAllUsers();
  return NextResponse.json({ ok: true, result });
}

export async function GET(request: Request) {
  return handleOddsSync(request);
}

export async function POST(request: Request) {
  return handleOddsSync(request);
}
