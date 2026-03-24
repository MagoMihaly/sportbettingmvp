"use client";

import { useActionState } from "react";
import { signInAction, signUpAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {
  error: "",
  success: "",
};

export function AuthPanel({ redirectTo }: { redirectTo: string }) {
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, initialState);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, initialState);

  return (
    <div className="grid gap-6 pt-8 lg:pt-0">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Email and password access to the protected member workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInFormAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <div className="space-y-2">
              <Label htmlFor="sign-in-email">Email</Label>
              <Input id="sign-in-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sign-in-password">Password</Label>
              <Input id="sign-in-password" name="password" type="password" required placeholder="Enter your password" />
            </div>
            {signInState.error ? <p className="text-sm text-rose-300">{signInState.error}</p> : null}
            <Button className="w-full" disabled={signInPending}>Sign in</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Use Supabase Auth email-password signup for initial member onboarding.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUpFormAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sign-up-email">Email</Label>
              <Input id="sign-up-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sign-up-password">Password</Label>
              <Input id="sign-up-password" name="password" type="password" required placeholder="At least 8 characters" minLength={8} />
            </div>
            {signUpState.error ? <p className="text-sm text-rose-300">{signUpState.error}</p> : null}
            {signUpState.success ? <p className="text-sm text-emerald-300">{signUpState.success}</p> : null}
            <Button className="w-full" variant="outline" disabled={signUpPending}>Create account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
