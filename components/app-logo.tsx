"use client";

export function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-400/30">
        <div className="h-4 w-4 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
      </div>
      <div>
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Signal Ops</div>
        <div className="text-sm text-slate-400">Multi-Sport Signal Platform</div>
      </div>
    </div>
  );
}
