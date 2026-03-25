import { ApiBaseballMlbProvider } from "@/lib/providers/apiBaseballMlb";
import { mockMlbGames } from "@/lib/mock/mlb";
import type { ExternalMlbGame, MlbApiProvider } from "@/lib/types/mlb";

class MockMlbProvider implements MlbApiProvider {
  readonly providerKey = "mock-mlb";
  readonly displayName = "Mock MLB Provider";
  readonly supportsAutomaticTriggers = true;

  private buildGames() {
    return mockMlbGames.map((game) => ({
      externalGameId: game.external_game_id,
      leagueName: game.league_name,
      startTime: game.start_time,
      status: game.status,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      homeScore: game.home_score,
      awayScore: game.away_score,
      inning: game.inning,
      halfInning: game.half_inning,
      homeHits: game.home_hits,
      awayHits: game.away_hits,
      homeErrors: game.home_errors,
      awayErrors: game.away_errors,
      source: "mock-mlb",
      rawPayload: game.raw_payload ?? { demo: true },
    })) satisfies ExternalMlbGame[];
  }

  async getScheduledGames() {
    return this.buildGames().filter((game) => game.status === "scheduled");
  }

  async getLiveGames() {
    return this.buildGames().filter((game) => game.status === "finished");
  }

  async getGameDetails(externalGameId: string) {
    return this.buildGames().find((game) => game.externalGameId === externalGameId) ?? null;
  }
}

export function createMlbProvider(): MlbApiProvider {
  const configuredProvider = (process.env.LIVE_MLB_PROVIDER ?? "mock").toLowerCase();

  if (configuredProvider === "api-baseball") {
    return new ApiBaseballMlbProvider();
  }

  return new MockMlbProvider();
}

export type { ExternalMlbGame, MlbApiProvider } from "@/lib/types/mlb";
