import { NextResponse } from "next/server";
import { parsePushSubscription, toSubscriptionInsert } from "@/lib/push/web-push";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = parsePushSubscription(await request.json());
  const { error } = await supabase.from("push_subscriptions").upsert(
    toSubscriptionInsert(payload, user.id, request.headers.get("user-agent")),
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { endpoint?: string | null } | null;
  const endpoint = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ status: "revoked", last_seen_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
