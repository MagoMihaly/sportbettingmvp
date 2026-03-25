import Link from "next/link";
import { ArrowRight, Bell, ChartColumn, ShieldCheck, Waves } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supportedSports } from "@/lib/config/sports";

const features = [
  {
    title: "Multi-sport by design",
    description: "Each sport keeps its own rule logic, while alerts, auth and scheduling stay consistent across the platform.",
    icon: Waves,
  },
  {
    title: "API-efficient workflow",
    description: "Fixtures sync first, watchlists narrow the field, and only trigger-zone games get more expensive live attention.",
    icon: ChartColumn,
  },
  {
    title: "Protected member ops",
    description: "Supabase-backed auth, sport-specific settings and scheduler-safe endpoints are already wired for reliable iteration.",
    icon: ShieldCheck,
  },
  {
    title: "Alert-ready architecture",
    description: "Dashboard, push subscription flow and per-sport alert records are aligned for later delivery expansion.",
    icon: Bell,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-4">
          <AppLogo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get access</Link>
            </Button>
          </div>
        </header>

        <div className="grid flex-1 gap-12 py-16 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              Multi-sport signal platform for hockey, soccer and MLB
            </div>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                One member workspace for multi-sport signal tracking and alert delivery.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Signal Ops is an MVP research platform that keeps hockey, soccer and MLB in separate sport modules while sharing auth, scheduling, alerts and operator workflows.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  Open member area
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#workflow">See workflow</a>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardDescription>Sports</CardDescription>
                  <CardTitle>3 active modules</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">Hockey, Soccer and MLB are visible as first-class workspaces.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Polling</CardDescription>
                  <CardTitle>Watchlist-first</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">Only selected sports, leagues and trigger-zone games deserve costly live polling.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Architecture</CardDescription>
                  <CardTitle>Supabase-backed</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">Auth, storage, scheduler endpoints and alerts stay additive and deployment-safe.</CardContent>
              </Card>
            </div>
          </div>

          <Card className="overflow-hidden border-cyan-400/10 bg-slate-950/90">
            <CardHeader>
              <CardDescription>Supported sports</CardDescription>
              <CardTitle>Separate rules, shared platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {supportedSports.map((sport) => (
                <div key={sport.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className={`text-xl font-semibold ${sport.accentClass}`}>{sport.label}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{sport.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
        <Card>
          <CardHeader>
            <CardDescription>How it works</CardDescription>
            <CardTitle>Stable MVP workflow before full automation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-5">
            {[
              "Select the sports and sport-specific systems you want to track.",
              "Sync fixtures into a watchlist so only relevant games keep moving through the pipeline.",
              "Poll live state more aggressively only inside the trigger zone for the chosen sport.",
              "Persist live signals, odds snapshots and alert logs in a shared platform layer.",
              "Review the reason a signal fired from the member area instead of guessing from raw API data.",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-cyan-300">0{index + 1}</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
