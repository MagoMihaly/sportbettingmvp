"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { mlbPregameStrategies } from "@/lib/config/mlbPregameStrategies";

function formDataToPregameStrategies(formData: FormData) {
  return formData
    .getAll("selected_pregame_strategies")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function updateMlbSettingsAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/member/mlb");
    revalidatePath("/member/mlb/settings");
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const selectedPregameStrategies = formDataToPregameStrategies(formData);
  const payload = {
    user_id: user.id,
    selected_pregame_strategies:
      selectedPregameStrategies.length > 0 ? selectedPregameStrategies : mlbPregameStrategies.map((strategy) => strategy.key),
    notifications_enabled: formData.get("notifications_enabled") === "on",
    email_notifications: formData.get("email_notifications") === "on",
    push_notifications: formData.get("push_notifications") === "on",
    timezone: String(formData.get("timezone") ?? "Europe/Budapest"),
  };

  try {
    await supabase.from("mlb_user_settings").upsert(payload, { onConflict: "user_id" });
  } catch (error) {
    console.warn("[mlb-settings] failed to save settings", error);
  }

  revalidatePath("/member");
  revalidatePath("/member/mlb");
  revalidatePath("/member/mlb/settings");
}
