import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Account</div>
        <h1 className="text-3xl font-semibold text-white">Profile and access</h1>
      </div>
      <Card>
        <CardHeader>
          <CardDescription>Auth profile</CardDescription>
          <CardTitle>Current member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <div>Email: {email}</div>
          <div>Access model: Supabase Auth email + password</div>
          <div>Role: Member / researcher</div>
        </CardContent>
      </Card>
    </div>
  );
}

