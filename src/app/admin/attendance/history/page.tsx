import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listAttendanceHistory } from "@/server/services/attendance.service";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/ui/list-card";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parsePageParam } from "@/lib/pagination";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Attendance history",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], zoned({ hour: "numeric", minute: "2-digit" }));
}

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const dateFrom = params.from ? new Date(params.from) : undefined;
  const dateTo = params.to ? new Date(params.to) : undefined;
  const page = parsePageParam(params.page);

  const { items, total, totalPages } = await listAttendanceHistory(actor, {
    search,
    dateFrom,
    dateTo,
    page,
  });

  function buildHref(nextPage: number) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (params.from) next.set("from", params.from);
    if (params.to) next.set("to", params.to);
    if (nextPage > 1) next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `/admin/attendance/history?${qs}` : "/admin/attendance/history";
  }

  const hasFilters = !!(search || params.from || params.to);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/admin/attendance"
        backLabel="Today"
        title="Attendance history"
        description={`${total} record${total === 1 ? "" : "s"}`}
      />

      <form method="GET" className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="q" className="text-sm font-medium">
            Member
          </label>
          <Input id="q" name="q" placeholder="Name or email" defaultValue={search ?? ""} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-40">
          <label htmlFor="from" className="text-sm font-medium">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={params.from ?? ""} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-40">
          <label htmlFor="to" className="text-sm font-medium">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={params.to ?? ""} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            <Search aria-hidden="true" />
            Apply
          </Button>
          {hasFilters ? (
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/admin/attendance/history">Clear</Link>}
            />
          ) : null}
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={hasFilters ? "No records match these filters" : "No attendance recorded yet"}
          description={
            hasFilters
              ? "Try widening the date range or clearing the member search."
              : "Check-ins appear here as soon as members start using the gym."
          }
          action={
            hasFilters ? (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/attendance/history">Clear filters</Link>}
              />
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((record) => (
              <li key={record.id}>
                <ListCard
                  href={`/admin/members/${record.memberId}`}
                  avatarName={record.member.fullName}
                  title={record.member.fullName}
                  subtitle={record.attendanceDate.toLocaleDateString(undefined, zoned())}
                  meta={
                    record.checkOutAt
                      ? `${formatTime(record.checkInAt)} – ${formatTime(record.checkOutAt)}`
                      : `In since ${formatTime(record.checkInAt)}`
                  }
                  trailing={
                    <StatusBadge
                      kind="attendance"
                      status={record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN"}
                      size="sm"
                    />
                  }
                />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4">Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check in</TableHead>
                  <TableHead>Check out</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="px-4 font-medium">
                      <Link
                        href={`/admin/members/${record.memberId}`}
                        className="hover:text-primary hover:underline"
                      >
                        {record.member.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.attendanceDate.toLocaleDateString(undefined, zoned())}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatTime(record.checkInAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {record.checkOutAt ? formatTime(record.checkOutAt) : "—"}
                    </TableCell>
                    <TableCell className="px-4">
                      <StatusBadge
                        kind="attendance"
                        status={record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN"}
                        size="sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}
