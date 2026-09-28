import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Timer, Weight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getWorkoutPlan } from "@/server/services/workout.service";
import { handlePageError } from "@/lib/service-error";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { zoned } from "@/lib/time-zone";

export const metadata: Metadata = {
  title: "Workout plan",
};

export default async function MyWorkoutPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireRole("MEMBER");
  const { id } = await params;

  // getWorkoutPlan enforces "own plan only" — this member can never load
  // another member's plan by guessing an id.
  const plan = await getWorkoutPlan(actor, id).catch(handlePageError);

  const exercises = plan.days.flatMap((day) => day.exercises);
  const totalSets = exercises.reduce((sum, we) => sum + we.sets, 0);
  const muscleGroups = [
    ...new Set(exercises.map((we) => we.exercise.muscleGroup).filter((group): group is string => !!group)),
  ];

  const stats = [
    { label: "Days", value: plan.days.length },
    { label: "Exercises", value: exercises.length },
    { label: "Total sets", value: totalSets },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/member/workout-plans"
        className="tap-target -ml-1 inline-flex w-fit items-center gap-1.5 rounded-md px-1 py-1 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Workout plans
      </Link>

      {/* Hero: the plan's name over a full-bleed training photo. */}
      <div className="relative isolate flex min-h-56 overflow-hidden rounded-3xl border border-border/80 bg-card sm:min-h-64">
        {/* Phones: full-bleed photo under the title. Laptops: the photo
            takes the right half and fades into the card, so a portrait shot
            isn't cropped into a thin strip. */}
        <div className="absolute inset-0 -z-20 lg:left-auto lg:w-1/2">
          <Image
            src="/images/landing/pull-up.jpg"
            alt=""
            fill
            preload
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover object-[center_28%]"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/55 to-black/5 lg:bg-linear-to-r lg:from-card lg:from-50% lg:via-card/60 lg:via-65% lg:to-transparent" />
        <div className="mt-auto flex flex-col gap-2 p-5 sm:p-6">
          <StatusBadge kind="plan" status={plan.status} size="sm" />
          <h1 className="text-[1.875rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
            {plan.name}
          </h1>
          <p className="text-sm text-white/75">
            {muscleGroups.length > 0
              ? muscleGroups.join(", ")
              : `${plan.startDate.toLocaleDateString(undefined, zoned())}${plan.endDate ? ` – ${plan.endDate.toLocaleDateString(undefined, zoned())}` : ""}`}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-border/80 rounded-2xl border border-border/80 bg-card py-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse items-center gap-1 px-2 text-center">
            <dt className="text-xs font-medium text-muted-foreground">{stat.label}</dt>
            <dd className="text-2xl leading-none font-extrabold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
        {plan.startDate.toLocaleDateString(undefined, zoned())}
        {plan.endDate ? ` – ${plan.endDate.toLocaleDateString(undefined, zoned())}` : " · no end date"}
        {plan.description ? ` · ${plan.description}` : ""}
      </p>

      {plan.days.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No days in this plan yet"
          description="Your trainer hasn't added training days to this plan."
        />
      ) : (
        <>
          {plan.days.length > 1 ? (
            <nav aria-label="Training days" className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
              <ul className="flex w-max gap-2">
                {plan.days.map((day, index) => (
                  <li key={day.id}>
                    <a
                      href={`#day-${day.id}`}
                      className={
                        index === 0
                          ? "inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold whitespace-nowrap text-primary-foreground"
                          : "inline-flex h-10 items-center rounded-full border border-border/80 bg-card px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                      }
                    >
                      {day.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="flex flex-col gap-7">
            {plan.days.map((day, index) => (
              <section key={day.id} id={`day-${day.id}`} className="flex scroll-mt-24 flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg leading-snug font-bold tracking-[-0.01em]">
                    <span className="sr-only">Day {index + 1}: </span>
                    {day.label}
                  </h2>
                  <span className="shrink-0 text-[0.8125rem] font-semibold text-primary">
                    {day.exercises.length} exercise{day.exercises.length === 1 ? "" : "s"}
                  </span>
                </div>

                {day.notes ? (
                  <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">{day.notes}</p>
                ) : null}

                {day.exercises.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-muted-foreground">
                    No exercises added to this day yet.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-2.5">
                    {day.exercises.map((we, exerciseIndex) => (
                      <li
                        key={we.id}
                        className="flex gap-3.5 rounded-2xl border border-border/80 bg-card p-3"
                      >
                        <span
                          aria-hidden="true"
                          className="relative flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"
                        >
                          <Dumbbell className="size-6" />
                          <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[0.625rem] font-bold text-primary-foreground ring-2 ring-card">
                            {exerciseIndex + 1}
                          </span>
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-[0.9375rem] font-semibold">{we.exercise.name}</p>
                            {we.exercise.muscleGroup ? (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {we.exercise.muscleGroup}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[0.8125rem] text-muted-foreground tabular-nums">
                            <span className="font-semibold text-foreground">{we.sets}</span> sets ×{" "}
                            <span className="font-semibold text-foreground">{we.reps}</span> reps
                          </p>
                          {we.weightKg || we.restSeconds ? (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {we.weightKg ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
                                  <Weight aria-hidden="true" className="size-3" />
                                  {we.weightKg} kg
                                </span>
                              ) : null}
                              {we.restSeconds ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
                                  <Timer aria-hidden="true" className="size-3" />
                                  {we.restSeconds}s rest
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                          {we.notes ? (
                            <p className="pt-0.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                              {we.notes}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
