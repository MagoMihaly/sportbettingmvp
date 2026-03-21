export type TriggerRuleType =
  | "TEAM_NO_GOAL_AFTER_P1"
  | "TEAM_NO_GOAL_AFTER_P2"
  | "TEAM_NO_GOAL_AFTER_P1_AND_P2";

export type TeamSide = "home" | "away";

export type EvaluatedSignal = {
  ruleType: TriggerRuleType;
  selectedTeam: string;
  selectedTeamSide: TeamSide;
  period1Goals: number;
  period2Goals: number;
  triggerConditionMet: boolean;
  signalKey: string;
};
