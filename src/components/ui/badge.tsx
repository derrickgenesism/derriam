import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "muted" | "outline";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
        variant === "default" && "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
        variant === "accent" && "bg-[var(--color-accent)] text-[#0E0E10] font-semibold",
        variant === "muted" && "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-muted)]",
        variant === "outline" && "border border-[var(--color-border)] text-[var(--color-text-secondary)]",
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
