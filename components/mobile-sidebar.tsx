"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";

type Item = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function MobileSidebar({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="mt-10 space-y-2">
          {items.map(({ href, label, icon: Icon }) => (
            <SheetClose key={href} asChild>
              <Link href={href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            </SheetClose>
          ))}
        </div>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
