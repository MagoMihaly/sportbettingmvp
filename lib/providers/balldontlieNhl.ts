import { normalizeProviderValue } from "@/lib/config/providerLeagues";
import { ExternalHockeyFixture, HockeyApiProvider } from "@/lib/types/provider";

type BalldontlieTeam = {
  id: number;
  full_name: string;
  tricode: string;
};

type BalldontlieGame = {
  id: number;
  game_date: string;
  start_time_utc: string;
  home_team: BalldontlieTeam;
  away_team: BalldontlieTeam;
  home_score: number;
  away_score: number;
  game_state: string;
  period: number;
  time_remaining: string;
};

type BalldontliePlay = {
  game_id: number;
  order: number;
  period: number;
  period_type: string;
  type: string;
  away_score?: number;
  home_score?: number;
};

export class BalldontlieNhlProvider implements HockeyApiProvider {
  readonly providerKey = "balldontlie-nhl";
  readonly displayName = "balldontlie NHL";
  readonly supportsAutomaticTriggers = true;

  private readonly apiKey = process.env.BALLDONTLIE_NHL_API_KEY ?? "";
  private readonly baseUrl = "https://api.balldontlie.io/nhl/v1";

  supportsLeague(league: string) {
    return normalizeProviderValue(league) === "nhl";
  }

  private hasApiKey() {
    return Boolean(this.apiKey);
  }

  private async fetchJson<T>(path: string, params?: URLSearchParams) {
    if (!this.hasApiKey()) {
      throw new Error("Missing BALLDONTLIE_NHL_API_KEY");
    }

    const url = `${this.baseUrl}${path}${params ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      headers: {
        Authorization: this.apiKey,
      },
      cache: "no-store",
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`balldontlie NHL request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  private getCandidateDates() {
    const now = new Date();
    return [-1, 0, 1].map((offset) => {
      const date = new Date(now);
      date.setUTCDate(now.getUTCDate() + offset);
      return date.toISOString().slice(0, 10);
    });
  }

  private toStatus(gameState: string) {
    const state = gameState.toUpperCase();
    if (["LIVE", "CRIT", "PREGAME"].includes(state)) return "live" as const;
    if (["OFF", "FINAL", "OVER"].includes(state)) return "finished" as const;
    return "scheduled" as const;
  }

  private async loadGames() {
    const dates = this.getCandidateDates();
    const games: BalldontlieGame[] = [];

    for (const date of dates) {
      const params = new URLSearchParams();
      params.append("dates[]", date);
      params.append("per_page", "100");
      const payload = await this.fetchJson<{ data?: BalldontlieGame[] }>("/games", params);
      games.push(...(payload.data ?? []));
    }

    return games;
  }

  private async loadPlays(gameId: number) {
    const params = new URLSearchParams({ game_id: String(gameId) });
    const payload = await this.fetchJson<{ data?: BalldontliePlay[] }>("/plays", params);
    return payload.data ?? [];
  }

  private buildPeriodScores(plays: BalldontliePlay[]) {
    const sorted = [...plays].sort((left, right) => left.order - right.order);
    let previousHome = 0;
    let previousAway = 0;

    const scores = {
      period1HomeGoals: 0,
      period1AwayGoals: 0,
      period2HomeGoals: 0,
      period2AwayGoals: 0,
    };

    for (const play of sorted) {
      if (play.type !== "goal") {
        if (typeof play.home_score === "number") previousHome = play.home_score;
        if (typeof play.away_score === "number") previousAway = play.away_score;
        continue;
      }

      const nextHome = typeof play.home_score === "number" ? play.home_score : previousHome;
      const nextAway = typeof play.away_score === "number" ? play.away_score : previousAway;
      const homeDelta = Math.max(0, nextHome - previousHome);
      const awayDelta = Math.max(0, nextAway - previousAway);

      if (play.period === 1) {
        scores.period1HomeGoals += homeDelta;
        scores.period1AwayGoals += awayDelta;
      }

      if (play.period === 2) {
        scores.period2HomeGoals += homeDelta;
        scores.period2AwayGoals += awayDelta;
      }

      previousHome = nextHome;
      previousAway = nextAway;
    }

    return scores;
  }

  async getUpcomingFixtures(leagues: string[]) {
    if (!leagues.some((league) => this.supportsLeague(league))) {
      return [];
    }

    if (!this.hasApiKey()) {
      return [];
    }

    const games = await this.loadGames();
    const fixtures: ExternalHockeyFixture[] = [];

    for (const game of games) {
      let periodScores = {
        period1HomeGoals: null as number | null,
        period1AwayGoals: null as number | null,
        period2HomeGoals: null as number | null,
        period2AwayGoals: null as number | null,
      };

      try {
        const plays = await this.loadPlays(game.id);
        const computed = this.buildPeriodScores(plays);
        periodScores = {
          period1HomeGoals: computed.period1HomeGoals,
          period1AwayGoals: computed.period1AwayGoals,
          period2HomeGoals: computed.period2HomeGoals,
          period2AwayGoals: computed.period2AwayGoals,
        };
      } catch {
        // Keep nulls if play-by-play is unavailable for the current tier or request.
      }

      fixtures.push({
        externalMatchId: String(game.id),
        externalLeagueId: "nhl",
        league: "NHL",
        homeTeam: game.home_team.full_name,
        awayTeam: game.away_team.full_name,
        startTime: game.start_time_utc,
        status: this.toStatus(game.game_state),
        homeScore: game.home_score,
        awayScore: game.away_score,
        period1HomeGoals: periodScores.period1HomeGoals,
        period1AwayGoals: periodScores.period1AwayGoals,
        period2HomeGoals: periodScores.period2HomeGoals,
        period2AwayGoals: periodScores.period2AwayGoals,
        bookmaker: null,
        odds: null,
        source: "balldontlie-nhl",
        rawPayload: {
          game,
          periodScores,
        },
      });
    }

    return fixtures.sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
  }
}
