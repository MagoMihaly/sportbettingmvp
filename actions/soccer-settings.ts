"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { defaultSoccerLeagueSlugs } from "@/lib/config/soccerLeagues";

function formDataToLeagues(formData: FormData) {
  return formData
    .getAll("selected_leagues")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function updateSoccerSettingsAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/member/soccer");
    revalidatePath("/member/soccer/settings");
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
  const payload = {
    user_id: user.id,
    selected_leagues: selectedLeagues.length > 0 ? selectedLeagues : defaultSoccerLeagueSlugs,
    notifications_enabled: formData.get("notifications_enabled") === "on",
    email_notifications: formData.get("email_notifications") === "on",
    push_notifications: formData.get("push_notifications") === "on",
    timezone: String(formData.get("timezone") ?? "Europe/Budapest"),
    preferred_market_key: String(formData.get("preferred_market_key") ?? "H2_2H_OVER_1_5"),
  };

  await supabase.from("soccer_user_settings").upsert(payload, { onConflict: "user_id" });

  const { data: leagueRows } = await supabase.from("leagues").select("id,slug").eq("sport", "soccer").in("slug", payload.selected_leagues);

  await supabase.from("soccer_user_leagues").delete().eq("user_id", user.id);
  if ((leagueRows ?? []).length > 0) {
    await supabase.from("soccer_user_leagues").insert(
      (leagueRows ?? []).map((league) => ({
        user_id: user.id,
        league_id: String(league.id),
      })),
    );
  }

  revalidatePath("/member/soccer");
  revalidatePath("/member/soccer/settings");
  revalidatePath("/member");
}