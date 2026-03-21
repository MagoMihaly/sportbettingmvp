import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { AppLogo } from "@/components/app-logo";
import { AuthPanel } from "@/components/auth-panel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  if (hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/member");
    }
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-2xl backdrop-blur sm:p-8 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
        <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/5 p-8">
          <div className="space-y-6">
            <AppLogo />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Member Access</div>
              <h1 className="mt-3 text-4xl font-semibold text-white">Secure research workspace for hockey signal tracking.</h1>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-300">
              Sign in to manage signals, review triggered states, adjust league watchlists and prepare the project for live data integrations.
            </p>
          </div>
        </div>
        <AuthPanel redirectTo={params.redirectTo ?? "/member"} />
      </div>
    </main>
  );
}

