import { DiagnosticsRunner } from "@/components/diagnostics-runner";

export default function DiagnosticsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Diagnostics</div>
        <h1 className="text-3xl font-semibold text-white">System health check</h1>
        <p className="max-w-4xl text-sm leading-7 text-slate-400">
          This module runs safe, low-cost checks across the member platform. It verifies what is actually testable now and clearly marks partial configuration checks instead of pretending everything is fully live.
        </p>
      </div>
      <DiagnosticsRunner />
    </div>
  );
}
