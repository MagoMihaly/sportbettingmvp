import Link from "next/link";
import { cn } from "@/lib/utils";

const hockeyNavItems = [
  { href: "/member/hockey", label: "Dashboard" },
  { href: "/member/signals", label: "Signals" },
  { href: "/member/leagues", label: "Settings" },
  { href: "/member/notifications", label: "Notifications" },
];

export function HockeySectionNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
      {hockeyNavItems.map((item) => {
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
