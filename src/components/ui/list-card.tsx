import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "cn";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The mobile counterpart to a table row.
 *
 * Narrow screens get a stack of these instead of a horizontally scrolling
 * table: the same information, but with the identity first, the supporting
 * detail underneath, and the status at the end — reachable with one thumb
 * and with the whole row as a single large tap target, rather than a 14px
 * link inside a cramped cell.
 */
export function ListCard({
  href,
  title,
  subtitle,
  meta,
  trailing,
  icon: Icon,
  avatarName,
  className,
}: {
  href?: string;
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  icon?: LucideIcon;
  /** Renders an initials avatar; pass the person's name. */
  avatarName?: string;
  className?: string;
}) {
  const content = (
    <>
      {avatarName ? (
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[0.8125rem] font-bold text-primary-subtle-foreground"
        >
          {initialsOf(avatarName)}
        </span>
      ) : Icon ? (
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"
        >
          <Icon className="size-5" />
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[0.9375rem] font-semibold text-foreground">{title}</span>
        {subtitle ? (
          <span className="truncate text-[0.8125rem] text-muted-foreground">{subtitle}</span>
        ) : null}
        {meta ? (
          <span className="truncate text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </span>

      {trailing ? <span className="shrink-0">{trailing}</span> : null}
      {href ? (
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground/70"
        />
      ) : null}
    </>
  );

  const classes = cn(
    "flex min-h-[4.5rem] w-full items-center gap-3.5 rounded-2xl border border-border/80 bg-card px-3.5 py-3 text-left transition-colors",
    href && "hover:border-border-strong hover:bg-muted/40",
    className
  );

  if (!href) {
    return <div className={classes}>{content}</div>;
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
