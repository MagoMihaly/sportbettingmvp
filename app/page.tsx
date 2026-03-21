import Link from "next/link";
import { ArrowRight, Bell, ChartColumn, ShieldCheck } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { priorityLeagues } from "@/lib/config/leagues";

const features = [
  {
    title: "Period-based trigger tracking",
    description: "Log, monitor and surface 3rd period signal opportunities when selected teams stay scoreless through two periods.",
    icon: ChartColumn,
  },
  {
    title: "Member-ready workflow",
    description: "From protected dashboard to settings and structured signal history, the MVP is ready for operator-grade iteration.",
    icon: ShieldCheck,
  },
  {
    title: "Alert-first architecture",
    description: "Notification preferences, mock trigger flow and service interfaces are already aligned for later live delivery channels.",
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
              <Link href="/login">Get Access</Link>
            </Button>
          </div>
        </header>

        <div className="grid flex-1 gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              European hockey betting signal engine
            </div>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Track, log and alert on 3rd period hockey signals with a clean research workflow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                European Hockey Signal Engine gives you a focused member area for tracking leagues, logging signals and surfacing scoreless-period trigger opportunities without pretending to be a sportsbook.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  Login / Get Access
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
                  <CardDescription>Focus</CardDescription>
                  <CardTitle>European leagues</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">Seeded around sharp, trackable hockey competitions.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Workflow</CardDescription>
                  <CardTitle>Signals + alerts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">Manual and mock-driven today, API-ready tomorrow.</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardDescription>Architecture</CardDescription>
                  <CardTitle>Supabase-backed</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">Auth, RLS and scalable data structure for later expansion.</CardContent>
              </Card>
            </div>
          </div>

          <Card className="overflow-hidden border-cyan-400/10 bg-slate-950/90">
            <CardHeader>
              <CardDescription>Signal preview</CardDescription>
              <CardTitle>Live research console feel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Triggered signal</span>
                  <span>3rd period window</span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold text-white">Tappara vs Ilves</div>
                    <div className="mt-2 text-sm text-slate-400">Finnish Liiga • Selected team: Tappara</div>
                  </div>
                  <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-sm text-cyan-300">P1 0 | P2 0</div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {priorityLeagues.slice(0, 6).map((league) => (
                  <div key={league} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    {league}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
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
            <CardDescription>Supported workflow</CardDescription>
            <CardTitle>Built for research, tracking and later automation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-4">
            {[
              "Select priority leagues and notification preferences.",
              "Log or ingest signal candidates with period scoring context.",
              "Mark eligible 3rd period triggers automatically when P1 and P2 stay scoreless.",
              "Review dashboard stats, latest signals and triggered states in the member area.",
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


