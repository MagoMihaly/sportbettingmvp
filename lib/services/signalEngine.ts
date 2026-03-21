import type { SignalRecord } from "@/lib/types/database";

export function isEligibleThirdPeriodTrigger(period1Goals: number, period2Goals: number) {
  return period1Goals === 0 && period2Goals === 0;
}

export function deriveSignalState(
  input: Pick<SignalRecord, "period1_goals" | "period2_goals" | "result" | "trigger_condition_met">,
): Pick<SignalRecord, "status" | "trigger_time"> {
  if (input.result === "won") {
    return { status: "won", trigger_time: new Date().toISOString() };
  }

  if (input.result === "lost") {
    return { status: "lost", trigger_time: new Date().toISOString() };
  }

  if (input.trigger_condition_met) {
    return { status: "triggered", trigger_time: new Date().toISOString() };
  }

  return { status: "watching", trigger_time: null };
}

