import type { ExternalHockeyGame, ExternalMarketData, HockeyApiProvider } from "@/lib/types/provider";

export class MockHockeyApiProvider implements HockeyApiProvider {
  readonly providerKey = "mock";
  readonly displayName = "Mock Hockey Provider";
  readonly supportsAutomaticTriggers = true;

  supportsLeague() {
    return true;
  }

  private buildGames(leagues: string[]) {
    return leagues.slice(0, 6).map((league, index) => {
      const homeScoreless = index % 2 === 0;
      const awayScoreless = index % 3 === 0;

      const period1HomeGoals = homeScoreless ? 0 : 1;
      const period1AwayGoals = awayScoreless ? 0 : 1;
      const period2HomeGoals = homeScoreless ? 0 : index % 2;
      const period2AwayGoals = awayScoreless ? 0 : 1;

      return {
        externalMatchId: `mock-${index + 1}`,
        externalLeagueId: `mock-league-${index + 1}`,
        league,
        homeTeam: `Home ${index + 1}`,
        awayTeam: `Away ${index + 1}`,
        startTime: new Date(Date.now() + (index + 1) * 3600000).toISOString(),
        status: index < 2 ? "live" : "scheduled",
        period1HomeGoals,
        period1AwayGoals,
        period2HomeGoals,
        period2AwayGoals,
        homeScore: period1HomeGoals + period2HomeGoals,
        awayScore: period1AwayGoals + period2AwayGoals,
        bookmaker: index % 2 === 0 ? "Pinnacle" : "Bet365",
        odds: 1.82 + index * 0.09,
        source: "mock-provider",
        rawPayload: { market: "3rd period team goal", league },
      } satisfies ExternalHockeyGame;
    });
  }

  async getScheduledGames(leagues: string[]) {
    return this.buildGames(leagues).filter((game) => game.status !== "live");
  }

  async getLiveGames(leagues: string[]) {
    return this.buildGames(leagues).filter((game) => game.status === "live");
  }

  async getGameDetails(externalMatchId: string) {
    return this.buildGames(["Mock League"]).find((game) => game.externalMatchId === externalMatchId) ?? null;
  }

  async getMarketData(externalMatchId: string, marketType: string) {
    return [
      {
        marketType,
        bookmaker: "Pinnacle",
        odds: 1.94,
        source: "mock-provider",
        payload: { externalMatchId },
      },
    ] satisfies ExternalMarketData[];
  }
}
