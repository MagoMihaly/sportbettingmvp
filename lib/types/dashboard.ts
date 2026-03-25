import type {
  AlertRecord,
  IngestRunRecord,
  OddsSnapshotRecord,
  ProfileRecord,
  PushSubscriptionRecord,
  MlbAlertRecord,
  MlbGameRecord,
  MlbLiveSignalRecord,
  MlbOddsSnapshotRecord,
  MlbProviderSyncLogRecord,
  MlbStateSnapshotRecord,
  MlbUserSettings,
  MlbWatchlistRecord,
  SoccerAlertRecord,
  SoccerDataQualityFlagRecord,
  SoccerGameRecord,
  SoccerLiveSignalRecord,
  SoccerMatchStateSnapshotRecord,
  SoccerOddsSnapshotRecord,
  SoccerProviderSyncLogRecord,
  SoccerUserSettings,
  SoccerWatchlistRecord,
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

export type SoccerDashboardStats = {
  trackedGames: number;
  activeLeagues: number;
  watchlistRows: number;
  liveSignals: number;
  triggeredSignals: number;
  alertsCount: number;
  oddsSnapshots: number;
  dataQualityFlags: number;
};

export type SoccerDashboardPayload = {
  viewer: DashboardViewer;
  settings: SoccerUserSettings | null;
  games: SoccerGameRecord[];
  watchlists: SoccerWatchlistRecord[];
  liveSignals: SoccerLiveSignalRecord[];
  alerts: SoccerAlertRecord[];
  oddsSnapshots: SoccerOddsSnapshotRecord[];
  stateSnapshots: SoccerMatchStateSnapshotRecord[];
  syncLogs: SoccerProviderSyncLogRecord[];
  dataQualityFlags: SoccerDataQualityFlagRecord[];
  stats: SoccerDashboardStats;
  provider: ProviderSummary;
};

export type MlbDashboardStats = {
  trackedGames: number;
  activeSystems: number;
  watchlistRows: number;
  liveSignals: number;
  triggeredSignals: number;
  alertsCount: number;
  oddsSnapshots: number;
};

export type MlbDashboardPayload = {
  viewer: DashboardViewer;
  settings: MlbUserSettings | null;
  games: MlbGameRecord[];
  watchlists: MlbWatchlistRecord[];
  liveSignals: MlbLiveSignalRecord[];
  alerts: MlbAlertRecord[];
  oddsSnapshots: MlbOddsSnapshotRecord[];
  stateSnapshots: MlbStateSnapshotRecord[];
  syncLogs: MlbProviderSyncLogRecord[];
  stats: MlbDashboardStats;
  provider: ProviderSummary;
};
