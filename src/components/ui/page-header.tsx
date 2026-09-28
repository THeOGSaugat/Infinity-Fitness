import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";

/**
 * Every page in the app opens with one of these, which is what makes the
 * type hierarchy consistent: the page title is the only 24–28px text on
 * screen, section titles below it are 18px, and card titles are 16px. The
 * optional `backHref` replaces the ad-hoc "← Back to X" ghost buttons that
 * were scattered across detail pages at inconsistent positions.
 */
export function PageHeader({
  title,
  description,
  actions,
  badge,
  backHref,
  backLabel = "Back",
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="tap-target -ml-1 inline-flex w-fit items-center gap-1.5 rounded-md px-1 py-1 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.025em] text-balance">
              {title}
            </h1>
            {badge}
          </div>
          {description ? (
            <div className="text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
