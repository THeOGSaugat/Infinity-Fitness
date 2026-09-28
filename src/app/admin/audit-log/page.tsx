import type { Metadata } from "next";
import Link from "next/link";
import { History, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listAuditLogs } from "@/server/services/audit.service";
import { AUDIT_ACTIONS, AUDIT_ACTION_LABEL, isAuditAction } from "@/lib/audit-display";
import { idSchema } from "@/lib/validations/shared";
import { parsePageParam } from "@/lib/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Audit log",
};

function formatWhen(date: Date) {
  return date.toLocaleString(
    undefined,
    zoned({
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  );
}

/**
 * Read-only by design: there is no edit or delete anywhere in the app for
 * audit entries, and the database rejects UPDATE/DELETE on the table.
 */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; subject?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const action = isAuditAction(params.action) ? params.action : undefined;
  const subjectParse = idSchema.safeParse(params.subject);
  const subjectUserId = subjectParse.success ? subjectParse.data : undefined;
  const page = parsePageParam(params.page);

  const { items, total, totalPages } = await listAuditLogs(actor, {
    action,
    subjectUserId,
    page,
  });

  function buildHref(nextPage: number) {
    const next = new URLSearchParams();
    if (action) next.set("action", action);
    if (subjectUserId) next.set("subject", subjectUserId);
    if (nextPage > 1) next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `/admin/audit-log?${qs}` : "/admin/audit-log";
  }

  const hasFilters = !!(action || subjectUserId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description={`${total} recorded action${total === 1 ? "" : "s"} · append-only, newest first`}
      />

      <form method="GET" className="flex flex-wrap items-end gap-2">
        {subjectUserId ? <input type="hidden" name="subject" value={subjectUserId} /> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="action" className="text-sm font-medium">
            Action
          </label>
          <NativeSelect id="action" name="action" defaultValue={action ?? ""}>
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((value) => (
              <option key={value} value={value}>
                {AUDIT_ACTION_LABEL[value]}
              </option>
            ))}
          </NativeSelect>
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
              render={<Link href="/admin/audit-log">Clear</Link>}
            />
          ) : null}
        </div>
      </form>

      {subjectUserId ? (
        <p className="text-sm text-muted-foreground">Showing actions about one person.</p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={History}
          title={hasFilters ? "No actions match these filters" : "Nothing recorded yet"}
          description={
            hasFilters
              ? "Try a different action type."
              : "Administrative changes — members, trainers, plans, memberships, payments — appear here as they happen."
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card p-4"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {AUDIT_ACTION_LABEL[entry.action]}
                </p>
                <p className="text-sm font-medium">{entry.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {formatWhen(entry.createdAt)} · by {entry.actor.fullName}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4">When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>What happened</TableHead>
                  <TableHead className="px-4">By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="px-4 whitespace-nowrap text-muted-foreground tabular-nums">
                      {formatWhen(entry.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {AUDIT_ACTION_LABEL[entry.action]}
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal">
                      {entry.subjectUserId ? (
                        <Link
                          href={`/admin/audit-log?subject=${entry.subjectUserId}`}
                          className="hover:text-primary hover:underline"
                        >
                          {entry.summary}
                        </Link>
                      ) : (
                        entry.summary
                      )}
                    </TableCell>
                    <TableCell className="px-4 whitespace-nowrap">{entry.actor.fullName}</TableCell>
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
