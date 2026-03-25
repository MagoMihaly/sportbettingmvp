export type DiagnosticsTestId =
  | "frontend-app-loaded"
  | "auth-user-session"
  | "database-connection"
  | "api-routes"
  | "external-providers"
  | "signal-engine-communication"
  | "notification-subsystem"
  | "env-config"
  | "scheduler-readiness"
  | "end-to-end-communication";

export type DiagnosticsRunStatus = "pending" | "testing" | "success" | "failed";
export type DiagnosticsCheckMode = "full" | "partial" | "config";
export type DiagnosticsExecutionScope = "client" | "server";

export type DiagnosticsDefinition = {
  id: DiagnosticsTestId;
  label: string;
  description: string;
  scope: DiagnosticsExecutionScope;
};

export type DiagnosticsCheckResult = {
  id: DiagnosticsTestId;
  status: Exclude<DiagnosticsRunStatus, "pending" | "testing">;
  summary: string;
  details: string;
  checkedAt: string;
  mode: DiagnosticsCheckMode;
};

export type DiagnosticsUiState = {
  id: DiagnosticsTestId;
  label: string;
  description: string;
  status: DiagnosticsRunStatus;
  summary: string;
  details: string;
  checkedAt: string | null;
  mode: DiagnosticsCheckMode | null;
};
