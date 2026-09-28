import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listPaymentsForMember } from "@/server/services/payment.service";
import { formatMinorUnits } from "@/lib/money";
import { paymentMethodLabel } from "@/lib/payment-display";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function MyPaymentsPage() {
  const actor = await requireRole("MEMBER");

  // listPaymentsForMember enforces "self only" — a member can never load
  // another member's history through this page, even if the function
  // signature is later reused elsewhere.
  const payments = await listPaymentsForMember(actor, actor.id);

  const totalPaidMinor = payments
    .filter((payment) => payment.status === "SUCCEEDED")
    .reduce((sum, payment) => sum + payment.amountMinor, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        description="Everything the gym has recorded against your account."
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments on record"
          description="Payments are recorded by the front desk when you pay for a membership."
        />
      ) : (
        <>
          <div className="rounded-2xl border border-border/80 bg-card p-4">
            <p className="text-[0.8125rem] font-medium text-muted-foreground">Total paid</p>
            <p className="mt-1 text-2xl leading-none font-semibold tracking-[-0.02em] tabular-nums">
              {formatMinorUnits(totalPaidMinor)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Across {payments.length} recorded payment{payments.length === 1 ? "" : "s"}
            </p>
          </div>

          <ul className="flex flex-col gap-2">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMinorUnits(payment.amountMinor, payment.currency)}
                  </span>
                  <span className="text-[0.8125rem] text-muted-foreground">
                    {payment.paidAt.toLocaleDateString(
                      undefined,
                      zoned({
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }),
                    )}{" "}
                    · {paymentMethodLabel(payment.method)}
                  </span>
                </div>
                <StatusBadge kind="payment" status={payment.status} size="sm" />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
