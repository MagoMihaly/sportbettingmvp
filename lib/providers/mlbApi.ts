import { ApiBaseballMlbProvider } from "@/lib/providers/apiBaseballMlb";
import { mlbSystems } from "@/lib/config/mlbSystems";
import type { ExternalMlbGame, ExternalMlbMarketData, MlbApiProvider } from "@/lib/types/mlb";

class MockMlbProvider implements MlbApiProvider {
  readonly providerKey = "mock-mlb";
  readonly displayName = "Mock MLB Provider";
  readonly supportsAutomaticTriggers = true;

  private buildGames() {
    const now = Date.now();

    return [
      {
        externalGameId: "mlb-1001",
        leagueName: "MLB",
        startTime: new Date(now - 150 * 60 * 1000).toISOString(),
        status: "live",
        homeTeam: "Yankees",
        awayTeam: "Blue Jays",
        homeScore: 0,
        awayScore: 0,
        inning: 5,
        halfInning: "bottom",
        homeHits: 3,
        awayHits: 2,
        homeErrors: 0,
        awayErrors: 0,
        source: "mock-mlb",
        rawPayload: { demo: true, game: 1 },
      },
      {
        externalGameId: "mlb-1002",
        leagueName: "MLB",
        startTime: new Date(now - 185 * 60 * 1000).toISOString(),
        status: "live",
        homeTeam: "Dodgers",
        awayTeam: "Padres",
        homeScore: 1,
        awayScore: 0,
        inning: 7,
        halfInning: "top",
        homeHits: 5,
        awayHits: 4,
        homeErrors: 0,
        awayErrors: 1,
        source: "mock-mlb",
        rawPayload: { demo: true, game: 2 },
      },
      {
        externalGameId: "mlb-1003",
        leagueName: "MLB",
        startTime: new Date(now + 95 * 60 * 1000).toISOString(),
        status: "scheduled",
        homeTeam: "Braves",
        awayTeam: "Phillies",
        homeScore: 0,
        awayScore: 0,
        inning: null,
        halfInning: null,
        homeHits: null,
        awayHits: null,
        homeErrors: null,
        awayErrors: null,
        source: "mock-mlb",
        rawPayload: { demo: true, game: 3 },
      },
    ] satisfies ExternalMlbGame[];
  }

  async getScheduledGames() {
    return this.buildGames().filter((game) => game.status === "scheduled");
  }

  async getLiveGames() {
    return this.buildGames().filter((game) => game.status === "live");
  }

  async getGameDetails(externalGameId: string) {
    return this.buildGames().find((game) => game.externalGameId === externalGameId) ?? null;
  }

  async getMarketData(externalGameId: string, marketKey: (typeof mlbSystems)[number]["key"]) {
    return [
      {
        marketKey,
        bookmaker: "FanDuel",
        odds: marketKey === "MLB_F5_SCORELESS" ? 1.96 : 1.82,
        suspended: false,
        source: "mock-mlb",
        payload: { externalGameId, marketKey },
      },
    ] satisfies ExternalMlbMarketData[];
  }
}

export function createMlbProvider(): MlbApiProvider {
  const configuredProvider = (process.env.LIVE_MLB_PROVIDER ?? "mock").toLowerCase();

  if (configuredProvider === "api-baseball") {
    return new ApiBaseballMlbProvider();
  }

  return new MockMlbProvider();
}

export type { ExternalMlbGame, ExternalMlbMarketData, MlbApiProvider } from "@/lib/types/mlb";
