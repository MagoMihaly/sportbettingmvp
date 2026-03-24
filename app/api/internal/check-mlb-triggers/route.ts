import { NextResponse } from "next/server";
import { runMlbProviderIngestForAllUsers } from "@/lib/services/mlbLiveIngest";
import { isSchedulerAuthorized } from "@/lib/services/schedulerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  if (!isSchedulerAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await runMlbProviderIngestForAllUsers();
    return NextResponse.json({ job: "check-mlb-triggers", ok: true, result: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MLB scheduler error";
    return NextResponse.json({ job: "check-mlb-triggers", ok: false, error: message }, { status: 200 });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
