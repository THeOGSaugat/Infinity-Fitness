import { METRIC_UNIT, metricLabel } from "@/lib/progress-display";
import { MetricDelta, MetricSparkline } from "@/components/progress/metric-trend";
import type { ProgressMetric } from "@/generated/prisma/client";
import { zoned } from "@/lib/time-zone";

type ProgressEntry = {
  id: string;
  metric: ProgressMetric;
  customLabel: string | null;
  value: number;
  recordedAt: Date;
};

/**
 * "Where is this person now, and which way are they heading" — one card per
 * metric showing the latest value, the change since the previous entry, and
 * a short trend line.
 *
 * Shared by the member's own Progress page and the trainer/admin views of a
 * member, so a trainer reviewing a client sees exactly what the client sees.
 * Built only from entries already fetched (newest first); nothing here
 * queries or infers data that isn't in the log.
 */
export function ProgressSummary({
  logs,
  maxMetrics = 4,
}: {
  logs: ProgressEntry[];
  maxMetrics?: number;
}) {
  const byMetric = new Map<string, ProgressEntry[]>();
  for (const log of logs) {
    const key = log.metric === "CUSTOM" ? `CUSTOM:${log.customLabel ?? ""}` : log.metric;
    const existing = byMetric.get(key);
    if (existing) existing.push(log);
    else byMetric.set(key, [log]);
  }

  const groups = [...byMetric.values()].slice(0, maxMetrics);
  if (groups.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
      {groups.map((entries) => {
        const latest = entries[0];
        if (!latest) return null;
        const previous = entries[1];
        // Oldest-to-newest for the sparkline; `entries` is newest-first.
        const trend = entries
          .slice(0, 8)
          .map((entry) => entry.value)
          .reverse();

        return (
          <li
            key={latest.id}
            className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border/80 bg-card p-4"
          >
            <p className="truncate text-[0.8125rem] font-medium text-muted-foreground">
              {metricLabel(latest.metric, latest.customLabel)}
            </p>
            <p className="text-2xl leading-none font-extrabold tracking-[-0.02em] tabular-nums">
              {latest.value}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {METRIC_UNIT[latest.metric]}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {latest.recordedAt.toLocaleDateString(undefined, zoned())}
            </p>
            {previous ? (
              <MetricDelta
                current={latest.value}
                previous={previous.value}
                unit={METRIC_UNIT[latest.metric]}
                className="mt-1"
              />
            ) : null}
            {trend.length >= 2 ? <MetricSparkline values={trend} className="mt-2" /> : null}
          </li>
        );
      })}
    </ul>
  );
}
