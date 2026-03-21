import type {
  IngestRunRecord,
  OddsSnapshotRecord,
  SignalRecord,
  TrackedMatchRecord,
  UserSettings,
} from "@/lib/types/database";

export type ProviderSummary = {
  providerKey: string;
  displayName: string;
  supportsAutomaticTriggers: boolean;
};

export type DashboardStats = {
  totalSignals: number;
  activeLeagues: number;
  triggeredSignals: number;
  wonSignals: number;
  lostSignals: number;
  pendingSignals: number;
  notificationStatus: string;
  trackedMatches: number;
  oddsSnapshots: number;
};

export type DashboardPayload = {
  signals: SignalRecord[];
  settings: UserSettings | null;
  trackedMatches: TrackedMatchRecord[];
  oddsSnapshots: OddsSnapshotRecord[];
  ingestRuns: IngestRunRecord[];
  provider: ProviderSummary;
  stats: DashboardStats;
};

export type EnginePayload = {
  trackedMatches: TrackedMatchRecord[];
  oddsSnapshots: OddsSnapshotRecord[];
  ingestRuns: IngestRunRecord[];
  settings: UserSettings | null;
  provider: ProviderSummary;
};
