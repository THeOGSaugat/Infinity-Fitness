import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listMembers } from "@/server/services/member.service";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListCard } from "@/components/ui/list-card";
import { NativeSelect } from "@/components/ui/native-select";
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
import type { UserStatus } from "@/generated/prisma/client";
import { parsePageParam } from "@/lib/pagination";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Members",
};

function isUserStatus(value: string | undefined): value is UserStatus {
  return value === "ACTIVE" || value === "SUSPENDED";
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const status = isUserStatus(params.status) ? params.status : undefined;
  const page = parsePageParam(params.page);

  const { items, total, totalPages } = await listMembers(actor, { search, status, page });

  // Preserves the other filters/search when switching page.
  function buildHref(nextPage: number) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (status) next.set("status", status);
    if (nextPage > 1) next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `/admin/members?${qs}` : "/admin/members";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Members"
        description={`${total} member${total === 1 ? "" : "s"}`}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/members/new">
                <UserPlus aria-hidden="true" />
                Add member
              </Link>
            }
          />
        }
      />

      {/* Zero-JS GET form — no client component, works without JavaScript. */}
      <form method="GET" className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="q" className="text-sm font-medium">
            Search
          </label>
          <Input id="q" name="q" placeholder="Name or email" defaultValue={search ?? ""} />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-44">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <NativeSelect id="status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </NativeSelect>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="outline">
            <Search aria-hidden="true" />
            Apply
          </Button>
          {search || status ? (
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link href="/admin/members">Clear</Link>}
            />
          ) : null}
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || status ? "No members match your search" : "No members yet"}
          description={
            search || status
              ? "Try a different name, email or status filter."
              : "Add the gym's first member to get started."
          }
          action={
            search || status ? (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/members">Clear filters</Link>}
              />
            ) : (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/admin/members/new">Add member</Link>}
              />
            )
          }
        />
      ) : (
        <>
          {/* Phones get tappable cards; the table returns at md, where there
              is room for five columns without squeezing. */}
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((member) => (
              <li key={member.id}>
                <ListCard
                  href={`/admin/members/${member.id}`}
                  avatarName={member.fullName}
                  title={member.fullName}
                  subtitle={member.email}
                  meta={`Joined ${(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString(undefined, zoned())}`}
                  trailing={<StatusBadge kind="account" status={member.status} size="sm" />}
                />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-4">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="px-4 font-medium">
                      <Link
                        href={`/admin/members/${member.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {member.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.phone ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge kind="account" status={member.status} size="sm" />
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">
                      {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString(undefined, zoned())}
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
