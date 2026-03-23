import Link from "next/link";
import { cn } from "@/lib/utils";

const soccerNavItems = [
  { href: "/member/soccer", label: "Dashboard" },
  { href: "/member/soccer/signals", label: "Signals" },
  { href: "/member/soccer/settings", label: "Settings" },
];

export function SoccerSectionNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
      {soccerNavItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm transition",
              active ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}