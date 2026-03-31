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
    const failures: string[] = [];
    const results = await Promise.all(
      this.providers.map(async (provider) => {
        const providerLeagues = leagues.filter((league) => provider.supportsLeague(league));
        if (providerLeagues.length === 0) {
          return [] as ExternalHockeyGame[];
        }

        try {
          return await provider[method](providerLeagues);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown hockey provider error.";
          failures.push(`${provider.displayName}: ${message}`);
          console.warn(`[hockey-provider] ${provider.displayName} ${method} failed`, error);
          return [] as ExternalHockeyGame[];
        }
      }),
    );

    const merged = results.flat().sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
    if (merged.length === 0 && failures.length > 0) {
      throw new Error(failures[0]);
    }

    return merged;
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

      try {
        const game = await provider.getGameDetails(externalMatchId, league);
        if (game) {
          return game;
        }
      } catch (error) {
        console.warn(`[hockey-provider] ${provider.displayName} getGameDetails failed`, error);
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
