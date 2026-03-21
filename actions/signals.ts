"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { deriveSignalState, isEligibleThirdPeriodTrigger } from "@/lib/services/signalEngine";

export type SignalActionState = {
  error: string;
  success: string;
};

export async function createSignalAction(_prevState: SignalActionState, formData: FormData): Promise<SignalActionState> {
  const period1Goals = Number(formData.get("period1_goals"));
  const period2Goals = Number(formData.get("period2_goals"));
  const triggerConditionMet = isEligibleThirdPeriodTrigger(period1Goals, period2Goals);
  const derived = deriveSignalState({
    period1_goals: period1Goals,
    period2_goals: period2Goals,
    result: "pending",
    trigger_condition_met: triggerConditionMet,
  });

  if (!hasSupabaseEnv()) {
    revalidatePath("/member");
    return {
      error: "",
      success: triggerConditionMet
        ? "Mock signal created with triggered status."
        : "Mock signal created in watching state.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required.", success: "" };
  }

  const { error } = await supabase.from("signals").insert({
    user_id: user.id,
    sport: "ice_hockey",
    league: String(formData.get("league") ?? ""),
    home_team: String(formData.get("home_team") ?? ""),
    away_team: String(formData.get("away_team") ?? ""),
    match_start_time: new Date(String(formData.get("match_start_time") ?? "")).toISOString(),
    selected_team: String(formData.get("selected_team") ?? ""),
    selected_team_side: String(formData.get("selected_team_side") ?? "home"),
    period1_goals: period1Goals,
    period2_goals: period2Goals,
    trigger_condition_met: triggerConditionMet,
    trigger_time: derived.trigger_time,
    odds: Number(formData.get("odds") ?? 0),
    bookmaker: String(formData.get("bookmaker") ?? ""),
    stake: Number(formData.get("stake") ?? 0),
    status: derived.status,
    result: "pending",
    notes: String(formData.get("notes") ?? ""),
  });

  if (error) {
    return { error: error.message, success: "" };
  }

  revalidatePath("/member");
  revalidatePath("/member/signals");
  return {
    error: "",
    success: triggerConditionMet
      ? "Signal created and marked as triggered."
      : "Signal created and added to tracking.",
  };
}
