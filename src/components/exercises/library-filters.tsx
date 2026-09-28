import Link from "next/link";
import { Search, X } from "lucide-react";
import { cn } from "cn";

/**
 * Search pill + muscle-group chips for the exercise library.
 *
 * Plain links and a GET form — no client JS. The chips are built from the
 * muscle groups that actually exist in the library, so there's never a
 * filter that can only return nothing. Search and the chosen chip are
 * kept together in the URL, so either can change without losing the other.
 */
export function ExerciseLibraryFilters({
  basePath,
  search,
  muscle,
  muscleGroups,
}: {
  basePath: string;
  search?: string;
  muscle?: string;
  muscleGroups: string[];
}) {
  function hrefFor(next: { q?: string; muscle?: string }) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.muscle) params.set("muscle", next.muscle);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const chips = [{ label: "All", value: undefined as string | undefined }, ...muscleGroups.map((group) => ({ label: group, value: group }))];

  return (
    <div className="flex flex-col gap-3">
      <form method="GET" role="search" className="flex items-center gap-2">
        {muscle ? <input type="hidden" name="muscle" value={muscle} /> : null}
        <label htmlFor="q" className="sr-only">
          Search exercises
        </label>
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Search exercises…"
            defaultValue={search ?? ""}
            className="h-12 w-full rounded-full border border-border/80 bg-card pr-4 pl-11 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25"
          />
        </div>
        <button
          type="submit"
          aria-label="Search"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          <Search aria-hidden="true" className="size-5" />
        </button>
        {search ? (
          <Link
            href={hrefFor({ muscle })}
            aria-label="Clear search"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <X aria-hidden="true" className="size-5" />
          </Link>
        ) : null}
      </form>

      {muscleGroups.length > 0 ? (
        <nav aria-label="Filter by muscle group" className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2">
            {chips.map((chip) => {
              const active = chip.value === muscle;
              return (
                <li key={chip.label}>
                  <Link
                    href={hrefFor({ q: search, muscle: chip.value })}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/80 bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {chip.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

/** Distinct muscle groups in library order-independent, alphabetical. */
export function muscleGroupsOf(exercises: { muscleGroup: string | null }[]): string[] {
  return [...new Set(exercises.map((e) => e.muscleGroup?.trim()).filter((g): g is string => !!g))].sort(
    (a, b) => a.localeCompare(b),
  );
}
