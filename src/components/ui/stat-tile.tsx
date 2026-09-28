import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

const TONE = {
  primary: "bg-primary-subtle text-primary",
  orange: "bg-accent-orange-subtle text-accent-orange",
  violet: "bg-accent-violet-subtle text-accent-violet",
} as const;

/**
 * A compact stat: a coloured rounded icon tile, a small label and a bold
 * value — the "Calories / Active Time" rows of the fitness-dashboard look.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONE[tone])}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <span className="truncate text-base leading-tight font-bold tabular-nums">{value}</span>
        {hint ? <span className="truncate text-[0.6875rem] text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}
