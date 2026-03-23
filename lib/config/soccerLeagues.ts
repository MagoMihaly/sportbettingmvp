export const soccerLeagueConfigs = [
  { slug: "england-premier-league", name: "England Premier League", country: "England", searchTerms: ["Premier League"] },
  { slug: "england-championship", name: "England Championship", country: "England", searchTerms: ["Championship"] },
  { slug: "netherlands-eredivisie", name: "Netherlands Eredivisie", country: "Netherlands", searchTerms: ["Eredivisie"] },
  { slug: "germany-bundesliga", name: "Germany Bundesliga", country: "Germany", searchTerms: ["Bundesliga"] },
  { slug: "germany-2-bundesliga", name: "Germany 2. Bundesliga", country: "Germany", searchTerms: ["2. Bundesliga", "Bundesliga 2"] },
  { slug: "france-ligue-1", name: "France Ligue 1", country: "France", searchTerms: ["Ligue 1"] },
  { slug: "belgium-jupiler-pro-league", name: "Belgium Jupiler Pro League", country: "Belgium", searchTerms: ["Jupiler Pro League", "First Division A"] },
  { slug: "portugal-primeira-liga", name: "Portugal Primeira Liga", country: "Portugal", searchTerms: ["Primeira Liga"] },
  { slug: "turkey-super-lig", name: "Turkey Super Lig", country: "Turkey", searchTerms: ["Süper Lig", "Super Lig"] },
  { slug: "italy-serie-a", name: "Italy Serie A", country: "Italy", searchTerms: ["Serie A"] },
  { slug: "spain-la-liga", name: "Spain La Liga", country: "Spain", searchTerms: ["La Liga", "Primera Division"] },
  { slug: "scotland-premiership", name: "Scotland Premiership", country: "Scotland", searchTerms: ["Premiership"] },
] as const;

export type SoccerLeagueConfig = (typeof soccerLeagueConfigs)[number];
export type SoccerLeagueSlug = SoccerLeagueConfig["slug"];

export const defaultSoccerLeagueSlugs = soccerLeagueConfigs.map((league) => league.slug);

export function getSoccerLeagueConfig(slug: string) {
  return soccerLeagueConfigs.find((league) => league.slug === slug) ?? null;
}

export function getCurrentSoccerSeason(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth() + 1;
  return month >= 7 ? year : year - 1;
}