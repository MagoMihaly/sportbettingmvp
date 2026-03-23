export const soccerMarkets = [
  {
    key: "H2_2H_OVER_1_5",
    label: "HT 0-0 -> 2nd half over 1.5",
    ruleType: "SOCCER_HT_0_0_OVER_1_5",
    descriptions: ["Over 1.5", "Goals Over/Under", "2nd Half Over 1.5"],
  },
  {
    key: "H3_REMAINING_OVER_0_5",
    label: "60' 0-0 -> over 0.5 from now",
    ruleType: "SOCCER_MINUTE_60_0_0_OVER_0_5",
    descriptions: ["Over 0.5", "Goals Over/Under", "Match Goals Over 0.5"],
  },
] as const;

export type SoccerMarketConfig = (typeof soccerMarkets)[number];
export type SoccerMarketKey = SoccerMarketConfig["key"];

export function getSoccerMarketConfig(key: string) {
  return soccerMarkets.find((market) => market.key === key) ?? null;
}