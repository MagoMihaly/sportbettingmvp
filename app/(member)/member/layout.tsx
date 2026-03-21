import { redirect } from "next/navigation";
import { MemberSidebar } from "@/components/member-sidebar";
import { PwaBootstrap } from "@/components/pwa-bootstrap";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  if (hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?redirectTo=/member");
    }
  }

  return (
    <main className="min-h-screen bg-transparent lg:flex">
      <PwaBootstrap />
      <MemberSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
    </main>
  );
}
