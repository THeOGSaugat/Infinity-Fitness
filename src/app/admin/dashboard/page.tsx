import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CircleAlert,
  CreditCard,
  TrendingUp,
  UserRound,
  UserPlus,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getAdminDashboard } from "@/server/services/dashboard.service";
import { formatMinorUnits } from "@/lib/money";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBarChart } from "@/components/dashboard/status-bar-chart";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const actor = await requireRole("ADMIN");
  const data = await getAdminDashboard(actor);

  const statusItems = [
    { label: "Active", value: data.membershipStatusCounts.ACTIVE, tone: "success" as const },
    { label: "Pending", value: data.membershipStatusCounts.PENDING, tone: "warning" as const },
    { label: "Expired", value: data.membershipStatusCounts.EXPIRED, tone: "danger" as const },
    { label: "Cancelled", value: data.membershipStatusCounts.CANCELLED, tone: "neutral" as const },
    { label: "No membership yet", value: data.membersWithoutMembership, tone: "muted" as const },
  ].filter((item) => item.value > 0);

  const needsAttention = data.expiredMemberships > 0 || data.membersWithoutMembership > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="How the gym is doing right now."
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Active members"
          value={data.activeMembers}
          icon={Users}
          tone="success"
          description={`of ${data.totalMembers} total`}
          href="/admin/members"
        />
        <StatCard
          label="In the gym today"
          value={data.todayAttendanceCount}
          icon={CalendarCheck}
          tone={data.currentlyCheckedInCount > 0 ? "brand" : "default"}
          description={`${data.currentlyCheckedInCount} still checked in`}
          href="/admin/attendance"
        />
        <StatCard
          label="Revenue this month"
          value={formatMinorUnits(data.monthRevenueMinor)}
          icon={CreditCard}
          description={`${formatMinorUnits(data.totalRevenueMinor)} all time`}
          href="/admin/payments"
        />
        <StatCard
          label="Active trainers"
          value={data.activeTrainers}
          icon={UserRound}
          description={`of ${data.totalTrainers} total`}
          href="/admin/trainers"
        />
      </div>

      {needsAttention ? (
        <Section title="Needs attention">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.expiredMemberships > 0 ? (
              <Link
                href="/admin/members"
                className="flex items-start gap-3 rounded-xl border border-destructive-border bg-destructive-subtle p-4 transition-opacity hover:opacity-90"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-destructive-foreground"
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-destructive-foreground">
                    {data.expiredMemberships} expired membership
                    {data.expiredMemberships === 1 ? "" : "s"}
                  </p>
                  <p className="text-[0.8125rem] leading-relaxed text-destructive-foreground/90">
                    These members&apos; most recent membership has lapsed — they may need renewing.
                  </p>
                </div>
              </Link>
            ) : null}

            {data.membersWithoutMembership > 0 ? (
              <Link
                href="/admin/members"
                className="flex items-start gap-3 rounded-xl border border-warning-border bg-warning-subtle p-4 transition-opacity hover:opacity-90"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-warning-foreground"
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-warning-foreground">
                    {data.membersWithoutMembership} member
                    {data.membersWithoutMembership === 1 ? "" : "s"} with no membership
                  </p>
                  <p className="text-[0.8125rem] leading-relaxed text-warning-foreground/90">
                    Accounts exist but no plan has ever been assigned to them.
                  </p>
                </div>
              </Link>
            ) : null}
          </div>
        </Section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membership status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBarChart items={statusItems} />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Each member counted once, by their most recent membership.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentPayments.length === 0 ? (
              <EmptyState
                compact
                icon={CreditCard}
                title="No payments recorded"
                description="Payments recorded against a member will appear here."
              />
            ) : (
              <ul className="flex flex-col gap-1">
                {data.recentPayments.map((payment) => (
                  <li key={payment.id}>
                    <Link
                      href={`/admin/payments/${payment.id}`}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {payment.member.fullName}
                        </span>
                        <span className="text-[0.8125rem] text-muted-foreground">
                          {payment.paidAt.toLocaleDateString(undefined, zoned())}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatMinorUnits(payment.amountMinor, payment.currency)}
                        </span>
                        <StatusBadge kind="payment" status={payment.status} size="sm" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Section
        title="Recently joined"
        actions={
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/members">All members</Link>}
          />
        }
      >
        {data.recentMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Add the gym's first member to get started."
            action={
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/admin/members/new">Add member</Link>}
              />
            }
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.recentMembers.map((member) => (
              <li key={member.id}>
                <Link
                  href={`/admin/members/${member.id}`}
                  className="flex min-h-16 items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-muted/40"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-[0.8125rem] font-semibold text-primary-subtle-foreground"
                  >
                    {member.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{member.fullName}</span>
                    <span className="truncate text-[0.8125rem] text-muted-foreground">
                      Joined{" "}
                      {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString(
                        undefined,
                        zoned(),
                      )}
                    </span>
                  </span>
                  <StatusBadge kind="account" status={member.status} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/members/new">Add member</Link>}
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/trainers/new">Add trainer</Link>}
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/plans/new">New plan</Link>}
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/admin/attendance">
                <TrendingUp aria-hidden="true" />
                Today&apos;s attendance
              </Link>
            }
          />
        </div>
      </Section>
    </div>
  );
}
