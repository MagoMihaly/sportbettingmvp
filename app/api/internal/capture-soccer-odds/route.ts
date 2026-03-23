import { NextResponse } from "next/server";
import { captureSoccerOddsSnapshotsForAllUsers } from "@/lib/services/soccerLiveIngest";
import { isSchedulerAuthorized } from "@/lib/services/schedulerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  if (!isSchedulerAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await captureSoccerOddsSnapshotsForAllUsers();
  return NextResponse.json({ job: "capture-soccer-odds", ok: true, result: payload });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}