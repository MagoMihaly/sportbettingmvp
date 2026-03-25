export const supportedSports = [
  {
    key: "hockey",
    label: "Hockey",
    shortLabel: "Hockey",
    description: "Period-based trigger tracking across selected hockey leagues.",
    href: "/member/hockey",
    settingsHref: "/member/leagues",
    signalsHref: "/member/signals",
    accentClass: "text-cyan-300",
    badgeVariant: "info",
    defaultMarketLabel: "3rd-period scoreless trigger",
  },
  {
    key: "soccer",
    label: "Soccer",
    shortLabel: "Soccer",
    description: "H2 and H3 live-state systems with watchlist-first polling.",
    href: "/member/soccer",
    settingsHref: "/member/soccer/settings",
    signalsHref: "/member/soccer/signals",
    accentClass: "text-emerald-300",
    badgeVariant: "success",
    defaultMarketLabel: "H2 / H3 goal-state systems",
  },
  {
    key: "mlb",
    label: "MLB",
    shortLabel: "MLB",
    description: "Inning-based demo signal systems in a production-shaped pipeline.",
    href: "/member/mlb",
    settingsHref: "/member/mlb/settings",
    signalsHref: "/member/mlb/signals",
    accentClass: "text-amber-300",
    badgeVariant: "warning",
    defaultMarketLabel: "Inning-state signal systems",
  },
] as const;

export type SupportedSportKey = (typeof supportedSports)[number]["key"];

export function getSupportedSport(key: string) {
  return supportedSports.find((sport) => sport.key === key) ?? null;
}
