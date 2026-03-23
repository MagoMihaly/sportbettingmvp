"use client";

import { Activity, Bell, ChartColumn, Home, Settings2, Trophy, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { SignOutButton } from "@/components/sign-out-button";

export function MemberSidebar({ soccerEnabled = false }: { soccerEnabled?: boolean }) {
  const navItems = [
    { href: "/member", label: "Dashboard", icon: Home },
    { href: "/member/signals", label: "Signals", icon: ChartColumn },
    { href: "/member/engine", label: "Engine", icon: Activity },
    ...(soccerEnabled ? [{ href: "/member/soccer", label: "Soccer", icon: Trophy }] : []),
    { href: "/member/leagues", label: "Leagues", icon: Settings2 },
    { href: "/member/notifications", label: "Notifications", icon: Bell },
    { href: "/member/account", label: "Account", icon: UserCircle2 },
  ];

  return (
    <>
      <aside className="hidden w-72 flex-col border-r border-white/10 bg-slate-950/90 p-6 lg:flex">
        <AppLogo />
        <nav className="mt-10 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <SignOutButton />
        </div>
      </aside>
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 p-4 lg:hidden">
        <AppLogo />
        <MobileSidebar items={navItems} />
      </div>
    </>
  );
}