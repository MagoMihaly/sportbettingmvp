import { NextResponse } from "next/server";
import { runScheduledTriggerCheck } from "@/lib/services/scheduler";
import { isSchedulerAuthorized } from "@/lib/services/schedulerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleIngest(request: Request) {
  if (!isSchedulerAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await runScheduledTriggerCheck();
  return NextResponse.json({
    ...payload,
    deprecated: true,
    replacement: "/api/internal/check-hockey-triggers",
  });
}

export async function GET(request: Request) {
  return handleIngest(request);
}

export async function POST(request: Request) {
  return handleIngest(request);
}
