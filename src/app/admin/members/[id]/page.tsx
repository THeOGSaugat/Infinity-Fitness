import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleAlert,
  ClipboardList,
  CreditCard,
  Pencil,
  Plus,
  ScrollText,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getMember } from "@/server/services/member.service";
import { listMembershipsForMember } from "@/server/services/membership.service";
import { listPaymentsForMember } from "@/server/services/payment.service";
import { getAssignmentInfoForMember } from "@/server/services/assignment.service";
import { listTrainers } from "@/server/services/trainer.service";
import { listWorkoutPlansForMember } from "@/server/services/workout.service";
import { listProgressForMember } from "@/server/services/progress.service";
import { isMembershipCurrentlyActive } from "@/lib/membership";
import { daysUntil, getMembershipUrgency } from "@/lib/membership-display";
import { handlePageError } from "@/lib/service-error";
import { toDateInputValue } from "@/lib/date";
import { formatMinorUnits } from "@/lib/money";
import { paymentMethodLabel } from "@/lib/payment-display";
import { formatMetricValue, metricLabel } from "@/lib/progress-display";
import { ProgressSummary } from "@/components/progress/progress-summary";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { DetailGrid, DetailItem, Section } from "@/components/ui/section";
import { SectionTabs } from "@/components/ui/section-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { MemberForm } from "@/components/members/member-form";
import { AssignTrainerForm } from "@/components/trainers/assign-trainer-form";
import { updateMemberAction, setMemberStatusAction } from "../actions";
import { assignTrainerAction, removeAssignmentAction } from "./assignment/actions";
import { cn } from "cn";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Member",
};

type Tab = "overview" | "membership" | "training" | "progress" | "settings";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const actor = await requireRole("ADMIN");
  const { id } = await params;
  const query = await searchParams;
  const tab: Tab = (
    ["overview", "membership", "training", "progress", "settings"] as const
  ).includes(query.section as Tab)
    ? (query.section as Tab)
    : "overview";

  const member = await getMember(actor, id).catch(handlePageError);
  const [memberships, payments, assignmentInfo, activeTrainers, workoutPlans, progressLogs] =
    await Promise.all([
      listMembershipsForMember(actor, member.id),
      listPaymentsForMember(actor, member.id),
      getAssignmentInfoForMember(actor, member.id),
      listTrainers(actor, { status: "ACTIVE" }),
      listWorkoutPlansForMember(actor, member.id),
      listProgressForMember(actor, member.id),
    ]);

  const boundUpdateAction = updateMemberAction.bind(null, member.id);
  const nextStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  const toggleStatusAction = setMemberStatusAction.bind(null, member.id, nextStatus);
  const boundAssignTrainerAction = assignTrainerAction.bind(null, member.id);
  const boundRemoveAssignmentAction = removeAssignmentAction.bind(null, member.id);

  const base = `/admin/members/${member.id}`;
  const currentMembership = memberships.find((m) => isMembershipCurrentlyActive(m));
  const latestMembership = currentMembership ?? memberships[0];
  const totalPaidMinor = payments
    .filter((payment) => payment.status === "SUCCEEDED")
    .reduce((sum, payment) => sum + payment.amountMinor, 0);

  // What an admin should act on for this member, most urgent first. Uses the
  // same urgency rules (and 3-day threshold) as the member's own dashboard.
  const urgency = getMembershipUrgency(
    latestMembership
      ? {
          status: latestMembership.status,
          isCurrentlyActive: !!currentMembership,
          endDate: latestMembership.endDate,
        }
      : null,
  );
  const attention: { text: string; action: string; href: string; tone: "danger" | "warning" }[] = [];
  if (member.status === "SUSPENDED") {
    attention.push({
      text: "This account is deactivated — the member can't sign in.",
      action: "Review",
      href: `${base}?section=settings`,
      tone: "danger",
    });
  }
  if (urgency === "none") {
    attention.push({
      text: "No membership has ever been assigned.",
      action: "Assign membership",
      href: `${base}/memberships/new`,
      tone: "warning",
    });
  } else if (urgency === "inactive") {
    attention.push({
      text: `No active membership — the most recent one is ${latestMembership?.status.toLowerCase()}.`,
      action: "Assign or renew",
      href: `${base}?section=membership`,
      tone: "danger",
    });
  } else if (urgency === "expiring" && latestMembership) {
    const left = daysUntil(latestMembership.endDate);
    attention.push({
      text: `Membership expires in ${left} day${left === 1 ? "" : "s"}.`,
      action: "Renew",
      href: `/admin/members/${member.id}/memberships/${latestMembership.id}`,
      tone: "warning",
    });
  }
  if (!assignmentInfo.current) {
    attention.push({
      text: "No trainer assigned.",
      action: "Assign trainer",
      href: `${base}?section=training`,
      tone: "warning",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref="/admin/members"
        backLabel="Members"
        title={member.fullName}
        badge={<StatusBadge kind="account" status={member.status} />}
        description={
          <>
            Member #{member.memberProfile?.memberNumber ?? "—"} · Joined{" "}
            {(member.memberProfile?.joinDate ?? member.createdAt).toLocaleDateString(undefined, zoned())}
          </>
        }
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`${base}/payments/new`}>
                <Plus aria-hidden="true" />
                Record payment
              </Link>
            }
          />
        }
      />

      <SectionTabs
        items={[
          { label: "Overview", href: base, active: tab === "overview" },
          {
            label: "Membership",
            href: `${base}?section=membership`,
            active: tab === "membership",
            count: memberships.length,
          },
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
          { label: "Settings", href: `${base}?section=settings`, active: tab === "settings" },
        ]}
      />

      {tab === "overview" ? (
        <div className="flex flex-col gap-6">
          {attention.length > 0 ? (
            <ul className="flex flex-col gap-2" aria-label="Needs attention">
              {attention.map((item) => (
                <li
                  key={item.text}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4",
                    item.tone === "danger"
                      ? "border-destructive-border bg-destructive-subtle text-destructive-foreground"
                      : "border-warning-border bg-warning-subtle text-warning-foreground"
                  )}
                >
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">{item.text}</p>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-9 shrink-0 items-center text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {item.action}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Membership</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {latestMembership ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{latestMembership.planNameSnapshot}</p>
                      <StatusBadge
                        kind="membership"
                        status={latestMembership.status}
                        size="sm"
                      />
                    </div>
                    <p className="text-[0.8125rem] text-muted-foreground">
                      {latestMembership.startDate.toLocaleDateString(undefined, zoned())} –{" "}
                      {latestMembership.endDate.toLocaleDateString(undefined, zoned())}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No membership yet.</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  nativeButton={false}
                  render={<Link href={`${base}?section=membership`}>Manage</Link>}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trainer</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {assignmentInfo.current ? (
                  <>
                    <Link
                      href={`/admin/trainers/${assignmentInfo.current.trainerId}`}
                      className="font-medium hover:underline"
                    >
                      {assignmentInfo.current.trainer.fullName}
                    </Link>
                    <p className="text-[0.8125rem] text-muted-foreground">
                      Since {assignmentInfo.current.startDate.toLocaleDateString(undefined, zoned())}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No trainer assigned.</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  nativeButton={false}
                  render={<Link href={`${base}?section=training`}>Manage</Link>}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-2xl leading-none font-semibold tracking-[-0.02em] tabular-nums">
                  {formatMinorUnits(totalPaidMinor)}
                </p>
                <p className="text-[0.8125rem] text-muted-foreground">
                  {payments.length} payment{payments.length === 1 ? "" : "s"} recorded
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  nativeButton={false}
                  render={<Link href={`${base}?section=membership`}>View</Link>}
                />
              </CardContent>
            </Card>
          </div>

          <Section
            title="Contact details"
            actions={
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`${base}?section=settings`}>
                    <Pencil aria-hidden="true" />
                    Edit
                  </Link>
                }
              />
            }
          >
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
                <DetailItem label="Date of birth">
                  {member.memberProfile?.dateOfBirth
                    ? member.memberProfile.dateOfBirth.toLocaleDateString(undefined, zoned())
                    : <span className="text-muted-foreground">Not on file</span>}
                </DetailItem>
                <DetailItem label="Address">
                  {member.memberProfile?.address ?? (
                    <span className="text-muted-foreground">Not on file</span>
                  )}
                </DetailItem>
                <DetailItem label="Emergency contact">
                  {member.memberProfile?.emergencyContactName ? (
                    <>
                      {member.memberProfile.emergencyContactName}
                      {member.memberProfile.emergencyContactPhone
                        ? ` · ${member.memberProfile.emergencyContactPhone}`
                        : ""}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not on file</span>
                  )}
                </DetailItem>
              </DetailGrid>
              </CardContent>
            </Card>
          </Section>
        </div>
      ) : null}

      {tab === "membership" ? (
        <div className="flex flex-col gap-6">
          <Section
            title="Memberships"
            actions={
              <Button
                size="sm"
                nativeButton={false}
                render={
                  <Link href={`${base}/memberships/new`}>
                    <Plus aria-hidden="true" />
                    Assign
                  </Link>
                }
              />
            }
          >
            {memberships.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title="No memberships yet"
                description="Assign a plan so this member can access the gym."
                action={
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`${base}/memberships/new`}>Assign membership</Link>}
                  />
                }
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {memberships.map((membership) => (
                  <li key={membership.id}>
                    <Link
                      href={`${base}/memberships/${membership.id}`}
                      className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-muted/40"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
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
                      </span>
                      <StatusBadge kind="membership" status={membership.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Payments"
            description={`${formatMinorUnits(totalPaidMinor)} received in total`}
            actions={
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={
                  <Link href={`${base}/payments/new`}>
                    <Plus aria-hidden="true" />
                    Record
                  </Link>
                }
              />
            }
          >
            {payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No payments recorded"
                description="Record a payment when this member pays for their membership."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {payments.map((payment) => (
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
      ) : null}

      {tab === "training" ? (
        <div className="flex flex-col gap-6">
          <Section title="Assigned trainer">
            <Card>
              <CardContent className="flex flex-col gap-4">
                {assignmentInfo.current ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-10 items-center justify-center rounded-full bg-primary-subtle text-primary-subtle-foreground"
                      >
                        <UserRound className="size-5" />
                      </span>
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/trainers/${assignmentInfo.current.trainerId}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {assignmentInfo.current.trainer.fullName}
                        </Link>
                        <span className="text-[0.8125rem] text-muted-foreground">
                          Assigned {assignmentInfo.current.startDate.toLocaleDateString(undefined, zoned())}
                        </span>
                      </div>
                    </div>
                    <ConfirmAction
                      action={boundRemoveAssignmentAction}
                      title="Remove this trainer assignment?"
                      description={`${member.fullName} will no longer be assigned to ${assignmentInfo.current.trainer.fullName}.`}
                      consequences={[
                        "The trainer immediately loses access to this member's profile, attendance and progress.",
                        "Existing workout plans are kept, but the trainer can no longer edit them.",
                      ]}
                      reversibility="You can assign a trainer again at any time — the assignment history is preserved."
                      confirmLabel="Remove assignment"
                      triggerLabel="Remove"
                      triggerSize="sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No trainer is currently assigned to this member.
                  </p>
                )}

                {activeTrainers.items.length === 0 ? (
                  <p className="text-[0.8125rem] text-muted-foreground">
                    No active trainers available.{" "}
                    <Link href="/admin/trainers/new" className="font-medium hover:underline">
                      Add one
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="border-t border-border pt-4">
                    <AssignTrainerForm
                      action={boundAssignTrainerAction}
                      trainers={activeTrainers.items.map((t) => ({
                        id: t.id,
                        fullName: t.fullName,
                        specialization: t.trainerProfile?.specialization,
                      }))}
                      currentTrainerId={assignmentInfo.current?.trainerId}
                      submitLabel={assignmentInfo.current ? "Change trainer" : "Assign trainer"}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Section>

          <Section
            title="Workout plans"
            description="Created and managed by this member's assigned trainer — read-only here."
          >
            {workoutPlans.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No workout plans"
                description="Once a trainer is assigned, they can build this member's programme."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {workoutPlans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3"
                  >
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{plan.name}</span>
                      <span className="text-[0.8125rem] text-muted-foreground">
                        {plan.startDate.toLocaleDateString(undefined, zoned())}
                        {plan.endDate ? ` – ${plan.endDate.toLocaleDateString(undefined, zoned())}` : ""}
                      </span>
                    </span>
                    <StatusBadge kind="plan" status={plan.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : null}

      {tab === "progress" ? (
        <Section
          title="Progress"
          description="Self-reported by the member. Admins and their trainer can view it; only the member can record it."
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

      {tab === "settings" ? (
        <div className="flex flex-col gap-6">
          <Section title="Member details">
            <Card>
              <CardContent>
                <MemberForm
                  mode="edit"
                  action={boundUpdateAction}
                  defaultValues={{
                    fullName: member.fullName,
                    email: member.email,
                    phone: member.phone ?? undefined,
                    dateOfBirth: toDateInputValue(member.memberProfile?.dateOfBirth),
                    address: member.memberProfile?.address ?? undefined,
                    emergencyContactName:
                      member.memberProfile?.emergencyContactName ?? undefined,
                    emergencyContactPhone:
                      member.memberProfile?.emergencyContactPhone ?? undefined,
                  }}
                />
              </CardContent>
            </Card>
          </Section>

          <Section title="Danger zone">
            <Card className="border-destructive-border">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {member.status === "ACTIVE" ? "Deactivate account" : "Reactivate account"}
                  </p>
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {member.status === "ACTIVE"
                      ? "Prevents this member from logging in. All of their data is kept."
                      : "Restores this member's ability to log in."}
                  </p>
                </div>

                {member.status === "ACTIVE" ? (
                  <ConfirmAction
                    action={toggleStatusAction}
                    title={`Deactivate ${member.fullName}?`}
                    description="This immediately prevents them from signing in to the member portal."
                    consequences={[
                      "Their memberships, payments, attendance and progress are all kept.",
                      "If they're signed in right now, they're signed out on their next click.",
                    ]}
                    reversibility="Reversible — you can reactivate the account from this page at any time."
                    confirmLabel="Deactivate member"
                    triggerLabel="Deactivate"
                    triggerClassName="w-full sm:w-auto"
                  />
                ) : (
                  <ConfirmAction
                    action={toggleStatusAction}
                    tone="default"
                    title={`Reactivate ${member.fullName}?`}
                    description="They'll be able to sign in to the member portal again."
                    reversibility="Reversible — you can deactivate the account again later."
                    confirmLabel="Reactivate member"
                    triggerLabel="Reactivate"
                    triggerVariant="outline"
                    triggerClassName="w-full sm:w-auto"
                  />
                )}
              </CardContent>
            </Card>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
