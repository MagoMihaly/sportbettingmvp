import { getLeagueAliases, normalizeProviderValue } from "@/lib/config/providerLeagues";
import type { ExternalHockeyGame, ExternalMarketData, HockeyApiProvider } from "@/lib/types/provider";

type TheSportsDbLeague = {
  idLeague?: string;
  strLeague?: string;
  strSport?: string;
};

type TheSportsDbEvent = {
  idEvent?: string;
  idLeague?: string;
  strLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  dateEvent?: string;
  strTimestamp?: string;
  strTime?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  strStatus?: string | null;
};

export class TheSportsDbHockeyProvider implements HockeyApiProvider {
  readonly providerKey = "thesportsdb";
  readonly displayName = "TheSportsDB";
  readonly supportsAutomaticTriggers = false;

  private readonly apiKey = process.env.THESPORTSDB_API_KEY ?? process.env.PROVIDER_API_KEY ?? "123";
  private readonly apiVersion = process.env.THESPORTSDB_API_VERSION ?? "v1";
  private readonly baseV1 = "https://www.thesportsdb.com/api/v1/json";
  private readonly baseV2 = "https://www.thesportsdb.com/api/v2/json";

  supportsLeague(league: string) {
    return normalizeProviderValue(league) !== "nhl";
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`TheSportsDB request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  private async getAllLeagues() {
    const payload = await this.fetchJson<{ leagues?: TheSportsDbLeague[] }>(`${this.baseV1}/${this.apiKey}/all_leagues.php`);
    return (payload.leagues ?? []).filter((league) => league.strSport === "Ice Hockey");
  }

  private async resolveLeagueIds(selectedLeagues: string[]) {
    const leagues = await this.getAllLeagues();

    return selectedLeagues
      .filter((league) => this.supportsLeague(league))
      .map((selectedLeague) => {
        const aliases = getLeagueAliases(selectedLeague);
        const match = leagues.find((league) => {
          const normalizedLeague = normalizeProviderValue(league.strLeague ?? "");
          return aliases.some((alias) => normalizedLeague.includes(alias));
        });

        if (!match?.idLeague || !match.strLeague) {
          return null;
        }

        return {
          internalLeague: selectedLeague,
          providerLeagueId: match.idLeague,
          providerLeagueName: match.strLeague,
        };
      })
      .filter(Boolean) as Array<{ internalLeague: string; providerLeagueId: string; providerLeagueName: string }>;
  }

  private mapEvent(event: TheSportsDbEvent, internalLeague: string): ExternalHockeyGame | null {
    if (!event.idEvent || !event.strHomeTeam || !event.strAwayTeam) {
      return null;
    }

    const startTime = event.strTimestamp
      ? new Date(event.strTimestamp).toISOString()
      : event.dateEvent
        ? new Date(`${event.dateEvent}T${event.strTime ?? "00:00:00"}Z`).toISOString()
        : new Date().toISOString();

    const homeScore = Number(event.intHomeScore ?? 0) || 0;
    const awayScore = Number(event.intAwayScore ?? 0) || 0;
    const statusValue = (event.strStatus ?? "").toLowerCase();

    const status = statusValue.includes("match finished") || statusValue.includes("ft")
      ? "finished"
      : statusValue.includes("live") || statusValue.includes("in play")
        ? "live"
        : homeScore > 0 || awayScore > 0
          ? "finished"
          : "scheduled";

    return {
      externalMatchId: event.idEvent,
      externalLeagueId: event.idLeague ?? null,
      league: internalLeague,
      homeTeam: event.strHomeTeam,
      awayTeam: event.strAwayTeam,
      startTime,
      status,
      homeScore,
      awayScore,
      period1HomeGoals: null,
      period1AwayGoals: null,
      period2HomeGoals: null,
      period2AwayGoals: null,
      bookmaker: null,
      odds: null,
      source: "thesportsdb",
      rawPayload: event as Record<string, unknown>,
    };
  }

  private async getLeagueSchedule(providerLeagueId: string, internalLeague: string) {
    const [nextPayload, previousPayload] = await Promise.all([
      this.fetchJson<{ events?: TheSportsDbEvent[] }>(`${this.baseV1}/${this.apiKey}/eventsnextleague.php?id=${providerLeagueId}`),
      this.fetchJson<{ events?: TheSportsDbEvent[] }>(`${this.baseV1}/${this.apiKey}/eventspastleague.php?id=${providerLeagueId}`),
    ]);

    return [...(previousPayload.events ?? []), ...(nextPayload.events ?? [])]
      .map((event) => this.mapEvent(event, internalLeague))
      .filter(Boolean) as ExternalHockeyGame[];
  }

  private async getLeagueLive(providerLeagueId: string, internalLeague: string) {
    const payload = await this.fetchJson<{ events?: TheSportsDbEvent[] }>(`${this.baseV2}/livescore/${providerLeagueId}`, {
      headers: {
        "X-API-KEY": this.apiKey,
      },
    });

    return (payload.events ?? [])
      .map((event) => this.mapEvent(event, internalLeague))
      .filter(Boolean) as ExternalHockeyGame[];
  }

  private async loadGames(leagues: string[]) {
    const resolvedLeagues = await this.resolveLeagueIds(leagues);
    const games: ExternalHockeyGame[] = [];

    for (const league of resolvedLeagues) {
      try {
        const leagueGames = this.apiVersion === "v2" && this.apiKey !== "123"
          ? await this.getLeagueLive(league.providerLeagueId, league.internalLeague)
          : await this.getLeagueSchedule(league.providerLeagueId, league.internalLeague);

        games.push(...leagueGames);
      } catch {
        continue;
      }
    }

    return games.sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
  }

  async getScheduledGames(leagues: string[]) {
    return (await this.loadGames(leagues)).filter((game) => game.status !== "live");
  }

  async getLiveGames(leagues: string[]) {
    return (await this.loadGames(leagues)).filter((game) => game.status === "live");
  }

  async getGameDetails(externalMatchId: string, league?: string) {
    const leagues = league ? [league] : [];
    const games = await this.loadGames(leagues.length > 0 ? leagues : ["Czech Extraliga", "Finnish Liiga", "KHL"]);
    return games.find((game) => game.externalMatchId === externalMatchId) ?? null;
  }

  async getMarketData(externalMatchId: string, marketType: string) {
    return [
      {
        marketType,
        bookmaker: null,
        odds: null,
        source: "thesportsdb",
        payload: { externalMatchId, note: "Market data placeholder for future odds adapter." },
      },
    ] satisfies ExternalMarketData[];
  }
}
