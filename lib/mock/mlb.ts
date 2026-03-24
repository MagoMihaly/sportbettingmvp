import type {
  MlbAlertRecord,
  MlbGameRecord,
  MlbLiveSignalRecord,
  MlbOddsSnapshotRecord,
  MlbProviderSyncLogRecord,
  MlbStateSnapshotRecord,
  MlbUserSettings,
  MlbWatchlistRecord,
} from "@/lib/types/database";

const now = new Date();

export const mockMlbSettings: MlbUserSettings = {
  user_id: "demo-mlb-user",
  selected_systems: ["MLB_F5_SCORELESS", "MLB_LATE_ONE_RUN_GAME"],
  notifications_enabled: true,
  email_notifications: false,
  push_notifications: true,
  timezone: "Europe/Budapest",
  preferred_market_key: "MLB_F5_SCORELESS",
};

export const mockMlbGames: MlbGameRecord[] = [
  {
    id: "mlb-game-1",
    created_at: now.toISOString(),
    provider: "mock-mlb",
    external_game_id: "mlb-1001",
    league_name: "MLB",
    status: "live",
    start_time: new Date(now.getTime() - 150 * 60 * 1000).toISOString(),
    home_team: "Yankees",
    away_team: "Blue Jays",
    home_score: 0,
    away_score: 0,
    inning: 5,
    half_inning: "bottom",
    home_hits: 3,
    away_hits: 2,
    home_errors: 0,
    away_errors: 0,
    raw_payload: { demo: true },
    last_synced_at: now.toISOString(),
  },
  {
    id: "mlb-game-2",
    created_at: now.toISOString(),
    provider: "mock-mlb",
    external_game_id: "mlb-1002",
    league_name: "MLB",
    status: "live",
    start_time: new Date(now.getTime() - 185 * 60 * 1000).toISOString(),
    home_team: "Dodgers",
    away_team: "Padres",
    home_score: 1,
    away_score: 0,
    inning: 7,
    half_inning: "top",
    home_hits: 5,
    away_hits: 4,
    home_errors: 0,
    away_errors: 1,
    raw_payload: { demo: true },
    last_synced_at: now.toISOString(),
  },
];

export const mockMlbWatchlists: MlbWatchlistRecord[] = [
  {
    id: "mlb-watch-1",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    game_id: "mlb-game-1",
    market_key: "MLB_F5_SCORELESS",
    rule_type: "MLB_F5_SCORELESS",
    status: "triggered",
    notes: "Demo F5 row",
  },
  {
    id: "mlb-watch-2",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    game_id: "mlb-game-2",
    market_key: "MLB_LATE_ONE_RUN_GAME",
    rule_type: "MLB_LATE_ONE_RUN_GAME",
    status: "triggered",
    notes: "Demo late-game row",
  },
];

export const mockMlbStateSnapshots: MlbStateSnapshotRecord[] = [
  {
    id: "mlb-snap-1",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    game_id: "mlb-game-1",
    captured_at: now.toISOString(),
    inning: 5,
    half_inning: "bottom",
    home_score: 0,
    away_score: 0,
    home_hits: 3,
    away_hits: 2,
    payload: { demo: true },
  },
];

export const mockMlbLiveSignals: MlbLiveSignalRecord[] = [
  {
    id: "mlb-live-1",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    game_id: "mlb-game-1",
    rule_type: "MLB_F5_SCORELESS",
    signal_key: "mlb-1001:MLB_F5_SCORELESS",
    market_key: "MLB_F5_SCORELESS",
    inning: 5,
    home_score: 0,
    away_score: 0,
    trigger_condition_met: true,
    triggered_at: now.toISOString(),
    source_provider: "mock-mlb",
    payload: { demo: true },
  },
  {
    id: "mlb-live-2",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    game_id: "mlb-game-2",
    rule_type: "MLB_LATE_ONE_RUN_GAME",
    signal_key: "mlb-1002:MLB_LATE_ONE_RUN_GAME",
    market_key: "MLB_LATE_ONE_RUN_GAME",
    inning: 7,
    home_score: 1,
    away_score: 0,
    trigger_condition_met: true,
    triggered_at: now.toISOString(),
    source_provider: "mock-mlb",
    payload: { demo: true },
  },
];

export const mockMlbAlerts: MlbAlertRecord[] = [
  {
    id: "mlb-alert-1",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    mlb_live_signal_id: "mlb-live-1",
    alert_type: "MLB_F5_SCORELESS",
    channel: "dashboard",
    title: "MLB signal",
    body: "Yankees vs Blue Jays stayed scoreless through five innings.",
    status: "sent",
    fingerprint: "demo-mlb-user:mlb-1001:MLB_F5_SCORELESS",
    delivered_at: now.toISOString(),
    payload: { demo: true },
  },
];

export const mockMlbOddsSnapshots: MlbOddsSnapshotRecord[] = [
  {
    id: "mlb-odds-1",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    game_id: "mlb-game-1",
    signal_key: "mlb-1001:MLB_F5_SCORELESS",
    market_key: "MLB_F5_SCORELESS",
    bookmaker: "FanDuel",
    decimal_odds: 1.96,
    suspended: false,
    captured_at: now.toISOString(),
    source: "mock-mlb",
    payload: { demo: true },
  },
];

export const mockMlbSyncLogs: MlbProviderSyncLogRecord[] = [
  {
    id: "mlb-log-1",
    created_at: now.toISOString(),
    user_id: "demo-mlb-user",
    provider: "mock-mlb",
    sync_type: "fixture_sync",
    status: "synced",
    records_processed: 2,
    records_created: 4,
    started_at: now.toISOString(),
    finished_at: now.toISOString(),
    message: "Demo MLB sync completed.",
  },
];
