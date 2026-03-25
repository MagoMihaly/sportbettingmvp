export type SignalStatus = "triggered" | "watching" | "pending" | "won" | "lost";
export type SignalResult = "won" | "lost" | "void" | "pending";
export type IngestStatus = "queued" | "synced" | "error";
export type AlertStatus = "pending" | "queued" | "sent" | "failed" | "read";
export type PushSubscriptionStatus = "active" | "revoked";

export type ProfileRecord = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type LeagueRecord = {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  sport: string;
  is_active: boolean;
  priority: number;
  created_at: string;
};

export type UserLeagueRecord = {
  user_id: string;
  league_id: string;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  selected_leagues: string[];
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  timezone: string;
  preferred_market_type: string;
  created_at?: string;
  updated_at?: string;
};

export type SignalRecord = {
  id: string;
  created_at: string;
  user_id: string;
  sport: string;
  league: string;
  match_id: string | null;
  home_team: string;
  away_team: string;
  match_start_time: string;
  selected_team: string;
  selected_team_side: "home" | "away";
  period1_goals: number;
  period2_goals: number;
  trigger_condition_met: boolean;
  trigger_time: string | null;
  odds: number | null;
  bookmaker: string | null;
  stake: number | null;
  status: SignalStatus;
  result: SignalResult;
  notes: string | null;
};

export type GameRecord = {
  id: string;
  created_at: string;
  provider: string;
  external_game_id: string;
  league_id: string | null;
  league_name: string;
  status: "scheduled" | "live" | "finished";
  start_time: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  period1_home_goals: number;
  period1_away_goals: number;
  period2_home_goals: number;
  period2_away_goals: number;
  raw_payload: Record<string, unknown> | null;
  last_synced_at: string;
};

export type PregameCandidateRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  market_type: string;
  rule_type: string;
  status: string;
  notes: string | null;
};

export type LiveSignalRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  rule_type: string;
  signal_key: string;
  selected_team: string;
  selected_team_side: "home" | "away";
  period1_goals: number;
  period2_goals: number;
  trigger_condition_met: boolean;
  triggered_at: string | null;
  source_provider: string;
  payload: Record<string, unknown> | null;
};

export type AlertRecord = {
  id: string;
  created_at: string;
  user_id: string;
  live_signal_id: string | null;
  alert_type: string;
  channel: string;
  title: string;
  body: string;
  status: AlertStatus;
  fingerprint: string;
  delivered_at: string | null;
  payload: Record<string, unknown> | null;
};

export type PushSubscriptionRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  expiration_time: string | null;
  status: PushSubscriptionStatus;
  user_agent: string | null;
  last_seen_at: string;
};

export type ProviderSyncLogRecord = {
  id: string;
  created_at: string;
  user_id: string | null;
  provider: string;
  sync_type: string;
  status: IngestStatus;
  records_processed: number;
  records_created: number;
  started_at: string;
  finished_at: string | null;
  message: string | null;
};

export type TrackedMatchRecord = {
  id: string;
  created_at: string;
  user_id: string;
  external_match_id: string;
  league: string;
  home_team: string;
  away_team: string;
  match_start_time: string;
  home_score: number;
  away_score: number;
  period1_home_goals: number;
  period1_away_goals: number;
  period2_home_goals: number;
  period2_away_goals: number;
  source: string;
  ingest_status: IngestStatus;
  last_synced_at: string;
  raw_payload: Record<string, unknown> | null;
};

export type OddsSnapshotRecord = {
  id: string;
  created_at: string;
  user_id: string;
  tracked_match_id: string;
  market_type: string;
  bookmaker: string;
  decimal_odds: number;
  captured_at: string;
  source: string;
};

export type IngestRunRecord = {
  id: string;
  created_at: string;
  user_id: string;
  provider: string;
  run_type: string;
  status: IngestStatus;
  records_created: number;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
};

export type SoccerUserSettings = {
  user_id: string;
  selected_leagues: string[];
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  timezone: string;
  preferred_market_key: string;
  created_at?: string;
  updated_at?: string;
};

export type SoccerUserLeagueRecord = {
  user_id: string;
  league_id: string;
  created_at: string;
};

export type SoccerGameRecord = {
  id: string;
  created_at: string;
  provider: string;
  external_game_id: string;
  league_id: string | null;
  league_name: string;
  status: "scheduled" | "live" | "finished";
  start_time: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  halftime_home_score: number | null;
  halftime_away_score: number | null;
  minute: number | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_corners: number | null;
  away_corners: number | null;
  home_possession: number | null;
  away_possession: number | null;
  raw_payload: Record<string, unknown> | null;
  last_synced_at: string;
};

export type SoccerWatchlistRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  market_key: string;
  rule_type: string;
  status: string;
  notes: string | null;
};

export type SoccerMatchStateSnapshotRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  captured_at: string;
  minute: number | null;
  home_score: number;
  away_score: number;
  halftime_home_score: number | null;
  halftime_away_score: number | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_corners: number | null;
  away_corners: number | null;
  payload: Record<string, unknown> | null;
};

export type SoccerOddsSnapshotRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  signal_key: string | null;
  market_key: string;
  bookmaker: string;
  decimal_odds: number;
  suspended: boolean;
  captured_at: string;
  source: string;
  payload: Record<string, unknown> | null;
};

export type SoccerLiveSignalRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  rule_type: string;
  signal_key: string;
  market_key: string;
  home_score: number;
  away_score: number;
  minute: number | null;
  trigger_condition_met: boolean;
  triggered_at: string | null;
  source_provider: string;
  payload: Record<string, unknown> | null;
};

export type SoccerAlertRecord = {
  id: string;
  created_at: string;
  user_id: string;
  soccer_live_signal_id: string | null;
  alert_type: string;
  channel: string;
  title: string;
  body: string;
  status: AlertStatus;
  fingerprint: string;
  delivered_at: string | null;
  payload: Record<string, unknown> | null;
};

export type SoccerProviderSyncLogRecord = {
  id: string;
  created_at: string;
  user_id: string | null;
  provider: string;
  sync_type: string;
  status: IngestStatus;
  records_processed: number;
  records_created: number;
  started_at: string;
  finished_at: string | null;
  message: string | null;
};

export type SoccerDataQualityFlagRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  flag_code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  payload: Record<string, unknown> | null;
};

export type MlbUserSettings = {
  user_id: string;
  selected_systems: string[];
  selected_pregame_strategies?: string[];
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  timezone: string;
  preferred_market_key: string;
  created_at?: string;
  updated_at?: string;
};

export type MlbGameRecord = {
  id: string;
  created_at: string;
  provider: string;
  external_game_id: string;
  league_name: string;
  status: "scheduled" | "live" | "finished";
  start_time: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  inning: number | null;
  half_inning: "top" | "bottom" | null;
  home_hits: number | null;
  away_hits: number | null;
  home_errors: number | null;
  away_errors: number | null;
  raw_payload: Record<string, unknown> | null;
  last_synced_at: string;
};

export type MlbWatchlistRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  market_key: string;
  rule_type: string;
  status: string;
  notes: string | null;
};

export type MlbStateSnapshotRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  captured_at: string;
  inning: number | null;
  half_inning: "top" | "bottom" | null;
  home_score: number;
  away_score: number;
  home_hits: number | null;
  away_hits: number | null;
  payload: Record<string, unknown> | null;
};

export type MlbOddsSnapshotRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  signal_key: string | null;
  market_key: string;
  bookmaker: string;
  decimal_odds: number;
  suspended: boolean;
  captured_at: string;
  source: string;
  payload: Record<string, unknown> | null;
};

export type MlbLiveSignalRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  rule_type: string;
  signal_key: string;
  market_key: string;
  inning: number | null;
  home_score: number;
  away_score: number;
  trigger_condition_met: boolean;
  triggered_at: string | null;
  source_provider: string;
  payload: Record<string, unknown> | null;
};

export type MlbPregameSignalRecord = {
  id: string;
  created_at: string;
  user_id: string;
  game_id: string;
  strategy_id: string;
  signal_key: string;
  series_key: string;
  series_game_number: 2 | 3;
  signal_team: string;
  signal_team_side: "home" | "away";
  signal_direction: "favorite" | "underdog";
  market_type: string;
  evaluation_status: "candidate" | "qualified" | "skipped";
  odds: number | null;
  reason_summary: string;
  skip_reason: string | null;
  source_provider: string;
  evaluated_at: string;
  payload: Record<string, unknown> | null;
};

export type MlbAlertRecord = {
  id: string;
  created_at: string;
  user_id: string;
  mlb_live_signal_id: string | null;
  mlb_pregame_signal_id?: string | null;
  alert_type: string;
  channel: string;
  title: string;
  body: string;
  status: AlertStatus;
  fingerprint: string;
  delivered_at: string | null;
  payload: Record<string, unknown> | null;
};

export type MlbProviderSyncLogRecord = {
  id: string;
  created_at: string;
  user_id: string | null;
  provider: string;
  sync_type: string;
  status: IngestStatus;
  records_processed: number;
  records_created: number;
  started_at: string;
  finished_at: string | null;
  message: string | null;
};
