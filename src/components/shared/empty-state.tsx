import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="relative mb-5">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-primary/5 scale-[1.35] blur-sm" />
          {/* Icon container */}
          <div className="relative flex items-center justify-center w-14 h-14 bg-muted rounded-2xl border border-border/60 shadow-sm">
            <Icon className="h-6 w-6 text-muted-foreground/70" />
          </div>
          {/* Decorative dots */}
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary/20 border border-background" />
          <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-primary/10 border border-background" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
