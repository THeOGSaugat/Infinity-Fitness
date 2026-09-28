import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, ClipboardList, Plus, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import {
  getAssignedMember,
  getAssignedMemberAttendance,
  getAssignedMemberMembershipStatus,
} from "@/server/services/trainer-portal.service";
import { listWorkoutPlansForMember } from "@/server/services/workout.service";
import { listProgressForMember } from "@/server/services/progress.service";
import { handlePageError } from "@/lib/service-error";
import { formatMetricValue, metricLabel } from "@/lib/progress-display";
import { ProgressSummary } from "@/components/progress/progress-summary";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";
import { DetailGrid, DetailItem, Section } from "@/components/ui/section";
import { SectionTabs } from "@/components/ui/section-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Member",
};

type Tab = "overview" | "training" | "progress";

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], zoned({ hour: "numeric", minute: "2-digit" }));
}

export default async function TrainerAssignedMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const actor = await requireRole("TRAINER");
  const { id } = await params;
  const query = await searchParams;
  const tab: Tab =
    query.section === "training" ? "training" : query.section === "progress" ? "progress" : "overview";

  const member = await getAssignedMember(actor, id).catch(handlePageError);
  const [attendance, membershipStatus, workoutPlans, progressLogs] = await Promise.all([
    getAssignedMemberAttendance(actor, id),
    getAssignedMemberMembershipStatus(actor, id),
    listWorkoutPlansForMember(actor, id),
    listProgressForMember(actor, id),
  ]);

  const base = `/trainer/members/${id}`;
  const activePlans = workoutPlans.filter((plan) => plan.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/trainer/members"
        backLabel="My members"
        title={member.fullName}
        badge={<StatusBadge kind="account" status={member.status} />}
        description={
          <>
            Member #{member.memberNumber ?? "—"} · Joined{" "}
            {member.joinDate.toLocaleDateString(undefined, zoned())}
          </>
        }
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href={`${base}/workout-plans/new`}>
                <Plus aria-hidden="true" />
                New plan
              </Link>
            }
          />
        }
      />

      <SectionTabs
        items={[
          { label: "Overview", href: base, active: tab === "overview" },
          {
            label: "Training",
            href: `${base}?section=training`,
            active: tab === "training",
            count: workoutPlans.length,
          },
          {
            label: "Progress",
            href: `${base}?section=progress`,
            active: tab === "progress",
            count: progressLogs.length,
          },
        ]}
      />

      {tab === "overview" ? (
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <DetailGrid>
                <DetailItem label="Email">
                  <a href={`mailto:${member.email}`} className="hover:underline">
                    {member.email}
                  </a>
                </DetailItem>
                <DetailItem label="Phone">
                  {member.phone ? (
                    <a href={`tel:${member.phone}`} className="hover:underline">
                      {member.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not on file</span>
                  )}
                </DetailItem>
              </DetailGrid>
            </CardContent>
          </Card>

          <Section title="Membership">
            {membershipStatus.current ? (
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-base font-medium">{membershipStatus.current.planName}</p>
                    <p className="text-[0.8125rem] text-muted-foreground">
                      {membershipStatus.current.startDate.toLocaleDateString(undefined, zoned())} –{" "}
                      {membershipStatus.current.endDate.toLocaleDateString(undefined, zoned())}
                    </p>
                  </div>
                  <StatusBadge kind="membership" status={membershipStatus.current.status} />
                </CardContent>
              </Card>
            ) : (
              <EmptyState compact title="No membership on record" />
            )}
          </Section>

          <Section
            title="Recent visits"
            description={`${attendance.length} recorded`}
          >
            {attendance.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarCheck}
                title="No visits yet"
                description="This member hasn't checked in."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {attendance.slice(0, 8).map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3"
                  >
                    <span className="text-sm font-medium">
                      {record.attendanceDate.toLocaleDateString(undefined, zoned({
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }))}
                    </span>
                    <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
                      {formatTime(record.checkInAt)}
                      {record.checkOutAt ? ` – ${formatTime(record.checkOutAt)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : null}

      {tab === "training" ? (
        <Section
          title="Workout plans"
          description={
            workoutPlans.length > 0
              ? `${activePlans.length} active of ${workoutPlans.length}`
              : undefined
          }
        >
          {workoutPlans.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No workout plans yet"
              description="Build this member's first programme — days, exercises, sets and reps."
              action={
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`${base}/workout-plans/new`}>Create a plan</Link>}
                />
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {workoutPlans.map((plan) => (
                <li key={plan.id}>
                  <ListCard
                    href={`/trainer/workout-plans/${plan.id}`}
                    icon={ClipboardList}
                    title={plan.name}
                    subtitle={
                      plan.endDate
                        ? `${plan.startDate.toLocaleDateString(undefined, zoned())} – ${plan.endDate.toLocaleDateString(undefined, zoned())}`
                        : `Started ${plan.startDate.toLocaleDateString(undefined, zoned())}`
                    }
                    trailing={<StatusBadge kind="plan" status={plan.status} size="sm" />}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      {tab === "progress" ? (
        <Section
          title="Progress"
          description="Logged by the member themselves — you can view it, but only they can record it."
        >
          {progressLogs.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No progress logged"
              description="This member hasn't recorded any measurements yet."
            />
          ) : (
            <div className="flex flex-col gap-4">
            <ProgressSummary logs={progressLogs} />
            <ul className="flex flex-col gap-2">
              {progressLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {metricLabel(log.metric, log.customLabel)}
                    </span>
                    <span className="text-[0.8125rem] text-muted-foreground">
                      {log.recordedAt.toLocaleDateString(undefined, zoned())}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMetricValue(log.metric, log.value)}
                  </span>
                </li>
              ))}
            </ul>
            </div>
          )}
        </Section>
      ) : null}
    </div>
  );
}
