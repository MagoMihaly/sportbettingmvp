import { BalldontlieNhlProvider } from "@/lib/providers/balldontlieNhl";
import { MockHockeyApiProvider } from "@/lib/providers/mockHockeyApi";
import { TheSportsDbHockeyProvider } from "@/lib/providers/theSportsDb";
import type { ExternalHockeyGame, ExternalMarketData, HockeyApiProvider } from "@/lib/types/provider";

class HybridHockeyProvider implements HockeyApiProvider {
  readonly providerKey = "hybrid";
  readonly displayName = "Hybrid: TheSportsDB + balldontlie NHL";
  readonly supportsAutomaticTriggers = true;

  constructor(private readonly providers: HockeyApiProvider[]) {}

  supportsLeague() {
    return true;
  }

  private async collectGames(
    method: "getScheduledGames" | "getLiveGames",
    leagues: string[],
  ) {
    const results = await Promise.all(
      this.providers.map((provider) => {
        const providerLeagues = leagues.filter((league) => provider.supportsLeague(league));
        return providerLeagues.length === 0
          ? Promise.resolve([] as ExternalHockeyGame[])
          : provider[method](providerLeagues);
      }),
    );

    return results.flat().sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
  }

  async getScheduledGames(leagues: string[]) {
    return this.collectGames("getScheduledGames", leagues);
  }

  async getLiveGames(leagues: string[]) {
    return this.collectGames("getLiveGames", leagues);
  }

  async getGameDetails(externalMatchId: string, league?: string) {
    for (const provider of this.providers) {
      if (league && !provider.supportsLeague(league)) {
        continue;
      }

      const game = await provider.getGameDetails(externalMatchId, league);
      if (game) {
        return game;
      }
    }

    return null;
  }

  async getMarketData(externalMatchId: string, marketType: string) {
    const payload = await Promise.all(
      this.providers.map((provider) => provider.getMarketData(externalMatchId, marketType).catch(() => [] as ExternalMarketData[])),
    );

    return payload.flat();
  }
}

export function createHockeyProvider(): HockeyApiProvider {
  const configuredProvider = (process.env.LIVE_HOCKEY_PROVIDER ?? "hybrid").toLowerCase();

  if (configuredProvider === "mock") {
    return new MockHockeyApiProvider();
  }

  if (configuredProvider === "thesportsdb") {
    return new TheSportsDbHockeyProvider();
  }

  if (configuredProvider === "balldontlie-nhl") {
    return new BalldontlieNhlProvider();
  }

  return new HybridHockeyProvider([new TheSportsDbHockeyProvider(), new BalldontlieNhlProvider()]);
}

export type { ExternalHockeyGame, ExternalMarketData, HockeyApiProvider } from "@/lib/types/provider";
