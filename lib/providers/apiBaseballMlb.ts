import { getApiBaseballEnv } from "@/lib/supabase/env";
import type { ExternalMlbGame, MlbApiProvider } from "@/lib/types/mlb";

function createNotReadyError(reason: string) {
  return new Error(`API-Baseball MLB adapter is not fully activated yet: ${reason}`);
}

export class ApiBaseballMlbProvider implements MlbApiProvider {
  readonly providerKey = "api-baseball";
  readonly displayName = "API-Baseball MLB Provider";
  readonly supportsAutomaticTriggers = true;

  private getEnv() {
    return getApiBaseballEnv();
  }

  private assertConfigured() {
    const env = this.getEnv();
    if (!env.apiKey) {
      throw createNotReadyError("missing API_BASEBALL_API_KEY");
    }

    return env;
  }

  async getScheduledGames(): Promise<ExternalMlbGame[]> {
    this.assertConfigured();
    throw createNotReadyError("fixture mapping is prepared but intentionally not activated before real payload validation");
  }

  async getLiveGames(): Promise<ExternalMlbGame[]> {
    this.assertConfigured();
    throw createNotReadyError("live mapping is prepared but intentionally not activated before real payload validation");
  }

  async getGameDetails(externalGameId: string): Promise<ExternalMlbGame | null> {
    this.assertConfigured();
    void externalGameId;
    throw createNotReadyError("game details mapping is prepared but intentionally not activated before real payload validation");
  }
}
