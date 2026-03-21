"use client";

import { MemberSidebar } from "@/components/member-sidebar";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-transparent lg:flex">
      <MemberSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
    </main>
  );
}
