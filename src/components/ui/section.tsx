import { cn } from "cn";

/**
 * Groups related content *without* wrapping it in a card.
 *
 * The old UI made every block on a page a card, which flattened hierarchy —
 * a read-only history table looked exactly as important as the destructive
 * actions below it. A `Section` provides the heading, spacing and optional
 * action of a card without the raised surface, so cards can go back to
 * meaning "this is a distinct, emphasised object."
 */
export function Section({
  title,
  description,
  actions,
  children,
  id,
  className,
  headingLevel: Heading = "h2",
}: {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <section id={id} className={cn("flex flex-col gap-4", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <Heading className="text-lg leading-snug font-bold tracking-[-0.01em]">
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/**
 * A labelled key/value pair, for the "read-only facts about this object"
 * blocks that detail pages are mostly made of.
 */
export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** Responsive grid for `DetailItem`s. */
export function DetailGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4 sm:grid-cols-2", className)}>{children}</dl>
  );
}
