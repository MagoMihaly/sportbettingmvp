const aliasMap: Record<string, string[]> = {
  "Czech Extraliga": ["czech extraliga", "extraliga"],
  "Finnish Liiga": ["finnish liiga", "liiga"],
  KHL: ["khl", "kontinental hockey league"],
  MHL: ["mhl", "junior hockey league"],
  "Hungarian Erste Liga": ["hungarian erste liga", "erste liga"],
  DEL: ["del", "german del"],
  "French Ligue Magnus": ["french ligue magnus", "ligue magnus"],
  "Danish Metal Ligaen": ["danish metal ligaen", "metal ligaen"],
  NHL: ["nhl", "national hockey league"],
};

export function normalizeProviderValue(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getLeagueAliases(league: string) {
  return aliasMap[league] ?? [league.toLowerCase()];
}
