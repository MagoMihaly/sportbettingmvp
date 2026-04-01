import { getLeagueAliases, normalizeProviderValue } from "@/lib/config/providerLeagues";
import { getSportradarHockeyEnv } from "@/lib/supabase/env";
import type { ExternalHockeyGame, ExternalMarketData, HockeyApiProvider } from "@/lib/types/provider";

type SportradarCompetitor = {
  name?: string;
  qualifier?: "home" | "away" | string;
};

type SportradarPeriodScore = {
  number?: number | null;
  type?: string | null;
  home_score?: number | null;
  away_score?: number | null;
};

type SportradarSportEventStatus = {
  status?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  winner_id?: string | null;
  period_scores?: SportradarPeriodScore[] | null;
};

type SportradarSportEventContext = {
  competition?: {
    id?: string;
    name?: string;
  } | null;
  category?: {
    id?: string;
    name?: string;
  } | null;
  season?: {
    id?: string;
    name?: string;
  } | null;
};

type SportradarSportEvent = {
  id?: string;
  start_time?: string;
  competitors?: SportradarCompetitor[] | null;
  sport_event_context?: SportradarSportEventContext | null;
};

type SportradarHockeySummary = {
  sport_event?: SportradarSportEvent | null;
  sport_event_status?: SportradarSportEventStatus | null;
};

type SportradarHockeySummariesResponse = {
  summaries?: SportradarHockeySummary[] | null;
};

function isSummariesResponse(
  payload: SportradarHockeySummariesResponse | SportradarHockeySummary,
): payload is SportradarHockeySummariesResponse {
  return "summaries" in payload;
}

type SupportedLeagueMapping = {
  internalLeague: string;
  aliases: string[];
};

const supportedLeagueMappings: SupportedLeagueMapping[] = [
  { internalLeague: "Czech Extraliga", aliases: getLeagueAliases("Czech Extraliga") },
  { internalLeague: "Finnish Liiga", aliases: getLeagueAliases("Finnish Liiga") },
  { internalLeague: "KHL", aliases: getLeagueAliases("KHL") },
  { internalLeague: "MHL", aliases: getLeagueAliases("MHL") },
  { internalLeague: "Hungarian Erste Liga", aliases: getLeagueAliases("Hungarian Erste Liga") },
  { internalLeague: "DEL", aliases: getLeagueAliases("DEL") },
  { internalLeague: "French Ligue Magnus", aliases: getLeagueAliases("French Ligue Magnus") },
  { internalLeague: "Danish Metal Ligaen", aliases: getLeagueAliases("Danish Metal Ligaen") },
];

function toStatus(value: string | null | undefined): ExternalHockeyGame["status"] {
  const normalized = (value ?? "").toLowerCase();

  if (["closed", "complete", "ended", "final"].includes(normalized)) {
    return "finished";
  }

  if (["live", "inprogress", "interrupted", "1st_period", "2nd_period", "3rd_period", "overtime"].includes(normalized)) {
    return "live";
  }

  return "scheduled";
}

function resolveLeagueName(summary: SportradarHockeySummary) {
  return summary.sport_event?.sport_event_context?.competition?.name ?? "";
}

function resolveLeagueId(summary: SportradarHockeySummary) {
  return summary.sport_event?.sport_event_context?.competition?.id ?? null;
}

function matchLeague(competitionName: string, selectedLeagues: string[]) {
  const normalizedCompetition = normalizeProviderValue(competitionName);

  return supportedLeagueMappings.find(
    (mapping) =>
      selectedLeagues.includes(mapping.internalLeague) &&
      mapping.aliases.some((alias) => normalizedCompetition.includes(alias)),
  );
}

function getCompetitor(summary: SportradarHockeySummary, qualifier: "home" | "away") {
  return summary.sport_event?.competitors?.find((competitor) => competitor.qualifier === qualifier) ?? null;
}

function getPeriodScore(
  periodScores: SportradarPeriodScore[] | null | undefined,
  periodNumber: number,
  side: "home" | "away",
) {
  const period = (periodScores ?? []).find((entry) => entry.number === periodNumber && (entry.type ?? "regular_period") === "regular_period");
  if (!period) {
    return null;
  }

  return side === "home" ? period.home_score ?? 0 : period.away_score ?? 0;
}

function mapSummary(summary: SportradarHockeySummary, leagueName: string): ExternalHockeyGame | null {
  const sportEvent = summary.sport_event;
  const sportEventStatus = summary.sport_event_status;
  const homeCompetitor = getCompetitor(summary, "home");
  const awayCompetitor = getCompetitor(summary, "away");

  if (!sportEvent?.id || !sportEvent.start_time || !homeCompetitor?.name || !awayCompetitor?.name) {
    return null;
  }

  return {
    externalMatchId: sportEvent.id,
    externalLeagueId: resolveLeagueId(summary),
    league: leagueName,
    homeTeam: homeCompetitor.name,
    awayTeam: awayCompetitor.name,
    startTime: sportEvent.start_time,
    status: toStatus(sportEventStatus?.status),
    homeScore: sportEventStatus?.home_score ?? 0,
    awayScore: sportEventStatus?.away_score ?? 0,
    period1HomeGoals: getPeriodScore(sportEventStatus?.period_scores, 1, "home"),
    period1AwayGoals: getPeriodScore(sportEventStatus?.period_scores, 1, "away"),
    period2HomeGoals: getPeriodScore(sportEventStatus?.period_scores, 2, "home"),
    period2AwayGoals: getPeriodScore(sportEventStatus?.period_scores, 2, "away"),
    bookmaker: null,
    odds: null,
    source: "sportradar-hockey",
    rawPayload: summary as Record<string, unknown>,
  };
}

export class SportradarHockeyProvider implements HockeyApiProvider {
  readonly providerKey = "sportradar-hockey";
  readonly displayName = "Sportradar Global Ice Hockey";
  readonly supportsAutomaticTriggers = true;
  private readonly env = getSportradarHockeyEnv();

  supportsLeague(league: string) {
    return supportedLeagueMappings.some((mapping) => mapping.internalLeague === league);
  }

  private async request(path: string) {
    if (!this.env.apiKey) {
      throw new Error("Missing SPORTRADAR_HOCKEY_API_KEY");
    }

    const url = `${this.env.baseUrl.replace(/\/+$/, "")}/icehockey/${this.env.accessLevel}/v2/${this.env.language}/${path}`;
    const response = await fetch(url, {
      headers: {
        "x-api-key": this.env.apiKey,
      },
      cache: "no-store",
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Sportradar hockey auth failed: ${response.status} ${response.statusText}. Check SPORTRADAR_HOCKEY_API_KEY and package access.`);
    }

    if (response.status === 429) {
      throw new Error("Sportradar hockey rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`Sportradar hockey request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as SportradarHockeySummariesResponse | SportradarHockeySummary;
  }

  private async loadSummaries(path: string, leagues: string[]) {
    const payload = await this.request(path);
    const summaries = isSummariesResponse(payload) ? payload.summaries ?? [] : [payload];

    return summaries
      .map((summary) => {
        const competitionName = resolveLeagueName(summary);
        const matchedLeague = matchLeague(competitionName, leagues);

        if (!matchedLeague) {
          return null;
        }

        return mapSummary(summary, matchedLeague.internalLeague);
      })
      .filter((game): game is ExternalHockeyGame => Boolean(game))
      .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
  }

  private getUtcDatePath() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async getScheduledGames(leagues: string[]) {
    const selectedLeagues = leagues.filter((league) => this.supportsLeague(league));
    if (selectedLeagues.length === 0) {
      return [];
    }

    const summaries = await this.loadSummaries(`schedules/${this.getUtcDatePath()}/summaries.json`, selectedLeagues);
    return summaries.filter((game) => game.status !== "live");
  }

  async getLiveGames(leagues: string[]) {
    const selectedLeagues = leagues.filter((league) => this.supportsLeague(league));
    if (selectedLeagues.length === 0) {
      return [];
    }

    const summaries = await this.loadSummaries("schedules/live/summaries.json", selectedLeagues);
    return summaries.filter((game) => game.status === "live");
  }

  async getGameDetails(externalMatchId: string, league?: string) {
    const selectedLeagues = league ? [league] : supportedLeagueMappings.map((mapping) => mapping.internalLeague);
    const payload = await this.request(`sport_events/${encodeURIComponent(externalMatchId)}/summary.json`);
    const summary = isSummariesResponse(payload) ? payload.summaries?.[0] ?? null : payload;
    if (!summary) {
      return null;
    }

    const competitionName = resolveLeagueName(summary);
    const matchedLeague = matchLeague(competitionName, selectedLeagues);
    if (!matchedLeague) {
      return null;
    }

    return mapSummary(summary, matchedLeague.internalLeague);
  }

  async getMarketData(externalMatchId: string, marketType: string) {
    return [
      {
        marketType,
        bookmaker: null,
        odds: null,
        source: "sportradar-hockey",
        payload: {
          externalMatchId,
          note: "Sportradar hockey base feed is active. Sportsbook odds are not mapped on this provider path yet.",
        },
      },
    ] satisfies ExternalMarketData[];
  }
}
