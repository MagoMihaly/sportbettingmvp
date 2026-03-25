import type { DiagnosticsDefinition } from "@/lib/types/diagnostics";

export const diagnosticsTests: DiagnosticsDefinition[] = [
  {
    id: "frontend-app-loaded",
    label: "Frontend app loaded",
    description: "Confirms the client runtime mounted correctly and the diagnostics view is interactive.",
    scope: "client",
  },
  {
    id: "auth-user-session",
    label: "Auth / user session",
    description: "Validates that the protected member session can be resolved server-side.",
    scope: "server",
  },
  {
    id: "database-connection",
    label: "Database connection",
    description: "Runs a safe read against Supabase to verify database reachability and row-level access.",
    scope: "server",
  },
  {
    id: "api-routes",
    label: "API routes",
    description: "Checks that lightweight internal routes answer and protected routes enforce their guard.",
    scope: "server",
  },
  {
    id: "external-providers",
    label: "External APIs / providers",
    description: "Performs minimal provider reachability checks without triggering heavy ingest work.",
    scope: "server",
  },
  {
    id: "signal-engine-communication",
    label: "Signal engine communication",
    description: "Verifies that sport-specific evaluators still produce trigger candidates from sample states.",
    scope: "server",
  },
  {
    id: "notification-subsystem",
    label: "Notification / push pipeline",
    description: "Checks alert channel preparation and push configuration readiness without sending live alerts.",
    scope: "server",
  },
  {
    id: "env-config",
    label: "Environment variables / config",
    description: "Confirms critical configuration exists while keeping secrets hidden.",
    scope: "server",
  },
  {
    id: "scheduler-readiness",
    label: "Scheduler / polling readiness",
    description: "Validates scheduler auth configuration and protected execution expectations.",
    scope: "server",
  },
  {
    id: "end-to-end-communication",
    label: "End-to-end system communication",
    description: "Checks the basic frontend to API to service chain with a safe system-level validation.",
    scope: "server",
  },
];

export const serverDiagnosticsTests = diagnosticsTests.filter((test) => test.scope === "server");
