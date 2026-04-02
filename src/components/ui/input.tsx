import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
