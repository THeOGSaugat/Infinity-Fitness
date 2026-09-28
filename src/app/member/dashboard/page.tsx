import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  CircleAlert,
  Dumbbell,
  Flame,
  ScrollText,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getMemberDashboard } from "@/server/services/dashboard.service";
import { listNotifications } from "@/server/services/notification.service";
import { getRecentActivity, getTodayStatus } from "@/server/services/attendance.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatTile } from "@/components/ui/stat-tile";
import { formatMinutes } from "@/lib/activity-display";
import { PlanHeroCard } from "@/components/workouts/plan-hero-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CheckInPanel } from "@/components/attendance/check-in-panel";
import { METRIC_UNIT, metricLabel } from "@/lib/progress-display";
import { MetricDelta } from "@/components/progress/metric-trend";
import { daysUntil, getMembershipUrgency } from "@/lib/membership-display";
import { checkInAction, checkOutAction } from "../attendance/actions";
import { cn } from "cn";
import { hourInAppTimeZone, zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Home",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], zoned({ hour: "numeric", minute: "2-digit" }));
}

const QUICK_ACTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/member/workout-plans", label: "Workouts", icon: Dumbbell },
  { href: "/member/progress", label: "Progress", icon: TrendingUp },
  { href: "/member/attendance", label: "Visits", icon: CalendarCheck },
  { href: "/member/membership", label: "Membership", icon: ScrollText },
];

function greeting(): string {
  const hour = hourInAppTimeZone();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function MemberDashboardPage() {
  const actor = await requireRole("MEMBER");

  const [data, unreadNotifications, todayStatus, activity] = await Promise.all([
    getMemberDashboard(actor),
    listNotifications(actor, { unreadOnly: true }),
    getTodayStatus(actor, actor.id),
    getRecentActivity(actor, actor.id, 7),
  ]);

  const firstName = (actor.name ?? "").split(" ")[0] ?? "";
  const membership = data.membershipStatus;
  const daysLeft = membership ? daysUntil(membership.endDate) : null;
  const urgency = getMembershipUrgency(
    membership
      ? { status: membership.status, isCurrentlyActive: membership.isCurrentlyActive, endDate: membership.endDate }
      : null,
  );
  const needsAttention = urgency === "none" || urgency === "expiring" || urgency === "inactive";

  const latestProgress = data.recentProgress[0];
  // The next *same-metric* entry within the already-fetched recent list —
  // not just recentProgress[1], since that could be a different metric
  // logged in between. If it's not in this small window, no delta shows;
  // that's a smaller ask on the dashboard than the full-history trend on
  // the Progress page itself.
  const previousProgress = latestProgress
    ? data.recentProgress
        .slice(1)
        .find(
          (entry) =>
            entry.metric === latestProgress.metric &&
            (entry.metric !== "CUSTOM" || entry.customLabel === latestProgress.customLabel),
        )
    : undefined;
  const recentNotifications = unreadNotifications.slice(0, 3);

  const plan = data.currentWorkoutPlan;
  const weeklyShare = activity.activeDays / activity.days.length;

  // Share of the membership still remaining, for its ring (from the same
  // daysLeft figure shown beside it).
  const membershipDays = membership
    ? Math.max(1, Math.round((membership.endDate.getTime() - membership.startDate.getTime()) / 86_400_000))
    : 1;
  const membershipRemaining = daysLeft !== null ? Math.min(Math.max(daysLeft / membershipDays, 0), 1) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-muted-foreground">
          {greeting()}
          {firstName ? `, ${firstName}` : ""} <span aria-hidden="true">👋</span>
          <span className="sr-only">
            {" — "}
            {new Date().toLocaleDateString(undefined, zoned({ weekday: "long", day: "numeric", month: "long" }))}
          </span>
        </p>
        <h1 className="text-[2rem] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance sm:text-[2.25rem]">
          Ready to crush <br className="sm:hidden" />
          your goals?
        </h1>
      </div>

      {/* The primary action, above the fold, on every visit. */}
      <CheckInPanel
        isCheckedIn={!!todayStatus.openSession}
        checkedInSince={
          todayStatus.openSession ? formatTime(todayStatus.openSession.checkInAt) : undefined
        }
        checkInAction={checkInAction}
        checkOutAction={checkOutAction}
      />

      {/* Membership only shouts when it needs something from the member. */}
      {needsAttention ? (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
            urgency === "expiring"
              ? "border-warning-border bg-warning-subtle"
              : "border-destructive-border bg-destructive-subtle"
          )}
        >
          <div className="flex items-start gap-3">
            <CircleAlert
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-5 shrink-0",
                urgency === "expiring" ? "text-warning-foreground" : "text-destructive-foreground"
              )}
            />
            <div className="flex flex-col gap-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  urgency === "expiring" ? "text-warning-foreground" : "text-destructive-foreground"
                )}
              >
                {membership === null
                  ? "No membership yet"
                  : urgency === "expiring"
                    ? `Membership expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                    : membership.status === "EXPIRED"
                      ? "Membership has expired"
                      : "Membership not active"}
              </p>
              <p
                className={cn(
                  "text-[0.8125rem] leading-relaxed",
                  urgency === "expiring"
                    ? "text-warning-foreground/90"
                    : "text-destructive-foreground/90"
                )}
              >
                {membership === null
                  ? "Ask the front desk to set you up with a plan."
                  : urgency === "expiring"
                    ? `Your ${membership.planName} plan ends on ${membership.endDate.toLocaleDateString(undefined, zoned())}. Speak to the front desk to renew.`
                    : "Speak to the front desk to renew and keep access to the gym."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0 sm:w-auto"
            nativeButton={false}
            render={<Link href="/member/membership">View membership</Link>}
          />
        </div>
      ) : null}

      {/*
        Main content (today's workout, recent activity) gets the wider
        column; membership/progress/notifications are secondary — useful,
        but not what a member opened the app to do. Below `lg` this is
        just a single stacked column, same order top-to-bottom as before.
      */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="grid-cols-[1fr_auto]">
              <CardTitle>Weekly progress</CardTitle>
              <Link
                href="/member/progress"
                className="col-start-2 row-start-1 inline-flex min-h-8 items-center gap-0.5 text-[0.8125rem] font-semibold text-primary hover:underline"
              >
                Details
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="flex items-center gap-5 sm:gap-8">
              <ProgressRing
                value={weeklyShare}
                size={116}
                strokeWidth={11}
                label={`Active on ${activity.activeDays} of the last ${activity.days.length} days`}
              >
                <span className="text-[1.625rem] leading-none font-extrabold tabular-nums">
                  {Math.round(weeklyShare * 100)}
                  <span className="text-sm font-bold">%</span>
                </span>
                <span className="mt-1 text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
                  {activity.activeDays}/{activity.days.length} days
                </span>
              </ProgressRing>
              <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-8">
                <StatTile
                  icon={Flame}
                  tone="orange"
                  label="Gym visits"
                  value={activity.totalVisits}
                  hint="last 7 days"
                />
                <StatTile
                  icon={Timer}
                  label="Active time"
                  value={formatMinutes(activity.totalMinutes)}
                  hint="at the gym"
                />
              </div>
            </CardContent>
          </Card>

          <Section
            title="Today's workout"
            actions={
              <Link
                href="/member/workout-plans"
                className="inline-flex min-h-8 items-center text-[0.8125rem] font-semibold text-primary hover:underline"
              >
                See all
              </Link>
            }
          >
            {plan ? (
              <PlanHeroCard plan={plan} href={`/member/workout-plans/${plan.id}`} />
            ) : (
              <EmptyState
                compact
                icon={Dumbbell}
                title="No workout plan yet"
                description="Your trainer will assign one — it'll show up here."
              />
            )}
          </Section>

          {/* Phone-only shortcut tiles; on laptops the sidebar covers these. */}
          <Section title="Quick actions" className="lg:hidden">
            <ul className="grid grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="flex flex-col items-center gap-2 rounded-2xl text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="flex aspect-square w-full max-w-16 items-center justify-center rounded-2xl border border-border/80 bg-card text-primary"
                    >
                      <action.icon className="size-6" />
                    </span>
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="Recent activity"
            actions={
              <Link
                href="/member/attendance"
                className="inline-flex min-h-8 items-center text-[0.8125rem] font-semibold text-primary hover:underline"
              >
                All visits
              </Link>
            }
          >
            {data.recentAttendance.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarCheck}
                title="No visits yet"
                description="Check in when you arrive and your visits will appear here."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {data.recentAttendance.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium">
                        {record.attendanceDate.toLocaleDateString(undefined, zoned({
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }))}
                      </span>
                      <span className="text-[0.8125rem] text-muted-foreground">
                        {formatTime(record.checkInAt)}
                        {record.checkOutAt ? ` – ${formatTime(record.checkOutAt)}` : ""}
                      </span>
                    </div>
                    <StatusBadge
                      kind="attendance"
                      status={record.checkOutAt ? "CHECKED_OUT" : "CHECKED_IN"}
                      size="sm"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Membership</CardTitle>
            </CardHeader>
            <CardContent>
              {membership ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    {membership.isCurrentlyActive && daysLeft !== null && daysLeft >= 0 ? (
                      <ProgressRing
                        value={membershipRemaining}
                        size={64}
                        strokeWidth={7}
                        label={`${daysLeft} day${daysLeft === 1 ? "" : "s"} left on this membership`}
                      >
                        <span className="text-base leading-none font-extrabold tabular-nums">{daysLeft}</span>
                        <span className="text-[0.5625rem] font-medium text-muted-foreground">days</span>
                      </ProgressRing>
                    ) : null}
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <p className="text-base font-bold">{membership.planName}</p>
                      <StatusBadge kind="membership" status={membership.status} size="sm" />
                    </div>
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {membership.isCurrentlyActive && daysLeft !== null && daysLeft >= 0
                      ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · renews ${membership.endDate.toLocaleDateString(undefined, zoned())}`
                      : `Valid ${membership.startDate.toLocaleDateString(undefined, zoned())} – ${membership.endDate.toLocaleDateString(undefined, zoned())}`}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-fit"
                    nativeButton={false}
                    render={<Link href="/member/membership">View details</Link>}
                  />
                </div>
              ) : (
                <EmptyState
                  compact
                  title="No membership on record"
                  description="The front desk can assign you a plan."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {latestProgress ? (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl leading-none font-semibold tracking-[-0.02em] tabular-nums">
                        {latestProgress.value}
                      </span>
                      <span className="pb-0.5 text-sm text-muted-foreground">
                        {METRIC_UNIT[latestProgress.metric] ?? ""}
                      </span>
                    </div>
                    {previousProgress ? (
                      <MetricDelta
                        current={latestProgress.value}
                        previous={previousProgress.value}
                        unit={METRIC_UNIT[latestProgress.metric]}
                      />
                    ) : null}
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground">
                    {metricLabel(latestProgress.metric, latestProgress.customLabel)} · logged{" "}
                    {latestProgress.recordedAt.toLocaleDateString(undefined, zoned())}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-fit"
                    nativeButton={false}
                    render={<Link href="/member/progress">Log progress</Link>}
                  />
                </>
              ) : (
                <EmptyState
                  compact
                  icon={TrendingUp}
                  title="Nothing logged yet"
                  description="Track your weight or measurements to see change over time."
                  action={
                    <Button
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/member/progress">Log progress</Link>}
                    />
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotifications.length === 0 ? (
                <EmptyState compact icon={Bell} title="You're all caught up" />
              ) : (
                <ul className="flex flex-col gap-3">
                  {recentNotifications.map((notification) => (
                    <li key={notification.id} className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {notification.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/member/notifications"
                className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all notifications
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
