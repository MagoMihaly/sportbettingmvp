import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/supabase/env";
import { runProviderIngestForAllUsers } from "@/lib/services/liveIngest";

function isAuthorized(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace("Bearer ", "");
  return token && token === getCronSecret();
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runProviderIngestForAllUsers();
  return NextResponse.json({ ok: true, result });
}
