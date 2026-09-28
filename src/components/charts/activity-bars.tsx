import { cn } from "cn";
import { formatMinutes } from "@/lib/activity-display";

type Day = { date: Date; visits: number; minutes: number; isToday: boolean };

/**
 * One bar per day for the last week of gym visits — the "Workout
 * frequency" chart. Bar height is minutes at the gym (or visits, when no
 * session has a check-out yet), and any day with a visit always gets a
 * visible lime bar — even one whose session was never checked out and so
 * has no measured time. Today's bar is solid lime with its value in a
 * bubble, earlier days a softer lime, days with no visit a muted stub.
 *
 * Pure CSS/SVG-free markup, no chart library. The visual bars are
 * aria-hidden; a visually hidden list carries the same numbers for screen
 * readers.
 */
export function ActivityBars({ days, className }: { days: Day[]; className?: string }) {
  const useMinutes = days.some((day) => day.minutes > 0);
  const valueOf = (day: Day) => (useMinutes ? day.minutes : day.visits);
  const max = Math.max(1, ...days.map(valueOf));

  // Day names are those of the UTC calendar day each bar represents — the
  // same day boundary attendance itself uses.
  const dayName = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

  return (
    <div className={className}>
      <ul className="sr-only">
        {days.map((day) => (
          <li key={day.date.toISOString()}>
            {dayName(day.date)}
            {day.isToday ? " (today)" : ""}: {day.visits} visit{day.visits === 1 ? "" : "s"}
            {day.minutes > 0 ? `, ${formatMinutes(day.minutes)}` : ""}
          </li>
        ))}
      </ul>

      <div aria-hidden="true" className="flex h-36 items-end justify-between gap-2 pt-7">
        {days.map((day) => {
          const value = valueOf(day);
          const visited = day.visits > 0;
          const height = value > 0 ? Math.max(14, Math.round((value / max) * 100)) : visited ? 14 : 6;
          return (
            <div key={day.date.toISOString()} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex h-full w-full max-w-[1.375rem] items-end">
                {day.isToday && visited ? (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-primary px-1.5 py-0.5 text-[0.625rem] font-bold whitespace-nowrap text-primary-foreground tabular-nums">
                    {useMinutes && day.minutes > 0 ? formatMinutes(day.minutes, true) : `${day.visits}×`}
                  </span>
                ) : null}
                <div
                  className={cn(
                    "w-full rounded-full transition-all",
                    !visited ? "bg-muted" : day.isToday ? "bg-primary" : "bg-primary/55",
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[0.6875rem] font-medium",
                  day.isToday ? "text-primary" : "text-muted-foreground",
                )}
              >
                {dayName(day.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
