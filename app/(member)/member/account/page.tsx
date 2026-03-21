import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getDashboardData } from "@/lib/data/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountPage() {
  let email = "demo@ehse.local";

  if (hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? email;
  }

  const { profile, pushSubscriptions, settings, viewer } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Account</div>
        <h1 className="text-3xl font-semibold text-white">Profile and access</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Auth profile</CardDescription>
            <CardTitle>Current member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div>Email: {email}</div>
            <div>Name: {profile?.full_name ?? "Not set yet"}</div>
            <div>Role: {profile?.role ?? "member"}</div>
            <div>Mode: {viewer.isDemo ? "Demo" : "Supabase Auth"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Alert delivery profile</CardDescription>
            <CardTitle>Operational readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div>Timezone: {settings?.timezone ?? "Europe/Budapest"}</div>
            <div>Notifications enabled: {(settings?.notifications_enabled ?? true) ? "Yes" : "No"}</div>
            <div>Push devices: {pushSubscriptions.length}</div>
            <div>Preferred market: {settings?.preferred_market_type ?? "3rd period team goal"}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
