export const mlbPregameStrategies = [
  {
    key: "MLB_SERIES_G3_UNDERDOG",
    label: "Series G3 Underdog",
    description:
      "Game 3 underdog review after the pregame favorite won the first two games of a clean three-game series.",
    marketType: "moneyline",
    tier: "core",
  },
  {
    key: "MLB_FAVORITE_RECOVERY",
    label: "Favorite Recovery",
    description:
      "Game 2 or Game 3 favorite review after a validated underdog upset opened the series.",
    marketType: "moneyline",
    tier: "experimental",
  },
] as const;

export type MlbPregameStrategyConfig = (typeof mlbPregameStrategies)[number];
export type MlbPregameStrategyKey = MlbPregameStrategyConfig["key"];

export function getMlbPregameStrategyConfig(key: string) {
  return mlbPregameStrategies.find((strategy) => strategy.key === key) ?? null;
}
