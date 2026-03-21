import type { ExternalHockeyGame } from "@/lib/types/provider";
import type { EvaluatedSignal, TeamSide, TriggerRuleType } from "@/lib/types/signals";
import type { SignalRecord } from "@/lib/types/database";

const DEFAULT_RULES: TriggerRuleType[] = [
  "TEAM_NO_GOAL_AFTER_P1",
  "TEAM_NO_GOAL_AFTER_P2",
  "TEAM_NO_GOAL_AFTER_P1_AND_P2",
];

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

function buildSignalKey(externalMatchId: string, selectedTeamSide: TeamSide, ruleType: TriggerRuleType) {
  return `${externalMatchId}:${selectedTeamSide}:${ruleType}`;
}

function evaluateRule(ruleType: TriggerRuleType, period1Goals: number, period2Goals: number) {
  if (ruleType === "TEAM_NO_GOAL_AFTER_P1") {
    return period1Goals === 0;
  }

  if (ruleType === "TEAM_NO_GOAL_AFTER_P2") {
    return period2Goals === 0;
  }

  return isEligibleThirdPeriodTrigger(period1Goals, period2Goals);
}

function evaluateTeamSignals(
  game: ExternalHockeyGame,
  selectedTeam: string,
  selectedTeamSide: TeamSide,
  period1Goals: number | null,
  period2Goals: number | null,
  rules: TriggerRuleType[],
) {
  if (period1Goals === null || period2Goals === null) {
    return [] as EvaluatedSignal[];
  }

  return rules.map((ruleType) => ({
    ruleType,
    selectedTeam,
    selectedTeamSide,
    period1Goals,
    period2Goals,
    triggerConditionMet: evaluateRule(ruleType, period1Goals, period2Goals),
    signalKey: buildSignalKey(game.externalMatchId, selectedTeamSide, ruleType),
  }));
}

export function evaluateGameSignals(game: ExternalHockeyGame, rules: TriggerRuleType[] = DEFAULT_RULES) {
  return [
    ...evaluateTeamSignals(game, game.homeTeam, "home", game.period1HomeGoals, game.period2HomeGoals, rules),
    ...evaluateTeamSignals(game, game.awayTeam, "away", game.period1AwayGoals, game.period2AwayGoals, rules),
  ];
}

export function getTriggeredSignals(game: ExternalHockeyGame, rules: TriggerRuleType[] = DEFAULT_RULES) {
  return evaluateGameSignals(game, rules).filter((signal) => signal.triggerConditionMet);
}
