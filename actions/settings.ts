"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function formDataToLeagues(formData: FormData) {
  return formData
    .getAll("selected_leagues")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function updateLeagueSettingsAction(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) {
    revalidatePath("/member/leagues");
    revalidatePath("/member/hockey/leagues");
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const selectedLeagues = formDataToLeagues(formData);

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      selected_leagues: selectedLeagues,
    },
    { onConflict: "user_id" },
  );

  const { data: leagueRows } = await supabase.from("leagues").select("id,name").in("name", selectedLeagues);

  await supabase.from("user_leagues").delete().eq("user_id", user.id);
  if ((leagueRows ?? []).length > 0) {
    await supabase.from("user_leagues").insert(
      (leagueRows ?? []).map((league) => ({
        user_id: user.id,
        league_id: String(league.id),
      })),
    );
  }

  revalidatePath("/member");
  revalidatePath("/member/leagues");
  revalidatePath("/member/hockey/leagues");
}

export async function updateNotificationSettingsAction(formData: FormData): Promise<void> {
  if (!hasSupabaseEnv()) {
    revalidatePath("/member/notifications");
    revalidatePath("/member/hockey/notifications");
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      notifications_enabled: formData.get("notifications_enabled") === "on",
      email_notifications: formData.get("email_notifications") === "on",
      push_notifications: formData.get("push_notifications") === "on",
      timezone: String(formData.get("timezone") ?? "Europe/Budapest"),
      preferred_market_type: String(formData.get("preferred_market_type") ?? "3rd period team goal"),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/member");
  revalidatePath("/member/notifications");
  revalidatePath("/member/hockey/notifications");
}
