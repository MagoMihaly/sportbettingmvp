import { BalldontlieNhlProvider } from "@/lib/providers/balldontlieNhl";
import { MockHockeyApiProvider } from "@/lib/providers/mockHockeyApi";
import { TheSportsDbHockeyProvider } from "@/lib/providers/theSportsDb";
import { ExternalHockeyFixture, HockeyApiProvider } from "@/lib/types/provider";

class HybridHockeyProvider implements HockeyApiProvider {
  readonly providerKey = "hybrid";
  readonly displayName = "Hybrid: TheSportsDB + balldontlie NHL";
  readonly supportsAutomaticTriggers = true;

  constructor(private readonly providers: HockeyApiProvider[]) {}

  supportsLeague() {
    return true;
  }

  async getUpcomingFixtures(leagues: string[]) {
    const results = await Promise.all(
      this.providers.map((provider) => {
        const providerLeagues = leagues.filter((league) => provider.supportsLeague(league));
        return providerLeagues.length === 0 ? Promise.resolve([] as ExternalHockeyFixture[]) : provider.getUpcomingFixtures(providerLeagues);
      }),
    );

    return results.flat().sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime());
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

export type { ExternalHockeyFixture, HockeyApiProvider } from "@/lib/types/provider";
