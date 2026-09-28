import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "cn";

/**
 * A native `<details>`/`<summary>` expander.
 *
 * Used to tuck a secondary form (e.g. "Add an exercise") under the list it
 * adds to, so on a phone the list is what you see first and the form only
 * takes space once asked for. Native disclosure needs no JavaScript, is
 * keyboard-operable (Enter/Space on the summary), and announces its
 * expanded/collapsed state to screen readers for free. The summary row is a
 * full 48px touch target.
 */
export function Disclosure({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group/disclosure rounded-2xl border border-border/80 bg-card",
        className
      )}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium select-none hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        {Icon ? <Icon aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
        <span className="flex-1">{title}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform group-open/disclosure:rotate-180"
        />
      </summary>
      <div className="border-t border-border px-4 pt-4 pb-5">{children}</div>
    </details>
  );
}
