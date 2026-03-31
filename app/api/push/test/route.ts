import { NextResponse } from "next/server";
import { sendTestPushToUser } from "@/lib/services/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase environment is missing." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const delivery = await sendTestPushToUser(user.id);

  if (!delivery.delivered) {
    return NextResponse.json(
      {
        error: delivery.reason ?? "Test push could not be delivered.",
        provider: delivery.provider,
        sentCount: delivery.sentCount,
        failedCount: delivery.failedCount,
        revokedCount: delivery.revokedCount,
      },
      { status: delivery.reason?.includes("configured") || delivery.reason?.includes("Missing") ? 503 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    provider: delivery.provider,
    sentCount: delivery.sentCount,
    failedCount: delivery.failedCount,
    revokedCount: delivery.revokedCount,
  });
}
