import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listTrainers } from "@/server/services/trainer.service";
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

export const metadata: Metadata = {
  title: "Trainers",
};

function isUserStatus(value: string | undefined): value is UserStatus {
  return value === "ACTIVE" || value === "SUSPENDED";
}

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const status = isUserStatus(params.status) ? params.status : undefined;
  const page = parsePageParam(params.page);

  const { items, total, totalPages } = await listTrainers(actor, { search, status, page });

  function buildHref(nextPage: number) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (status) next.set("status", status);
    if (nextPage > 1) next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `/admin/trainers?${qs}` : "/admin/trainers";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trainers"
        description={`${total} trainer${total === 1 ? "" : "s"}`}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/admin/trainers/new">
                <UserPlus aria-hidden="true" />
                Add trainer
              </Link>
            }
          />
        }
      />

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
              render={<Link href="/admin/trainers">Clear</Link>}
            />
          ) : null}
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={search || status ? "No trainers match your search" : "No trainers yet"}
          description={
            search || status
              ? "Try a different name, email or status filter."
              : "Add a trainer so members can be assigned to them."
          }
          action={
            search || status ? (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/trainers">Clear filters</Link>}
              />
            ) : (
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/admin/trainers/new">Add trainer</Link>}
              />
            )
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((trainer) => (
              <li key={trainer.id}>
                <ListCard
                  href={`/admin/trainers/${trainer.id}`}
                  avatarName={trainer.fullName}
                  title={trainer.fullName}
                  subtitle={trainer.email}
                  meta={trainer.trainerProfile?.specialization ?? undefined}
                  trailing={<StatusBadge kind="account" status={trainer.status} size="sm" />}
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
                  <TableHead>Specialization</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((trainer) => (
                  <TableRow key={trainer.id}>
                    <TableCell className="px-4 font-medium">
                      <Link
                        href={`/admin/trainers/${trainer.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {trainer.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{trainer.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {trainer.trainerProfile?.specialization ?? "—"}
                    </TableCell>
                    <TableCell className="px-4">
                      <StatusBadge kind="account" status={trainer.status} size="sm" />
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
