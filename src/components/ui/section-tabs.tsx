import Link from "next/link";
import { cn } from "cn";

export type SectionTabItem = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

/**
 * Tabs for a detail page's sections, driven by the URL rather than client
 * state.
 *
 * Each tab is a plain `<Link>` carrying a `?section=` query param, so the
 * page stays a Server Component, each section is deep-linkable and
 * shareable, the back button works, and no JavaScript is required to switch
 * sections. On mobile the row scrolls horizontally instead of wrapping,
 * which keeps the page header height predictable.
 */
export function SectionTabs({
  items,
  label = "Sections",
  className,
}: {
  items: SectionTabItem[];
  label?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn("-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0", className)}
    >
      {/* A segmented pill control: the active section is a solid lime pill,
          the rest sit quietly on the track. Scrolls sideways on narrow
          screens rather than wrapping. */}
      <ul className="flex w-max min-w-full items-center gap-1 rounded-full border border-border/80 bg-card p-1 sm:min-w-0">
        {items.map((item) => (
          <li key={item.href} className="flex-1 sm:flex-none">
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
              {typeof item.count === "number" ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums",
                    item.active
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
