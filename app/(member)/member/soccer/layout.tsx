import { redirect } from "next/navigation";
import { isSoccerModuleEnabled } from "@/lib/supabase/env";

export default async function SoccerMemberLayout({ children }: { children: React.ReactNode }) {
  if (!isSoccerModuleEnabled()) {
    redirect("/member");
  }

  return <div className="space-y-6">{children}</div>;
}