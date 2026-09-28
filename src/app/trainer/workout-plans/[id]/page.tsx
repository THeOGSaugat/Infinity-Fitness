import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Plus,
  Repeat,
  Timer,
  Weight,
  X as XIcon,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getWorkoutPlan } from "@/server/services/workout.service";
import { listExercises } from "@/server/services/exercise.service";
import { handlePageError } from "@/lib/service-error";
import { toDateInputValue } from "@/lib/date";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { SectionTabs } from "@/components/ui/section-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { WorkoutPlanForm } from "@/components/workouts/workout-plan-form";
import { AddWorkoutDayForm } from "@/components/workouts/add-workout-day-form";
import { AddWorkoutExerciseForm } from "@/components/workouts/add-workout-exercise-form";
import { cn } from "cn";
import {
  updateWorkoutPlanAction,
  setWorkoutPlanStatusAction,
  addWorkoutDayAction,
  removeWorkoutDayAction,
  addWorkoutExerciseAction,
  removeWorkoutExerciseAction,
} from "./actions";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Workout plan",
};

type Section = "days" | "settings";

export default async function TrainerWorkoutPlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; day?: string }>;
}) {
  const actor = await requireRole("TRAINER");
  const { id } = await params;
  const query = await searchParams;

  const plan = await getWorkoutPlan(actor, id).catch(handlePageError);
  const section: Section = query.section === "settings" ? "settings" : "days";

  // The day drill-down is URL state, so a specific day is deep-linkable and
  // the browser's back button steps out of it — no client state involved.
  const selectedDay = query.day ? plan.days.find((day) => day.id === query.day) : undefined;

  const exercises = section === "days" ? await listExercises(actor, {}) : [];

  const boundUpdateAction = updateWorkoutPlanAction.bind(null, plan.id);
  const boundAddDayAction = addWorkoutDayAction.bind(null, plan.id);
  const planHref = `/trainer/workout-plans/${plan.id}`;
  const totalExercises = plan.days.reduce((sum, day) => sum + day.exercises.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backHref={`/trainer/members/${plan.memberId}`}
        backLabel="Back to member"
        title={plan.name}
        badge={<StatusBadge kind="plan" status={plan.status} />}
        description={
          <>
            {plan.days.length} day{plan.days.length === 1 ? "" : "s"} · {totalExercises} exercise
            {totalExercises === 1 ? "" : "s"} ·{" "}
            {plan.startDate.toLocaleDateString(undefined, zoned())}
            {plan.endDate ? ` – ${plan.endDate.toLocaleDateString(undefined, zoned())}` : ""}
          </>
        }
      />

      <SectionTabs
        items={[
          {
            label: "Days",
            href: planHref,
            active: section === "days",
            count: plan.days.length,
          },
          {
            label: "Plan settings",
            href: `${planHref}?section=settings`,
            active: section === "settings",
          },
        ]}
      />

      {section === "settings" ? (
        <div className="flex flex-col gap-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Plan details</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutPlanForm
                mode="edit"
                action={boundUpdateAction}
                defaultValues={{
                  name: plan.name,
                  description: plan.description ?? undefined,
                  startDate: toDateInputValue(plan.startDate),
                  endDate: toDateInputValue(plan.endDate),
                }}
              />
            </CardContent>
          </Card>

          {plan.status === "ACTIVE" ? (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Plan status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    Mark this plan completed once the member finishes the block. The plan
                    stays visible to them either way.
                  </p>
                  <form action={setWorkoutPlanStatusAction.bind(null, plan.id, "COMPLETED")}>
                    <Button type="submit" variant="outline" className="w-full sm:w-auto">
                      Mark completed
                    </Button>
                  </form>
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    Cancelling stops this plan being the member&apos;s active programme.
                  </p>
                  <ConfirmAction
                    action={setWorkoutPlanStatusAction.bind(null, plan.id, "CANCELLED")}
                    title="Cancel this workout plan?"
                    description={`"${plan.name}" will be marked cancelled and will stop counting as this member's active plan.`}
                    consequences={[
                      "The member keeps read-only access to the plan and its history.",
                      "Days and exercises are not deleted.",
                    ]}
                    reversibility="You can't re-activate a cancelled plan — you'd create a new one instead."
                    confirmLabel="Cancel plan"
                    cancelLabel="Keep plan active"
                    triggerLabel="Cancel plan"
                    triggerClassName="w-full sm:w-auto"
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start">
          {/* Days list: always visible on desktop, hidden on mobile once a
              day is open so the drill-down reads as a single screen. */}
          <div className={cn("flex flex-col gap-3", selectedDay && "hidden lg:flex")}>
            {plan.days.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarDays}
                title="No days yet"
                description="Add the first training day below."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {plan.days.map((day, index) => {
                  const active = selectedDay?.id === day.id;
                  return (
                    <li key={day.id}>
                      <Link
                        href={`${planHref}?day=${day.id}`}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 shadow-xs transition-colors",
                          active
                            ? "border-primary bg-primary-subtle"
                            : "border-border bg-card hover:border-border-strong hover:bg-muted/40"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg text-[0.8125rem] font-semibold",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">{day.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {day.exercises.length} exercise
                            {day.exercises.length === 1 ? "" : "s"}
                          </span>
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground/70"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <Disclosure title="Add a day" icon={Plus} defaultOpen={plan.days.length === 0}>
              <AddWorkoutDayForm action={boundAddDayAction} />
            </Disclosure>
          </div>

          {/* Day detail */}
          <div className={cn("flex flex-col gap-4", !selectedDay && "hidden lg:flex")}>
            {selectedDay ? (
              <>
                <div className="flex flex-col gap-3 lg:hidden">
                  <Link
                    href={planHref}
                    className="tap-target inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    All days
                  </Link>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold tracking-[-0.01em]">
                      {selectedDay.label}
                    </h2>
                    {selectedDay.notes ? (
                      <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {selectedDay.notes}
                      </p>
                    ) : null}
                  </div>
                  <ConfirmAction
                    action={removeWorkoutDayAction.bind(null, plan.id, selectedDay.id)}
                    title={`Remove "${selectedDay.label}"?`}
                    description={`This removes the day from "${plan.name}".`}
                    consequences={
                      selectedDay.exercises.length > 0
                        ? [
                            `All ${selectedDay.exercises.length} exercise${selectedDay.exercises.length === 1 ? "" : "s"} prescribed on this day will be deleted with it.`,
                          ]
                        : undefined
                    }
                    reversibility="This can't be undone — you'd need to rebuild the day by hand."
                    confirmLabel="Remove day"
                    triggerLabel="Remove day"
                    triggerSize="sm"
                  />
                </div>

                {selectedDay.exercises.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Repeat}
                    title="No exercises on this day"
                    description="Add the first exercise using the form below."
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {selectedDay.exercises.map((we) => (
                      <li
                        key={we.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5"
                      >
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <p className="text-sm font-medium">{we.exercise.name}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Repeat aria-hidden="true" className="size-3.5" />
                              <span className="tabular-nums">
                                {we.sets} × {we.reps}
                              </span>
                            </span>
                            {we.weightKg ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Weight aria-hidden="true" className="size-3.5" />
                                <span className="tabular-nums">{we.weightKg} kg</span>
                              </span>
                            ) : null}
                            {we.restSeconds ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Timer aria-hidden="true" className="size-3.5" />
                                <span className="tabular-nums">{we.restSeconds}s</span>
                              </span>
                            ) : null}
                          </div>
                          {we.notes ? (
                            <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                              {we.notes}
                            </p>
                          ) : null}
                        </div>

                        <ConfirmAction
                          action={removeWorkoutExerciseAction.bind(null, plan.id, we.id)}
                          title={`Remove ${we.exercise.name}?`}
                          description={`This removes ${we.exercise.name} from "${selectedDay.label}".`}
                          reversibility="This can't be undone, but you can add the exercise again."
                          confirmLabel="Remove exercise"
                          triggerLabel={`Remove ${we.exercise.name}`}
                          triggerAriaLabel={`Remove ${we.exercise.name}`}
                          hideTriggerLabel
                          triggerVariant="ghost"
                          triggerSize="icon-sm"
                          triggerIcon={XIcon}
                          triggerClassName="tap-target text-muted-foreground"
                        />
                      </li>
                    ))}
                  </ul>
                )}

                <Disclosure
                  title="Add an exercise"
                  icon={Plus}
                  defaultOpen={selectedDay.exercises.length === 0}
                >
                  <AddWorkoutExerciseForm
                    action={addWorkoutExerciseAction.bind(null, plan.id, selectedDay.id)}
                    exercises={exercises}
                  />
                </Disclosure>
              </>
            ) : (
              <div className="hidden lg:block">
                <EmptyState
                  icon={CalendarDays}
                  title={plan.days.length === 0 ? "No days yet" : "Select a day"}
                  description={
                    plan.days.length === 0
                      ? "Add a training day to start building this plan."
                      : "Pick a day on the left to see and edit its exercises."
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
