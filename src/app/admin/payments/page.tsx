import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listPayments } from "@/server/services/payment.service";
import { formatMinorUnits } from "@/lib/money";
import { paymentMethodLabel } from "@/lib/payment-display";
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
import { paymentMethodValues, paymentStatusValues } from "@/lib/validations/payment";
import type { PaymentMethod, PaymentStatus } from "@/generated/prisma/client";
import { parsePageParam } from "@/lib/pagination";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Payments",
};

function isPaymentMethod(value: string | undefined): value is PaymentMethod {
  return !!value && (paymentMethodValues as readonly string[]).includes(value);
}

function isPaymentStatus(value: string | undefined): value is PaymentStatus {
  return !!value && (paymentStatusValues as readonly string[]).includes(value);
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; method?: string; status?: string; page?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const method = isPaymentMethod(params.method) ? params.method : undefined;
  const status = isPaymentStatus(params.status) ? params.status : undefined;
  const page = parsePageParam(params.page);

  const { items, total, totalPages } = await listPayments(actor, {
    search,
    method,
    status,
    page,
  });

  function buildHref(nextPage: number) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (method) next.set("method", method);
    if (status) next.set("status", status);
    if (nextPage > 1) next.set("page", String(nextPage));
    const qs = next.toString();
    return qs ? `/admin/payments?${qs}` : "/admin/payments";
  }

  const hasFilters = !!(search || method || status);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        description={`${total} payment${total === 1 ? "" : "s"} recorded`}
      />

      <form method="GET" className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="q" className="text-sm font-medium">
            Member
          </label>
          <Input id="q" name="q" placeholder="Name or email" defaultValue={search ?? ""} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 sm:w-40 sm:flex-none">
          <label htmlFor="method" className="text-sm font-medium">
            Method
          </label>
          <NativeSelect id="method" name="method" defaultValue={method ?? ""}>
            <option value="">All methods</option>
            {paymentMethodValues.map((value) => (
              <option key={value} value={value}>
                {paymentMethodLabel(value)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 sm:w-40 sm:flex-none">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <NativeSelect id="status" name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {paymentStatusValues.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
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
              render={<Link href="/admin/payments">Clear</Link>}
            />
          ) : null}
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={hasFilters ? "No payments match these filters" : "No payments recorded yet"}
          description={
            hasFilters
              ? "Try a different member, method or status."
              : "Payments are recorded from a member's page when they pay."
          }
          action={
            hasFilters ? (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/payments">Clear filters</Link>}
              />
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((payment) => (
              <li key={payment.id}>
                <ListCard
                  href={`/admin/payments/${payment.id}`}
                  icon={CreditCard}
                  title={formatMinorUnits(payment.amountMinor, payment.currency)}
                  subtitle={payment.member.fullName}
                  meta={`${payment.paidAt.toLocaleDateString(undefined, zoned())} · ${paymentMethodLabel(payment.method)}`}
                  trailing={<StatusBadge kind="payment" status={payment.status} size="sm" />}
                />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="px-4">
                      <Link
                        href={`/admin/payments/${payment.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {payment.paidAt.toLocaleDateString(undefined, zoned())}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/members/${payment.memberId}`}
                        className="text-muted-foreground hover:text-primary hover:underline"
                      >
                        {payment.member.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatMinorUnits(payment.amountMinor, payment.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paymentMethodLabel(payment.method)}
                    </TableCell>
                    <TableCell className="px-4">
                      <StatusBadge kind="payment" status={payment.status} size="sm" />
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
