import { getApiFootballEnv, getSoccerResearchReferenceDate, isSoccerFreePlanSafeMode } from "@/lib/supabase/env";
import { getCurrentSoccerSeason, getSoccerLeagueConfig } from "@/lib/config/soccerLeagues";
import type { SoccerMarketKey } from "@/lib/config/soccerMarkets";
import type { ExternalSoccerGame, ExternalSoccerMarketData, SoccerApiProvider } from "@/lib/types/soccer";

type ApiFootballFixtureResponse = {
  fixture?: { id?: number | string; date?: string; status?: { short?: string; elapsed?: number | null } };
  league?: { id?: number | string; name?: string; country?: string; season?: number };
  teams?: { home?: { name?: string }; away?: { name?: string } };
  goals?: { home?: number | null; away?: number | null };
  score?: { halftime?: { home?: number | null; away?: number | null } };
  statistics?: Array<{ team?: { name?: string }; statistics?: Array<{ type?: string; value?: string | number | null }> }>;
};

type ApiFootballLeagueSeason = {
  year?: number;
  current?: boolean;
  coverage?: {
    fixtures?: {
      events?: boolean;
      lineups?: boolean;
      statistics_fixtures?: boolean;
      statistics_players?: boolean;
    };
    odds?: boolean;
  };
};

type ApiFootballLeagueResponse = {
  league?: { id?: number | string; name?: string; type?: string };
  seasons?: ApiFootballLeagueSeason[];
};

type ApiFootballOddsValue = {
  value?: string;
  odd?: string | number | null;
};

type ApiFootballOddsResponse = {
  bookmakers?: Array<{
    name?: string;
    bets?: Array<{
      name?: string;
      values?: ApiFootballOddsValue[];
    }>;
  }>;
};

type ApiFootballEnvelope = {
  response?: Record<string, unknown>[];
  errors?: Record<string, string | string[]>;
};

type LeagueContext = {
  leagueId: number;
  season: number;
  oddsAvailable: boolean;
};

function normalizeValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseNumericStat(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace("%", "").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readStatBlock(stats: ApiFootballFixtureResponse["statistics"], teamName: string | undefined, statType: string) {
  const block = (stats ?? []).find((entry) => entry.team?.name === teamName);
  const stat = block?.statistics?.find((entry) => entry.type === statType);
  return parseNumericStat(stat?.value ?? null);
}

function toGameStatus(shortStatus: string | undefined): ExternalSoccerGame["status"] {
  if (["1H", "HT", "2H", "ET", "P", "LIVE", "INT"].includes(shortStatus ?? "")) {
    return "live";
  }

  if (["FT", "AET", "PEN"].includes(shortStatus ?? "")) {
    return "finished";
  }

  return "scheduled";
}

function mapFixtureToGame(payload: ApiFootballFixtureResponse, fallbackLeagueSlug: string): ExternalSoccerGame | null {
  const fixtureId = payload.fixture?.id;
  const homeTeam = payload.teams?.home?.name;
  const awayTeam = payload.teams?.away?.name;
  const startTime = payload.fixture?.date;

  if (!fixtureId || !homeTeam || !awayTeam || !startTime) {
    return null;
  }

  return {
    externalMatchId: String(fixtureId),
    leagueSlug: fallbackLeagueSlug,
    leagueName: payload.league?.name ?? getSoccerLeagueConfig(fallbackLeagueSlug)?.name ?? fallbackLeagueSlug,
    startTime,
    status: toGameStatus(payload.fixture?.status?.short),
    homeTeam,
    awayTeam,
    homeScore: payload.goals?.home ?? 0,
    awayScore: payload.goals?.away ?? 0,
    halftimeHomeScore: payload.score?.halftime?.home ?? null,
    halftimeAwayScore: payload.score?.halftime?.away ?? null,
    minute: payload.fixture?.status?.elapsed ?? null,
    homeShots: readStatBlock(payload.statistics, homeTeam, "Total Shots"),
    awayShots: readStatBlock(payload.statistics, awayTeam, "Total Shots"),
    homeShotsOnTarget: readStatBlock(payload.statistics, homeTeam, "Shots on Goal"),
    awayShotsOnTarget: readStatBlock(payload.statistics, awayTeam, "Shots on Goal"),
    homeCorners: readStatBlock(payload.statistics, homeTeam, "Corner Kicks"),
    awayCorners: readStatBlock(payload.statistics, awayTeam, "Corner Kicks"),
    homePossession: readStatBlock(payload.statistics, homeTeam, "Ball Possession"),
    awayPossession: readStatBlock(payload.statistics, awayTeam, "Ball Possession"),
    source: "api-football",
    rawPayload: payload as unknown as Record<string, unknown>,
  };
}

function findTargetOdd(values: ApiFootballOddsValue[] | undefined, marketKey: SoccerMarketKey) {
  const targetLabel = marketKey === "H2_2H_OVER_1_5" ? "over 1.5" : "over 0.5";
  const candidate = (values ?? []).find((value) => normalizeValue(value.value ?? "").includes(targetLabel));
  return parseNumericStat(candidate?.odd ?? null);
}

function extractApiError(errors: ApiFootballEnvelope["errors"]) {
  if (!errors) {
    return null;
  }

  const entries = Object.entries(errors).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Boolean(value);
  });

  if (entries.length === 0) {
    return null;
  }

  const [key, value] = entries[0];
  const message = Array.isArray(value) ? value.join(", ") : value;
  return `[${key}] ${message}`;
}

function isPlanSeasonError(message: string) {
  return message.toLowerCase().includes("do not have access to this season");
}

function buildSeasonFallbacks() {
  const currentSeason = getCurrentSoccerSeason();
  return [currentSeason, currentSeason - 1, currentSeason - 2].filter((value, index, list) => list.indexOf(value) === index);
}

function getSafeModeBaseDate() {
  const override = getSoccerResearchReferenceDate();
  if (override) {
    const parsed = new Date(`${override}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const base = new Date();
  base.setUTCFullYear(base.getUTCFullYear() - 1);
  return base;
}

function getFixtureWindow(context: LeagueContext) {
  if (!isSoccerFreePlanSafeMode()) {
    const from = new Date();
    const to = new Date(from.getTime() + 3 * 24 * 60 * 60 * 1000);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  }

  const baseDate = getSafeModeBaseDate();
  const seasonAligned = new Date(baseDate);
  if (context.season !== getCurrentSoccerSeason()) {
    seasonAligned.setUTCFullYear(context.season + 1);
  }
  const from = new Date(seasonAligned.getTime() - 7 * 24 * 60 * 60 * 1000);
  const to = new Date(seasonAligned.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export class ApiFootballSoccerProvider implements SoccerApiProvider {
  readonly providerKey = "api-football";
  readonly displayName = "API-Football Pro";
  readonly supportsAutomaticTriggers = true;
  private readonly env = getApiFootballEnv();
  private readonly leagueCache = new Map<string, LeagueContext>();

  supportsLeague(leagueSlug: string) {
    return Boolean(getSoccerLeagueConfig(leagueSlug));
  }

  private async request(path: string, params: Record<string, string>) {
    if (!this.env.apiKey) {
      throw new Error("API-Football API key is missing.");
    }

    const url = new URL(path, `${this.env.baseUrl}/`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    const response = await fetch(url.toString(), {
      headers: {
        "x-apisports-key": this.env.apiKey,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`API-Football request failed with ${response.status}`);
    }

    const body = (await response.json()) as ApiFootballEnvelope;
    const apiError = extractApiError(body.errors);
    if (apiError) {
      const normalizedError = apiError.toLowerCase();
      if (
        normalizedError.includes("request limit") ||
        normalizedError.includes("limit for the day") ||
        normalizedError.includes("quota")
      ) {
        throw new Error(`API-Football rate limit reached: ${apiError}`);
      }

      throw new Error(`API-Football returned an application error: ${apiError}`);
    }

    return body.response ?? [];
  }

  async resolveLeagueContext(leagueSlug: string) {
    const cached = this.leagueCache.get(leagueSlug);
    if (cached) {
      return cached;
    }

    const config = getSoccerLeagueConfig(leagueSlug);
    if (!config) {
      return null;
    }

    for (const season of buildSeasonFallbacks()) {
      try {
        const leagues = (await this.request("leagues", {
          country: config.country,
          season: String(season),
          type: "league",
        })) as ApiFootballLeagueResponse[];

        const match = leagues.find((entry) => {
          const name = normalizeValue(entry.league?.name ?? "");
          return config.searchTerms.some((term) => name.includes(normalizeValue(term)));
        });

        const leagueId = match?.league?.id ? Number(match.league.id) : null;
        if (!leagueId) {
          continue;
        }

        const seasonCoverage = (match?.seasons ?? []).find((entry) => entry.year === season);
        const context = {
          leagueId,
          season,
          oddsAvailable: Boolean(seasonCoverage?.coverage?.odds),
        };
        this.leagueCache.set(leagueSlug, context);
        return context;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown API-Football error";
        if (!isPlanSeasonError(message)) {
          throw error;
        }
      }
    }

    throw new Error(`API-Football could not resolve an accessible season for ${leagueSlug}.`);
  }

  async getScheduledGames(leagueSlugs: string[]) {
    const fixtures = await Promise.all(
      leagueSlugs.map(async (leagueSlug) => {
        const context = await this.resolveLeagueContext(leagueSlug);
        if (!context) {
          return [] as ExternalSoccerGame[];
        }

        const window = getFixtureWindow(context);
        const rows = (await this.request("fixtures", {
          league: String(context.leagueId),
          season: String(context.season),
          from: window.from,
          to: window.to,
        })) as ApiFootballFixtureResponse[];

        return rows
          .map((row) => mapFixtureToGame(row, leagueSlug))
          .filter((row): row is ExternalSoccerGame => Boolean(row));
      }),
    );

    return fixtures.flat();
  }

  async getLiveGames(leagueSlugs: string[]) {
    if (isSoccerFreePlanSafeMode()) {
      return [];
    }

    const leagueIdMap = new Map<number, string>();
    for (const slug of leagueSlugs) {
      const context = await this.resolveLeagueContext(slug);
      if (context) {
        leagueIdMap.set(context.leagueId, slug);
      }
    }

    const rows = (await this.request("fixtures", { live: "all" })) as ApiFootballFixtureResponse[];
    return rows
      .filter((row) => leagueIdMap.has(Number(row.league?.id ?? 0)))
      .map((row) => mapFixtureToGame(row, leagueIdMap.get(Number(row.league?.id ?? 0)) ?? "england-premier-league"))
      .filter((row): row is ExternalSoccerGame => Boolean(row));
  }

  async getGameDetails(externalMatchId: string, leagueSlug?: string) {
    const rows = (await this.request("fixtures", { id: externalMatchId })) as ApiFootballFixtureResponse[];
    return mapFixtureToGame(rows[0], leagueSlug ?? "england-premier-league");
  }

  async getMarketData(externalMatchId: string, marketKey: SoccerMarketKey) {
    if (isSoccerFreePlanSafeMode()) {
      return [];
    }

    try {
      const rows = (await this.request("odds/live", { fixture: externalMatchId })) as ApiFootballOddsResponse[];
      return rows.flatMap((row) =>
        (row.bookmakers ?? []).flatMap((bookmaker) => {
          const odds = (bookmaker.bets ?? [])
            .map((bet) => findTargetOdd(bet.values, marketKey))
            .find((value) => value !== null && value !== undefined);

          return odds === null || odds === undefined
            ? []
            : [{
                marketKey,
                bookmaker: bookmaker.name ?? "API-Football",
                odds,
                suspended: false,
                source: "api-football",
                payload: row as unknown as Record<string, unknown>,
              } satisfies ExternalSoccerMarketData];
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown market data error";
      throw new Error(`API-Football market lookup failed: ${message}`);
    }
  }

  async getLeagueMeta(leagueSlug: string) {
    return this.resolveLeagueContext(leagueSlug);
  }
}
