import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

/**
 * The dashed-border empty state the app already used, kept as-is in spirit
 * (human wording, quiet presentation, no illustration) but given an icon,
 * a real heading, and room for the one action that resolves it.
 *
 * `title` says what isn't there; `description` says why or what to do next;
 * `action` is optional and should only be passed when the viewer actually
 * has permission to fix the emptiness themselves.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong bg-card/50 px-6 text-center",
        compact ? "py-8" : "py-14",
        className
      )}
    >
      {Icon ? (
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-[0.8125rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
