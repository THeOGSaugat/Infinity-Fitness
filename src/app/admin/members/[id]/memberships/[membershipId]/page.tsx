import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getMembership } from "@/server/services/membership.service";
import { handlePageError } from "@/lib/service-error";
import { formatMinorUnits } from "@/lib/money";
import { paymentMethodLabel } from "@/lib/payment-display";
import { PageHeader } from "@/components/ui/page-header";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { DetailGrid, DetailItem, Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { renewMembershipAction, cancelMembershipAction } from "../actions";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Membership",
};

export default async function MembershipDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; membershipId: string }>;
  searchParams: Promise<{ error?: string; cancelled?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id: memberId, membershipId } = await params;
  const query = await searchParams;

  const membership = await getMembership(actor, membershipId).catch(handlePageError);

  const boundRenewAction = renewMembershipAction.bind(null, memberId, membershipId);
  const boundCancelAction = cancelMembershipAction.bind(null, memberId, membershipId);

  const canRenew = membership.status !== "CANCELLED";
  const canCancel = membership.status === "ACTIVE" || membership.status === "PENDING";
  const durationDays = Math.round(
    (membership.endDate.getTime() - membership.startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref={`/admin/members/${memberId}?section=membership`}
        backLabel="Back to member"
        title={membership.planNameSnapshot}
        badge={<StatusBadge kind="membership" status={membership.status} />}
        description={`${membership.startDate.toLocaleDateString(undefined, zoned())} – ${membership.endDate.toLocaleDateString(undefined, zoned())}`}
      />

      {query.error ? <ActionFeedback tone="error">{query.error}</ActionFeedback> : null}
      {query.cancelled ? <ActionFeedback>Membership cancelled.</ActionFeedback> : null}

      <Card className="max-w-2xl">
        <CardContent>
          <DetailGrid>
            <DetailItem label="Start date">
              {membership.startDate.toLocaleDateString(undefined, zoned())}
            </DetailItem>
            <DetailItem label="End date">{membership.endDate.toLocaleDateString(undefined, zoned())}</DetailItem>
            <DetailItem label="Price paid">
              {formatMinorUnits(membership.priceMinorSnapshot, membership.currencySnapshot)}
            </DetailItem>
            <DetailItem label="Duration">{durationDays} days</DetailItem>
            {membership.status === "CANCELLED" ? (
              <DetailItem label="Cancelled" className="sm:col-span-2">
                {membership.cancelledAt?.toLocaleDateString(undefined, zoned())}
                {membership.cancelReason ? ` — ${membership.cancelReason}` : ""}
              </DetailItem>
            ) : null}
          </DetailGrid>
        </CardContent>
      </Card>

      {canRenew || canCancel ? (
        <Section title="Actions">
          <Card className="max-w-2xl">
            <CardContent className="flex flex-col gap-4">
              {canRenew ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    Renewing creates a new membership starting the day after this one ends
                    (or today, if it has already expired), at the plan&apos;s current price.
                  </p>
                  <form action={boundRenewAction}>
                    <Button type="submit" variant="outline" className="w-full sm:w-auto">
                      Renew
                    </Button>
                  </form>
                </div>
              ) : null}

              {canCancel ? (
                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    Cancelling ends this membership immediately.
                  </p>
                  <ConfirmAction
                    action={boundCancelAction}
                    title={`Cancel this ${membership.planNameSnapshot} membership?`}
                    description="The member loses access as soon as this is cancelled."
                    consequences={[
                      "Payments already recorded against this membership are kept.",
                      "No refund is issued automatically — record one separately if needed.",
                    ]}
                    reversibility="This can't be undone. To restore access you'd assign a new membership."
                    confirmLabel="Cancel membership"
                    cancelLabel="Keep membership"
                    triggerLabel="Cancel membership"
                    triggerClassName="w-full sm:w-auto"
                    formFields={
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="reason">Reason (optional)</Label>
                        <Textarea
                          id="reason"
                          name="reason"
                          rows={2}
                          placeholder="e.g. member relocated"
                        />
                      </div>
                    }
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </Section>
      ) : null}

      <Section title="Payments for this membership">
        {membership.payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments recorded"
            description="Record a payment against this membership from the member's page."
            action={
              <Button
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`/admin/members/${memberId}/payments/new`}>Record payment</Link>
                }
              />
            }
          />
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {membership.payments.map((payment) => (
              <li key={payment.id}>
                <Link
                  href={`/admin/payments/${payment.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-muted/40"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMinorUnits(payment.amountMinor, payment.currency)}
                    </span>
                    <span className="text-[0.8125rem] text-muted-foreground">
                      {payment.paidAt.toLocaleDateString(undefined, zoned())} ·{" "}
                      {paymentMethodLabel(payment.method)}
                    </span>
                  </span>
                  <StatusBadge kind="payment" status={payment.status} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
