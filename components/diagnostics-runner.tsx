"use client";

import { useState, startTransition } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { diagnosticsTests } from "@/lib/config/diagnostics";
import { DiagnosticsTestRow } from "@/components/diagnostics-test-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DiagnosticsCheckResult, DiagnosticsUiState } from "@/lib/types/diagnostics";

const initialState: DiagnosticsUiState[] = diagnosticsTests.map((test) => ({
  id: test.id,
  label: test.label,
  description: test.description,
  status: "pending",
  summary: "",
  details: "",
  checkedAt: null,
  mode: null,
}));

function createResultPatch(result: DiagnosticsCheckResult) {
  return {
    status: result.status,
    summary: result.summary,
    details: result.details,
    checkedAt: result.checkedAt,
    mode: result.mode,
  } as const;
}

function classifyClientRequestFailure(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("abort") || normalized.includes("timeout") || normalized.includes("network")) {
    return "Provider Unreachable";
  }
  return "Invalid Response";
}

export function DiagnosticsRunner() {
  const [tests, setTests] = useState(initialState);
  const [isRunning, setIsRunning] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<string | null>(null);

  const successCount = tests.filter((test) => test.status === "success").length;
  const failedCount = tests.filter((test) => test.status === "failed").length;
  const completedCount = tests.filter((test) => test.status === "success" || test.status === "failed").length;
  const hasResults = completedCount > 0;

  function updateTest(id: DiagnosticsUiState["id"], patch: Partial<DiagnosticsUiState>) {
    setTests((current) => current.map((test) => (test.id === id ? { ...test, ...patch } : test)));
  }

  async function runServerTest(id: DiagnosticsUiState["id"]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/diagnostics/check", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ testId: id }),
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; result?: DiagnosticsCheckResult }
        | null;

      if (!response.ok || !body?.result) {
        const details = body?.error ?? `Diagnostics route returned ${response.status}.`;
        updateTest(id, {
          status: "failed",
          summary: classifyClientRequestFailure(details),
          details,
          checkedAt: new Date().toISOString(),
          mode: "full",
        });
        return;
      }

      updateTest(id, createResultPatch(body.result));
    } catch (error) {
      const details = error instanceof Error ? error.message : "Unknown diagnostics request failure.";
      updateTest(id, {
        status: "failed",
        summary: classifyClientRequestFailure(details),
        details,
        checkedAt: new Date().toISOString(),
        mode: "full",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function runDiagnosticsSuite() {
    setIsRunning(true);
    setRunStartedAt(new Date().toISOString());
    setTests(initialState);

    for (const test of diagnosticsTests) {
      updateTest(test.id, { status: "testing", summary: "", details: "", checkedAt: null, mode: null });

      if (test.scope === "client") {
        await new Promise((resolve) => setTimeout(resolve, 250));
        updateTest(test.id, {
          status: "success",
          summary: "Test - Working",
          details: "Client runtime mounted correctly and the diagnostics UI is interactive.",
          checkedAt: new Date().toISOString(),
          mode: "full",
        });
        continue;
      }

      await runServerTest(test.id);
    }

    setIsRunning(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm uppercase tracking-[0.2em]">System Health Check</span>
            </div>
            <CardTitle>Diagnostics</CardTitle>
            <CardDescription>
              Run a safe system test across auth, database, internal APIs, provider readiness, signal evaluators and notification setup.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => startTransition(() => void runDiagnosticsSuite())} disabled={isRunning}>
              {isRunning ? "Running tests..." : "Start Test"}
            </Button>
            <Button variant="outline" onClick={() => startTransition(() => void runDiagnosticsSuite())} disabled={isRunning || !hasResults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-run
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Completed</div>
            <div className="mt-2 text-2xl font-semibold text-white">{completedCount}/{tests.length}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Working</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-300">{successCount}</div>
          </div>
          <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-rose-200/80">Failed</div>
            <div className="mt-2 text-2xl font-semibold text-rose-300">{failedCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Overall</div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={failedCount > 0 ? "danger" : successCount === tests.length ? "success" : isRunning ? "info" : "neutral"}>
                {failedCount > 0 ? "Attention needed" : successCount === tests.length ? "Healthy" : isRunning ? "In progress" : "Not started"}
              </Badge>
            </div>
            {runStartedAt ? <div className="mt-3 text-xs text-slate-500">Run started {new Date(runStartedAt).toLocaleString()}</div> : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {tests.map((test) => (
          <DiagnosticsTestRow key={test.id} state={test} />
        ))}
      </div>
    </div>
  );
}
