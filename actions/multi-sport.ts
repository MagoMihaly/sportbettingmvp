"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

async function getUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? null };
}

export async function toggleHockeyNotificationsAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/member");
    revalidatePath("/member/hockey");
    return;
  }

  const { supabase, userId } = await getUserId();
  if (!userId) {
    return;
  }

  try {
    await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        notifications_enabled: String(formData.get("enabled")) === "true",
      },
      { onConflict: "user_id" },
    );
  } catch (error) {
    console.warn("[multi-sport] failed to toggle hockey notifications", error);
  }

  revalidatePath("/member");
  revalidatePath("/member/hockey");
  revalidatePath("/member/notifications");
}

export async function toggleSoccerNotificationsAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/member");
    revalidatePath("/member/soccer");
    return;
  }

  const { supabase, userId } = await getUserId();
  if (!userId) {
    return;
  }

  try {
    await supabase.from("soccer_user_settings").upsert(
      {
        user_id: userId,
        notifications_enabled: String(formData.get("enabled")) === "true",
      },
      { onConflict: "user_id" },
    );
  } catch (error) {
    console.warn("[multi-sport] failed to toggle soccer notifications", error);
  }

  revalidatePath("/member");
  revalidatePath("/member/soccer");
  revalidatePath("/member/soccer/settings");
}

export async function toggleMlbNotificationsAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    revalidatePath("/member");
    revalidatePath("/member/mlb");
    return;
  }

  const { supabase, userId } = await getUserId();
  if (!userId) {
    return;
  }

  try {
    await supabase.from("mlb_user_settings").upsert(
      {
        user_id: userId,
        notifications_enabled: String(formData.get("enabled")) === "true",
      },
      { onConflict: "user_id" },
    );
  } catch (error) {
    console.warn("[multi-sport] failed to toggle MLB notifications", error);
  }

  revalidatePath("/member");
  revalidatePath("/member/mlb");
  revalidatePath("/member/mlb/settings");
}
