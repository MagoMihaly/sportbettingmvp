"use client";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button className="w-full" variant="outline">Logout</Button>
    </form>
  );
}
