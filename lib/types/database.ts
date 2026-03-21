export type SignalStatus = "triggered" | "watching" | "pending" | "won" | "lost";
export type SignalResult = "won" | "lost" | "void" | "pending";
export type IngestStatus = "queued" | "synced" | "error";

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

export type UserSettings = {
  user_id: string;
  selected_leagues: string[];
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  timezone: string;
  preferred_market_type: string;
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
