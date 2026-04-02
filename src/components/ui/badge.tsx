import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)]/15 text-[var(--primary)]",
        secondary: "border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)]",
        outline: "border-[var(--border)] text-[var(--muted-foreground)]",
        success: "border-transparent bg-emerald-500/14 text-emerald-300",
        warning: "border-transparent bg-amber-500/14 text-amber-300",
        destructive: "border-transparent bg-rose-500/16 text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
