export const mlbSystems = [
  {
    key: "MLB_F5_SCORELESS",
    label: "Scoreless through 5 innings",
    ruleType: "MLB_F5_SCORELESS",
    description: "Flags games that stay 0-0 through the first five innings.",
  },
  {
    key: "MLB_LATE_ONE_RUN_GAME",
    label: "Late one-run game",
    ruleType: "MLB_LATE_ONE_RUN_GAME",
    description: "Flags games at or beyond the seventh inning with one run or fewer.",
  },
] as const;

export type MlbSystemConfig = (typeof mlbSystems)[number];
export type MlbSystemKey = MlbSystemConfig["key"];

export function getMlbSystemConfig(key: string) {
  return mlbSystems.find((system) => system.key === key) ?? null;
}
