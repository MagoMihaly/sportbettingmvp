import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "border-white/10 bg-white/5 text-slate-300",
      success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      danger: "border-rose-500/30 bg-rose-500/10 text-rose-300"
    }
  },
  defaultVariants: {
    variant: "neutral"
  }
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

