import { NextResponse } from "next/server";
import { runScheduledTriggerCheck } from "@/lib/services/scheduler";
import { isSchedulerAuthorized } from "@/lib/services/schedulerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  if (!isSchedulerAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await runScheduledTriggerCheck();
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown hockey scheduler error";
    return NextResponse.json({ job: "check-hockey-triggers", ok: false, error: message }, { status: 200 });
  }
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
