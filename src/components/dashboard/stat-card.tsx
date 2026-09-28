import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "cn";

type Tone = "default" | "brand" | "success" | "warning" | "danger";

const TONE_STYLES: Record<Tone, { icon: string; value: string }> = {
  default: { icon: "bg-muted text-muted-foreground", value: "text-foreground" },
  brand: { icon: "bg-primary-subtle text-primary-subtle-foreground", value: "text-foreground" },
  success: { icon: "bg-success-subtle text-success-foreground", value: "text-foreground" },
  warning: { icon: "bg-warning-subtle text-warning-foreground", value: "text-warning-foreground" },
  danger: {
    icon: "bg-destructive-subtle text-destructive-foreground",
    value: "text-destructive-foreground",
  },
};

/**
 * A single headline number.
 *
 * The value is the loudest thing in the card and the label sits above it in
 * quiet, small type — the reverse of the original, where both competed at
 * the same weight. `tone` is only for numbers that carry a judgement
 * (something expiring, something failing); a neutral count stays neutral, so
 * colour still means something when it does appear.
 */
export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "default",
  href,
  className,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
  className?: string;
}) {
  const styles = TONE_STYLES[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.8125rem] font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              styles.icon
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p
          className={cn(
            "text-[1.75rem] leading-none font-extrabold tracking-[-0.025em] tabular-nums",
            styles.value
          )}
        >
          {value}
        </p>
        {href ? (
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground/70"
          />
        ) : null}
      </div>
      {description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </>
  );

  const classes = cn(
    "flex flex-col rounded-2xl border border-border/80 bg-card p-4",
    href && "transition-colors hover:border-border-strong hover:bg-muted/30",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
}
