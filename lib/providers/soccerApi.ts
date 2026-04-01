import { ApiFootballSoccerProvider } from "@/lib/providers/apiFootballSoccer";
import { SportradarSoccerProvider } from "@/lib/providers/sportradarSoccer";
import { defaultSoccerLeagueSlugs } from "@/lib/config/soccerLeagues";
import { getSportradarSoccerEnv } from "@/lib/supabase/env";
import type { ExternalSoccerGame, ExternalSoccerMarketData, SoccerApiProvider } from "@/lib/types/soccer";

class MockSoccerProvider implements SoccerApiProvider {
  readonly providerKey = "mock-soccer";
  readonly displayName = "Mock Soccer Provider";
  readonly supportsAutomaticTriggers = true;

  supportsLeague(leagueSlug: string) {
    return defaultSoccerLeagueSlugs.includes(leagueSlug as (typeof defaultSoccerLeagueSlugs)[number]);
  }

  async getScheduledGames() {
    return [] as ExternalSoccerGame[];
  }

  async getLiveGames() {
    return [] as ExternalSoccerGame[];
  }

  async getGameDetails() {
    return null;
  }

  async getMarketData() {
    return [] as ExternalSoccerMarketData[];
  }
}

export function createSoccerProvider(): SoccerApiProvider {
  const configuredProvider = (process.env.LIVE_SOCCER_PROVIDER ?? "").toLowerCase();
  const sportradarEnv = getSportradarSoccerEnv();

  if (configuredProvider === "mock") {
    return new MockSoccerProvider();
  }

  if (configuredProvider === "sportradar") {
    return new SportradarSoccerProvider();
  }

  if (!configuredProvider && sportradarEnv.apiKey) {
    return new SportradarSoccerProvider();
  }

  return new ApiFootballSoccerProvider();
}

export type { ExternalSoccerGame, ExternalSoccerMarketData, SoccerApiProvider } from "@/lib/types/soccer";
