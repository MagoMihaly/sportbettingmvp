import type {
  AlertRecord,
  IngestRunRecord,
  OddsSnapshotRecord,
  ProfileRecord,
  PushSubscriptionRecord,
  SignalRecord,
  TrackedMatchRecord,
  UserSettings,
} from "@/lib/types/database";

export type ProviderSummary = {
  providerKey: string;
  displayName: string;
  supportsAutomaticTriggers: boolean;
};

export type DashboardViewer = {
  userId: string;
  email: string;
  isDemo: boolean;
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
  alertsCount: number;
  activePushSubscriptions: number;
};

export type DashboardPayload = {
  viewer: DashboardViewer;
  profile: ProfileRecord | null;
  signals: SignalRecord[];
  alerts: AlertRecord[];
  settings: UserSettings | null;
  pushSubscriptions: PushSubscriptionRecord[];
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
