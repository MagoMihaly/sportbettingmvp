import { getSportradarMlbEnv } from "@/lib/supabase/env";
import type { ExternalMlbGame, MlbApiProvider } from "@/lib/types/mlb";

type SportradarMlbPitcher = {
  full_name?: string;
  era?: string | number | null;
  win?: number | null;
  loss?: number | null;
};

type SportradarMlbTeam = {
  name?: string;
  market?: string;
  abbr?: string;
  id?: string;
  runs?: number | null;
  hits?: number | null;
  errors?: number | null;
  probable_pitcher?: SportradarMlbPitcher | null;
};

type SportradarMlbOutcome = {
  current_inning?: number | null;
  current_inning_half?: string | null;
};

type SportradarMlbGame = {
  id?: string;
  status?: string;
  scheduled?: string;
  game_number?: number | null;
  double_header?: boolean;
  home?: SportradarMlbTeam | null;
  away?: SportradarMlbTeam | null;
  outcome?: SportradarMlbOutcome | null;
};

type SportradarMlbDailySummary = {
  league?: {
    games?: Array<{ game?: SportradarMlbGame } | SportradarMlbGame>;
  };
  games?: Array<{ game?: SportradarMlbGame } | SportradarMlbGame>;
};

function parsePitcherRating(pitcher: SportradarMlbPitcher | null | undefined) {
  const era = typeof pitcher?.era === "string" ? Number(pitcher.era) : typeof pitcher?.era === "number" ? pitcher.era : null;
  if (era === null || !Number.isFinite(era)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(era, 9));
  return Number((100 - clamped * 10).toFixed(1));
}

function normalizeHalfInning(value: string | null | undefined): ExternalMlbGame["halfInning"] {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized.startsWith("top")) {
    return "top";
  }
  if (normalized.startsWith("bottom")) {
    return "bottom";
  }
  return null;
}

function toGameStatus(value: string | undefined): ExternalMlbGame["status"] {
  const normalized = (value ?? "").toLowerCase();
  if (["scheduled", "created", "time-tbd", "if-necessary"].includes(normalized)) {
    return "scheduled";
  }
  if (["closed", "complete", "ended", "final"].includes(normalized)) {
    return "finished";
  }
  return "live";
}

function unwrapGames(payload: SportradarMlbDailySummary) {
  const rows = payload.league?.games ?? payload.games ?? [];
  return rows
    .map((row) => ("game" in row ? row.game : row))
    .filter((row): row is SportradarMlbGame => Boolean(row));
}

function formatTeamName(team: SportradarMlbTeam | null | undefined) {
  if (!team?.market || !team?.name) {
    return team?.name ?? "";
  }
  return `${team.market} ${team.name}`.trim();
}

function mapGame(game: SportradarMlbGame): ExternalMlbGame | null {
  const home = game.home ?? null;
  const away = game.away ?? null;

  if (!game.id || !game.scheduled || !home?.name || !away?.name) {
    return null;
  }

  const homeStarter = home.probable_pitcher ?? null;
  const awayStarter = away.probable_pitcher ?? null;

  return {
    externalGameId: game.id,
    leagueName: "MLB",
    startTime: game.scheduled,
    status: toGameStatus(game.status),
    homeTeam: formatTeamName(home),
    awayTeam: formatTeamName(away),
    homeScore: home.runs ?? 0,
    awayScore: away.runs ?? 0,
    inning: game.outcome?.current_inning ?? null,
    halfInning: normalizeHalfInning(game.outcome?.current_inning_half),
    homeHits: home.hits ?? null,
    awayHits: away.hits ?? null,
    homeErrors: home.errors ?? null,
    awayErrors: away.errors ?? null,
    source: "sportradar-mlb",
    rawPayload: {
      game,
      pregame: {
        homeStarterName: homeStarter?.full_name ?? null,
        awayStarterName: awayStarter?.full_name ?? null,
        homeStarterRating: parsePitcherRating(homeStarter),
        awayStarterRating: parsePitcherRating(awayStarter),
        homeStarter: homeStarter,
        awayStarter: awayStarter,
        doubleHeader: game.double_header ?? false,
      },
    },
  };
}

function getUtcDatePath(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function getRecentDates(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - index);
    return getUtcDatePath(date);
  });
}

export class SportradarMlbProvider implements MlbApiProvider {
  readonly providerKey = "sportradar-mlb";
  readonly displayName = "Sportradar MLB";
  readonly supportsAutomaticTriggers = true;
  private readonly env = getSportradarMlbEnv();
  private readonly cache = new Map<string, { expiresAt: number; value: Promise<ExternalMlbGame[]> }>();

  private async request(path: string) {
    if (!this.env.apiKey) {
      throw new Error("Sportradar MLB API key is missing.");
    }

    const url = `${this.env.baseUrl.replace(/\/+$/, "")}/mlb/${this.env.accessLevel}/v7/${this.env.language}/${path}`;
    const response = await fetch(url, {
      headers: {
        "x-api-key": this.env.apiKey,
      },
      next: { revalidate: 0 },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Sportradar MLB authorization failed with ${response.status}.`);
    }

    if (response.status === 429) {
      throw new Error("Sportradar MLB rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`Sportradar MLB request failed with ${response.status}.`);
    }

    return (await response.json()) as SportradarMlbDailySummary;
  }

  private async getCachedDailySummary(datePath: string) {
    const cacheKey = `summary:${datePath}`;
    const existing = this.cache.get(cacheKey);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      return existing.value;
    }

    const value = (async () => {
      const payload = await this.request(`games/${datePath}/summary.json`);
      return unwrapGames(payload)
        .map(mapGame)
        .filter((game): game is ExternalMlbGame => Boolean(game));
    })();

    this.cache.set(cacheKey, { expiresAt: now + 60_000, value });
    return value;
  }

  async getScheduledGames() {
    const today = await this.getCachedDailySummary(getUtcDatePath(new Date()));
    return today.filter((game) => game.status === "scheduled");
  }

  async getLiveGames() {
    const recentDays = await Promise.all(getRecentDates(3).map((datePath) => this.getCachedDailySummary(datePath)));
    return recentDays.flat().filter((game) => game.status !== "scheduled");
  }

  async getGameDetails(externalGameId: string) {
    const path = `games/${encodeURIComponent(externalGameId)}/summary.json`;
    const payload = await this.request(path);
    const game = unwrapGames(payload)[0] ?? null;
    return game ? mapGame(game) : null;
  }
}
