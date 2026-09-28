import type { Metadata } from "next";
import { Flame, Timer, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listProgressForMember } from "@/server/services/progress.service";
import { getRecentActivity } from "@/server/services/attendance.service";
import { ActivityBars } from "@/components/charts/activity-bars";
import { StatTile } from "@/components/ui/stat-tile";
import { formatMinutes } from "@/lib/activity-display";
import { METRIC_UNIT, metricLabel } from "@/lib/progress-display";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { ProgressLogForm } from "@/components/progress/progress-log-form";
import { ProgressSummary } from "@/components/progress/progress-summary";
import { recordProgressAction } from "./actions";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Progress",
};

export default async function MyProgressPage() {
  const actor = await requireRole("MEMBER");

  // listProgressForMember enforces "self only" — passing actor.id here
  // isn't a bypassable shortcut, it's this page's only valid call shape.
  const [logs, activity] = await Promise.all([
    listProgressForMember(actor, actor.id),
    getRecentActivity(actor, actor.id, 7),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Progress"
        description="Log your measurements and watch them change over time."
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="grid-cols-[1fr_auto]">
            <CardTitle>Workout frequency</CardTitle>
            <span className="col-start-2 row-start-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Last 7 days
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="text-3xl leading-none font-extrabold tabular-nums">
              {activity.totalVisits}
              <span className="ml-1.5 text-sm font-semibold text-muted-foreground">
                visit{activity.totalVisits === 1 ? "" : "s"}
              </span>
            </p>
            <ActivityBars days={activity.days} className="mt-2" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Card size="sm">
            <CardContent>
              <StatTile
                icon={Timer}
                label="Active time"
                value={formatMinutes(activity.totalMinutes)}
                hint="last 7 days"
              />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <StatTile
                icon={Flame}
                tone="orange"
                label="Active days"
                value={`${activity.activeDays} / ${activity.days.length}`}
                hint="last 7 days"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Section title="Body stats">
        {logs.length > 0 ? (
          <ProgressSummary logs={logs} />
        ) : (
          <EmptyState
            compact
            icon={TrendingUp}
            title="No measurements yet"
            description="Log one below to start tracking change over time."
          />
        )}
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Log an entry</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressLogForm action={recordProgressAction} />
        </CardContent>
      </Card>

      <Section title="History" description={logs.length > 0 ? `${logs.length} entries` : undefined}>
        {logs.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No entries yet"
            description="Log your first measurement above — weight, body fat or a body measurement."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {metricLabel(log.metric, log.customLabel)}
                  </span>
                  <span className="text-[0.8125rem] text-muted-foreground">
                    {log.recordedAt.toLocaleDateString(
                      undefined,
                      zoned({
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                    )}
                  </span>
                  {log.notes ? (
                    <span className="mt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {log.notes}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-base font-semibold tabular-nums">
                  {log.value}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                    {METRIC_UNIT[log.metric]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
