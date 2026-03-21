export const priorityLeagues = [
  "Czech Extraliga",
  "Finnish Liiga",
  "KHL",
  "MHL",
  "Hungarian Erste Liga",
  "DEL",
  "French Ligue Magnus",
  "Danish Metal Ligaen",
  "NHL",
] as const;

export type PriorityLeague = (typeof priorityLeagues)[number];
