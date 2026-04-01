export const priorityLeagues = [
  "Czech Extraliga",
  "Finnish Liiga",
  "KHL",
  "MHL",
  "Hungarian Erste Liga",
  "DEL",
  "French Ligue Magnus",
  "Danish Metal Ligaen",
] as const;

export type PriorityLeague = (typeof priorityLeagues)[number];

const priorityLeagueSet = new Set<string>(priorityLeagues);

export function sanitizeHockeyLeagues(leagues: string[] | null | undefined) {
  return (leagues ?? []).filter((league) => priorityLeagueSet.has(league));
}
