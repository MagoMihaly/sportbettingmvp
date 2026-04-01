import { getSoccerLeagueConfig } from "@/lib/config/soccerLeagues";
import type { SoccerMarketKey } from "@/lib/config/soccerMarkets";
import { getSportradarSoccerEnv } from "@/lib/supabase/env";
import type { ExternalSoccerGame, ExternalSoccerMarketData, SoccerApiProvider } from "@/lib/types/soccer";

type SportradarCompetitor = {
  id?: string;
  name?: string;
  country?: string;
  abbreviation?: string;
  qualifier?: "home" | "away" | string;
};

type SportradarPeriodScore = {
  home_score?: number | null;
  away_score?: number | null;
  number?: number;
};

type SportradarClock = {
  played?: string;
};

type SportradarSportEventStatus = {
  status?: string;
  match_status?: string;
  home_score?: number | null;
  away_score?: number | null;
  period_scores?: SportradarPeriodScore[];
  clock?: SportradarClock;
};

type SportradarCompetition = {
  id?: string;
  name?: string;
};

type SportradarCategory = {
  id?: string;
  name?: string;
  country_code?: string;
};

type SportradarSportEventContext = {
  category?: SportradarCategory;
  competition?: SportradarCompetition;
};

type SportradarSportEvent = {
  id?: string;
  start_time?: string;
  sport_event_context?: SportradarSportEventContext;
  competitors?: SportradarCompetitor[];
};

type SportradarScheduleEntry = {
  sport_event?: SportradarSportEvent;
  sport_event_status?: SportradarSportEventStatus;
};

type SportradarScheduleResponse = {
  schedules?: SportradarScheduleEntry[];
  summaries?: SportradarScheduleEntry[];
};

type LeagueMatch = {
  slug: string;
  leagueName: string;
};

function normalizeValue(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parsePlayedMinute(played: string | undefined) {
  if (!played) {
    return null;
  }

  const [minutes] = played.split(":");
  const parsed = Number(minutes);
  return Number.isFinite(parsed) ? parsed : null;
}

function toSoccerStatus(status: SportradarSportEventStatus | undefined): ExternalSoccerGame["status"] {
  const normalizedStatus = normalizeValue(status?.status);
  const normalizedMatchStatus = normalizeValue(status?.match_status);

  if (
    normalizedStatus === "live" ||
    normalizedMatchStatus.includes("half") ||
    normalizedMatchStatus.includes("overtime") ||
    normalizedMatchStatus.includes("extra time") ||
    normalizedMatchStatus.includes("penalties")
  ) {
    return "live";
  }

  if (normalizedStatus === "closed" || normalizedMatchStatus === "ended") {
    return "finished";
  }

  return "scheduled";
}

function getCompetitor(competitors: SportradarCompetitor[] | undefined, qualifier: "home" | "away") {
  return (competitors ?? []).find((competitor) => competitor.qualifier === qualifier) ?? null;
}

function resolveLeagueMatch(entry: SportradarScheduleEntry, allowedLeagueSlugs: Set<string>) {
  const competitionName = normalizeValue(entry.sport_event?.sport_event_context?.competition?.name);
  const categoryName = normalizeValue(entry.sport_event?.sport_event_context?.category?.name);

  for (const leagueSlug of allowedLeagueSlugs) {
    const league = getSoccerLeagueConfig(leagueSlug);
    if (!league) {
      continue;
    }

    const matchesCountry = categoryName === normalizeValue(league.country) || categoryName.includes(normalizeValue(league.country));
    const matchesCompetition = league.searchTerms.some((term) => {
      const normalizedTerm = normalizeValue(term);
      return competitionName === normalizedTerm || competitionName.includes(normalizedTerm);
    });

    if (matchesCountry && matchesCompetition) {
      return {
        slug: league.slug,
        leagueName: league.name,
      } satisfies LeagueMatch;
    }
  }

  return null;
}

function mapEntryToGame(entry: SportradarScheduleEntry, leagueMatch: LeagueMatch): ExternalSoccerGame | null {
  const sportEvent = entry.sport_event;
  const status = entry.sport_event_status;
  const home = getCompetitor(sportEvent?.competitors, "home");
  const away = getCompetitor(sportEvent?.competitors, "away");
  const halftime = (status?.period_scores ?? []).find((period) => period.number === 1);

  if (!sportEvent?.id || !sportEvent.start_time || !home?.name || !away?.name) {
    return null;
  }

  return {
    externalMatchId: sportEvent.id,
    leagueSlug: leagueMatch.slug,
    leagueName: leagueMatch.leagueName,
    startTime: sportEvent.start_time,
    status: toSoccerStatus(status),
    homeTeam: home.name,
    awayTeam: away.name,
    homeScore: status?.home_score ?? 0,
    awayScore: status?.away_score ?? 0,
    halftimeHomeScore: halftime?.home_score ?? null,
    halftimeAwayScore: halftime?.away_score ?? null,
    minute: parsePlayedMinute(status?.clock?.played),
    homeShots: null,
    awayShots: null,
    homeShotsOnTarget: null,
    awayShotsOnTarget: null,
    homeCorners: null,
    awayCorners: null,
    homePossession: null,
    awayPossession: null,
    source: "sportradar-soccer",
    rawPayload: entry as unknown as Record<string, unknown>,
  };
}

function getTodayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export class SportradarSoccerProvider implements SoccerApiProvider {
  readonly providerKey = "sportradar-soccer";
  readonly displayName = "Sportradar Soccer";
  readonly supportsAutomaticTriggers = true;
  private readonly env = getSportradarSoccerEnv();
  private readonly cache = new Map<string, { expiresAt: number; value: Promise<SportradarScheduleEntry[]> }>();

  supportsLeague(leagueSlug: string) {
    return Boolean(getSoccerLeagueConfig(leagueSlug));
  }

  private async request(path: string, useExtendedProduct = false) {
    if (!this.env.apiKey) {
      throw new Error("Sportradar Soccer API key is missing.");
    }

    const accessLevel = useExtendedProduct ? this.env.extendedAccessLevel : this.env.accessLevel;
    const productPath = useExtendedProduct ? "soccer-extended" : "soccer";
    const url = `${this.env.baseUrl.replace(/\/+$/, "")}/${productPath}/${accessLevel}/v4/${this.env.language}/${path}`;

    const response = await fetch(url, {
      headers: {
        "x-api-key": this.env.apiKey,
      },
      next: { revalidate: 0 },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Sportradar Soccer authorization failed with ${response.status}.`);
    }

    if (response.status === 429) {
      throw new Error("Sportradar Soccer rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`Sportradar Soccer request failed with ${response.status}.`);
    }

    return (await response.json()) as SportradarScheduleResponse;
  }

  private async getCachedEntries(cacheKey: string, loader: () => Promise<SportradarScheduleEntry[]>) {
    const existing = this.cache.get(cacheKey);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      return existing.value;
    }

    const value = loader();
    this.cache.set(cacheKey, { expiresAt: now + 60_000, value });
    return value;
  }

  private async loadDailySchedules() {
    return this.getCachedEntries(`daily:${getTodayUtcDate()}`, async () => {
      const payload = await this.request(`schedules/${getTodayUtcDate()}/schedules.json`);
      return payload.schedules ?? [];
    });
  }

  private async loadLiveSummaries() {
    return this.getCachedEntries("live", async () => {
      const payload = await this.request("schedules/live/summaries.json", true);
      return payload.summaries ?? [];
    });
  }

  async getScheduledGames(leagueSlugs: string[]) {
    const allowedLeagueSlugs = new Set(leagueSlugs.filter((leagueSlug) => this.supportsLeague(leagueSlug)));
    if (allowedLeagueSlugs.size === 0) {
      return [] as ExternalSoccerGame[];
    }

    const schedules = await this.loadDailySchedules();
    return schedules
      .map((entry) => {
        const leagueMatch = resolveLeagueMatch(entry, allowedLeagueSlugs);
        return leagueMatch ? mapEntryToGame(entry, leagueMatch) : null;
      })
      .filter((entry): entry is ExternalSoccerGame => Boolean(entry));
  }

  async getLiveGames(leagueSlugs: string[]) {
    const allowedLeagueSlugs = new Set(leagueSlugs.filter((leagueSlug) => this.supportsLeague(leagueSlug)));
    if (allowedLeagueSlugs.size === 0) {
      return [] as ExternalSoccerGame[];
    }

    const summaries = await this.loadLiveSummaries();
    return summaries
      .map((entry) => {
        const leagueMatch = resolveLeagueMatch(entry, allowedLeagueSlugs);
        return leagueMatch ? mapEntryToGame(entry, leagueMatch) : null;
      })
      .filter((entry): entry is ExternalSoccerGame => Boolean(entry));
  }

  async getGameDetails(externalMatchId: string, leagueSlug?: string) {
    const payload = await this.request(`sport_events/${encodeURIComponent(externalMatchId)}/summary.json`, true);
    const summary = payload.summaries?.[0] ?? ({
      sport_event: (payload as unknown as { sport_event?: SportradarSportEvent }).sport_event,
      sport_event_status: (payload as unknown as { sport_event_status?: SportradarSportEventStatus }).sport_event_status,
    } satisfies SportradarScheduleEntry);

    const fallbackLeague = leagueSlug ? getSoccerLeagueConfig(leagueSlug) : null;
    const leagueMatch =
      resolveLeagueMatch(summary, new Set(leagueSlug ? [leagueSlug] : [])) ??
      (fallbackLeague
        ? {
            slug: fallbackLeague.slug,
            leagueName: fallbackLeague.name,
          }
        : null);

    return leagueMatch ? mapEntryToGame(summary, leagueMatch) : null;
  }

  async getMarketData(externalMatchId: string, marketKey: SoccerMarketKey) {
    void externalMatchId;
    void marketKey;
    return [] as ExternalSoccerMarketData[];
  }

  async getLeagueMeta(leagueSlug: string) {
    void leagueSlug;
    return { oddsAvailable: false };
  }
}
