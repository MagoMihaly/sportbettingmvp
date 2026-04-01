import type {
  SoccerAlertRecord,
  SoccerDataQualityFlagRecord,
  SoccerGameRecord,
  SoccerLiveSignalRecord,
  SoccerMatchStateSnapshotRecord,
  SoccerOddsSnapshotRecord,
  SoccerProviderSyncLogRecord,
  SoccerUserSettings,
  SoccerWatchlistRecord,
} from "@/lib/types/database";

const now = new Date();

export const mockSoccerSettings: SoccerUserSettings = {
  user_id: "demo-soccer-user",
  selected_leagues: ["england-premier-league", "germany-bundesliga", "italy-serie-a"],
  notifications_enabled: true,
  email_notifications: false,
  push_notifications: true,
  timezone: "Europe/Budapest",
  preferred_market_key: "H2_2H_OVER_1_5",
};

export const mockSoccerGames: SoccerGameRecord[] = [
  {
    id: "soccer-game-1",
    created_at: now.toISOString(),
    provider: "mock-soccer",
    external_game_id: "fixture-1001",
    league_id: null,
    league_name: "England Premier League",
    status: "live",
    start_time: new Date(now.getTime() - 70 * 60 * 1000).toISOString(),
    home_team: "Arsenal",
    away_team: "Brighton",
    home_score: 0,
    away_score: 0,
    halftime_home_score: 0,
    halftime_away_score: 0,
    minute: 63,
    home_shots: 12,
    away_shots: 6,
    home_shots_on_target: 4,
    away_shots_on_target: 1,
    home_corners: 7,
    away_corners: 2,
    home_possession: 63,
    away_possession: 37,
    raw_payload: { demo: true },
    last_synced_at: now.toISOString(),
  },
];

export const mockSoccerWatchlists: SoccerWatchlistRecord[] = [
  {
    id: "soccer-watch-1",
    created_at: now.toISOString(),
    user_id: "demo-soccer-user",
    game_id: "soccer-game-1",
    market_key: "H3_REMAINING_OVER_0_5",
    rule_type: "SOCCER_MINUTE_60_0_0_OVER_0_5",
    status: "watching",
    notes: "Demo H3 watchlist row",
  },
];

export const mockSoccerStateSnapshots: SoccerMatchStateSnapshotRecord[] = [
  {
    id: "soccer-snap-1",
    created_at: now.toISOString(),
    user_id: "demo-soccer-user",
    game_id: "soccer-game-1",
    captured_at: now.toISOString(),
    minute: 63,
    home_score: 0,
    away_score: 0,
    halftime_home_score: 0,
    halftime_away_score: 0,
    home_shots: 12,
    away_shots: 6,
    home_shots_on_target: 4,
    away_shots_on_target: 1,
    home_corners: 7,
    away_corners: 2,
    payload: { demo: true },
  },
];

export const mockSoccerLiveSignals: SoccerLiveSignalRecord[] = [
  {
    id: "soccer-live-signal-1",
    created_at: now.toISOString(),
    user_id: "demo-soccer-user",
    game_id: "soccer-game-1",
    rule_type: "SOCCER_MINUTE_60_0_0_OVER_0_5",
    signal_key: "fixture-1001:H3_REMAINING_OVER_0_5",
    market_key: "H3_REMAINING_OVER_0_5",
    home_score: 0,
    away_score: 0,
    minute: 63,
    trigger_condition_met: true,
    triggered_at: now.toISOString(),
    source_provider: "mock-soccer",
    payload: { demo: true },
  },
];

export const mockSoccerAlerts: SoccerAlertRecord[] = [
  {
    id: "soccer-alert-1",
    created_at: now.toISOString(),
    user_id: "demo-soccer-user",
    soccer_live_signal_id: "soccer-live-signal-1",
    alert_type: "SOCCER_MINUTE_60_0_0_OVER_0_5",
    channel: "dashboard",
    title: "Soccer live alert",
    body: "Arsenal vs Brighton hit the 60' 0-0 trigger state.",
    status: "sent",
    fingerprint: "demo-soccer-user:fixture-1001:H3",
    delivered_at: now.toISOString(),
    payload: { demo: true },
  },
];

export const mockSoccerOddsSnapshots: SoccerOddsSnapshotRecord[] = [
  {
    id: "soccer-odds-1",
    created_at: now.toISOString(),
    user_id: "demo-soccer-user",
    game_id: "soccer-game-1",
    signal_key: "fixture-1001:H3_REMAINING_OVER_0_5",
    market_key: "H3_REMAINING_OVER_0_5",
    bookmaker: "Bet365",
    decimal_odds: 1.74,
    suspended: false,
    captured_at: now.toISOString(),
    source: "mock-soccer",
    payload: { demo: true },
  },
];

export const mockSoccerSyncLogs: SoccerProviderSyncLogRecord[] = [
  {
    id: "soccer-log-1",
    created_at: now.toISOString(),
    user_id: "demo-soccer-user",
    provider: "mock-soccer",
    sync_type: "fixture_sync",
    status: "synced",
    records_processed: 1,
    records_created: 3,
    started_at: now.toISOString(),
    finished_at: now.toISOString(),
    message: "Demo soccer sync completed.",
  },
];

export const mockSoccerDataQualityFlags: SoccerDataQualityFlagRecord[] = [
  {
    id: "soccer-flag-1",
    created_at: now.toISOString(),
    user_id: "demo-soccer-user",
    game_id: "soccer-game-1",
    flag_code: "MISSING_LIVE_ODDS",
    severity: "warning",
    message: "The active soccer provider is not supplying a live odds layer for this demo setup.",
    payload: { demo: true },
  },
];
