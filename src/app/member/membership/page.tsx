import type { Metadata } from "next";
import { CircleAlert, ScrollText } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listMembershipsForMember } from "@/server/services/membership.service";
import { isMembershipCurrentlyActive } from "@/lib/membership";
import { formatMinorUnits } from "@/lib/money";
import { daysUntil, getMembershipUrgency } from "@/lib/membership-display";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section, DetailGrid, DetailItem } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "cn";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Membership",
};

export default async function MyMembershipPage() {
  const actor = await requireRole("MEMBER");

  // listMembershipsForMember enforces "self only" itself — this isn't a
  // shortcut around that check, just this page's only valid call shape.
  const memberships = await listMembershipsForMember(actor, actor.id);
  const current = memberships.find((m) => isMembershipCurrentlyActive(m));
  const mostRecent = current ?? memberships[0];
  const daysLeft = current ? daysUntil(current.endDate) : null;

  const urgency = mostRecent
    ? getMembershipUrgency({
        status: mostRecent.status,
        isCurrentlyActive: !!current,
        endDate: mostRecent.endDate,
      })
    : "none";

  // The card above already shows the current/most-recent membership in
  // full detail — repeating that exact row in "History" below would just
  // be the same information twice. History is genuinely past memberships.
  const past = memberships.filter((m) => m.id !== mostRecent?.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Membership"
        description="Your current plan and everything you've held before."
      />

      {mostRecent ? (
        <Card
          className={cn(
            urgency === "expiring" && "border-warning-border bg-warning-subtle",
            urgency === "inactive" && "border-destructive-border bg-destructive-subtle"
          )}
        >
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p
                  className={cn(
                    "text-[0.8125rem] font-medium",
                    urgency === "expiring"
                      ? "text-warning-foreground"
                      : urgency === "inactive"
                        ? "text-destructive-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {current ? "Current plan" : "Most recent plan"}
                </p>
                <p className="text-xl leading-tight font-semibold tracking-[-0.01em]">
                  {mostRecent.planNameSnapshot}
                </p>
              </div>
              <StatusBadge kind="membership" status={mostRecent.status} />
            </div>

            {urgency === "expiring" && daysLeft !== null ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-card/60 px-4 py-3">
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-warning-foreground"
                />
                <p className="text-sm font-medium text-warning-foreground">
                  Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"} — speak to the front
                  desk to renew.
                </p>
              </div>
            ) : urgency === "active" && daysLeft !== null && daysLeft >= 0 ? (
              <div className="flex items-baseline gap-2 rounded-lg bg-muted/60 px-4 py-3">
                <span className="text-2xl leading-none font-semibold tracking-[-0.02em] tabular-nums">
                  {daysLeft}
                </span>
                <span className="text-sm text-muted-foreground">
                  day{daysLeft === 1 ? "" : "s"} remaining
                </span>
              </div>
            ) : null}

            <DetailGrid>
              <DetailItem label="Starts">
                {mostRecent.startDate.toLocaleDateString(undefined, zoned())}
              </DetailItem>
              <DetailItem label="Ends">{mostRecent.endDate.toLocaleDateString(undefined, zoned())}</DetailItem>
              <DetailItem label="Price">
                {formatMinorUnits(mostRecent.priceMinorSnapshot, mostRecent.currencySnapshot)}
              </DetailItem>
            </DetailGrid>

            {urgency === "inactive" ? (
              <p
                className={cn(
                  "text-[0.8125rem] leading-relaxed",
                  "text-destructive-foreground"
                )}
              >
                {mostRecent.status === "EXPIRED"
                  ? "Your membership has expired."
                  : mostRecent.status === "CANCELLED"
                    ? "This membership was cancelled."
                    : "You don't have an active membership right now."}{" "}
                Speak to the front desk to renew — they assign and renew memberships.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="No membership yet"
          description="Ask the front desk to set you up with a plan — it'll show up here straight away."
        />
      )}

      {past.length > 0 ? (
        <Section title="History" description={`${past.length} earlier membership${past.length === 1 ? "" : "s"}`}>
          <ul className="flex flex-col gap-2">
            {past.map((membership) => (
              <li
                key={membership.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {membership.planNameSnapshot}
                  </span>
                  <span className="text-[0.8125rem] text-muted-foreground">
                    {membership.startDate.toLocaleDateString(undefined, zoned())} –{" "}
                    {membership.endDate.toLocaleDateString(undefined, zoned())} ·{" "}
                    {formatMinorUnits(
                      membership.priceMinorSnapshot,
                      membership.currencySnapshot,
                    )}
                  </span>
                </div>
                <StatusBadge kind="membership" status={membership.status} size="sm" />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
