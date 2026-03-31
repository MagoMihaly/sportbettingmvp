"use client";

import { CheckCircle2, AlertCircle, LoaderCircle, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DiagnosticsUiState } from "@/lib/types/diagnostics";

function getStatusVariant(status: DiagnosticsUiState["status"]) {
  if (status === "success") return "success";
  if (status === "warning") return "warning";
  if (status === "failed") return "danger";
  if (status === "testing") return "info";
  return "neutral";
}

function getStatusLabel(state: DiagnosticsUiState) {
  if ((state.status === "success" || state.status === "failed") && state.summary) {
    return state.summary;
  }
  if (state.status === "testing") return "Testing";
  return "Pending";
}

function getStatusIcon(status: DiagnosticsUiState["status"]) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === "warning") return <AlertCircle className="h-4 w-4 text-amber-300" />;
  if (status === "failed") return <AlertCircle className="h-4 w-4 text-rose-300" />;
  if (status === "testing") return <LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />;
  return <Clock3 className="h-4 w-4 text-slate-400" />;
}

export function DiagnosticsTestRow({ state }: { state: DiagnosticsUiState }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        state.status === "success" && "border-emerald-500/20 bg-emerald-500/5",
        state.status === "warning" && "border-amber-500/20 bg-amber-500/5",
        state.status === "failed" && "border-rose-500/20 bg-rose-500/5",
        state.status === "testing" && "border-cyan-500/20 bg-cyan-500/5",
        state.status === "pending" && "border-white/10 bg-white/5",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white">
            {getStatusIcon(state.status)}
            <span className="font-medium">{state.label}</span>
          </div>
          <p className="text-sm leading-6 text-slate-400">{state.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusVariant(state.status)}>{getStatusLabel(state)}</Badge>
          {state.mode === "partial" ? <Badge variant="warning">Partial check</Badge> : null}
          {state.mode === "config" ? <Badge variant="info">Configuration OK</Badge> : null}
        </div>
      </div>

      {(state.summary || state.details || state.checkedAt) ? (
        <div className="mt-4 space-y-2 text-sm">
          {state.summary ? <div className="text-slate-200">{state.summary}</div> : null}
          {state.details ? <div className="text-slate-400">{state.details}</div> : null}
          {state.checkedAt ? <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Last check {new Date(state.checkedAt).toLocaleString()}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
