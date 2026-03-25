import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { runDiagnosticsCheck } from "@/lib/services/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (hasSupabaseEnv()) {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json().catch(() => null)) as { testId?: string } | null;
    if (!body?.testId) {
      return NextResponse.json({ error: "Missing testId" }, { status: 400 });
    }

    const result = await runDiagnosticsCheck(body.testId, request);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown diagnostics error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
