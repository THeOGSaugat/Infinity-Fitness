import { cn } from "cn";

/**
 * A circular progress ring — a lime arc on a dark track with rounded caps,
 * with whatever you pass as children centered inside.
 *
 * Pure SVG in a server component: no chart library and no client JS. The
 * ring is `role="img"` with a text label, since the arc alone carries no
 * meaning for a screen reader.
 */
export function ProgressRing({
  value,
  label,
  size = 112,
  strokeWidth = 10,
  tone = "primary",
  children,
  className,
}: {
  /** 0–1; values outside are clamped. */
  value: number;
  /** What the ring means, for assistive tech, e.g. "3 of 7 days active". */
  label: string;
  size?: number;
  strokeWidth?: number;
  tone?: "primary" | "orange" | "violet";
  children?: React.ReactNode;
  className?: string;
}) {
  const clamped = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // A sliver of arc even at 0% reads as "empty ring", not "broken ring".
  const offset = circumference * (1 - clamped);

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {clamped > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              tone === "primary" && "stroke-primary",
              tone === "orange" && "stroke-accent-orange",
              tone === "violet" && "stroke-accent-violet",
            )}
          />
        ) : null}
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
