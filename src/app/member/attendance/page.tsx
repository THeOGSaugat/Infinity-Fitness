import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityBars } from "@/components/charts/activity-bars";
import { formatMinutes } from "@/lib/activity-display";
import { requireRole } from "@/lib/auth/session";
import {
  getRecentActivity,
  getTodayStatus,
  listAttendanceForMember,
} from "@/server/services/attendance.service";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckInPanel } from "@/components/attendance/check-in-panel";
import { checkInAction, checkOutAction } from "./actions";
import { parsePageParam } from "@/lib/pagination";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Attendance",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], zoned({ hour: "numeric", minute: "2-digit" }));
}

export default async function MyAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const actor = await requireRole("MEMBER");
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const [{ openSession, todaysRecords }, history, activity] = await Promise.all([
    getTodayStatus(actor, actor.id),
    listAttendanceForMember(actor, actor.id, page),
    getRecentActivity(actor, actor.id, 7),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Check in when you arrive and out when you leave."
      />

      <CheckInPanel
        isCheckedIn={!!openSession}
        checkedInSince={openSession ? formatTime(openSession.checkInAt) : undefined}
        checkInAction={checkInAction}
        checkOutAction={checkOutAction}
      />

      <Card>
        <CardHeader className="grid-cols-[1fr_auto]">
          <CardTitle>This week</CardTitle>
          <span className="col-start-2 row-start-1 text-[0.8125rem] font-semibold text-primary tabular-nums">
            {activity.totalVisits} visit{activity.totalVisits === 1 ? "" : "s"} · {formatMinutes(activity.totalMinutes)}
          </span>
        </CardHeader>
        <CardContent>
          <ActivityBars days={activity.days} />
        </CardContent>
      </Card>

      {todaysRecords.length > 0 ? (
        <Section title="Today" description={`${todaysRecords.length} visit${todaysRecords.length === 1 ? "" : "s"}`}>
          <ul className="flex flex-col gap-2">
            {todaysRecords.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3"
              >
                <span className="text-sm font-medium tabular-nums">
                  {formatTime(record.checkInAt)}
                  {record.checkOutAt ? ` – ${formatTime(record.checkOutAt)}` : ""}
                </span>
                <StatusBadge
                  kind="attendance"
                  status={record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN"}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section
        title="History"
        description={history.total > 0 ? `${history.total} visits on record` : undefined}
      >
        {history.items.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No visits yet"
            description="Once you check in for the first time, your history builds up here."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {history.items.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">
                    {record.attendanceDate.toLocaleDateString(undefined, zoned({
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }))}
                  </span>
                  <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
                    {formatTime(record.checkInAt)}
                    {record.checkOutAt ? ` – ${formatTime(record.checkOutAt)}` : " · still checked in"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Pagination
        page={history.page}
        totalPages={history.totalPages}
        buildHref={(p) => (p > 1 ? `/member/attendance?page=${p}` : "/member/attendance")}
      />
    </div>
  );
}
