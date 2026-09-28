import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listWorkoutPlansForMember } from "@/server/services/workout.service";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { zoned } from "@/lib/time-zone";
import { PlanHeroCard } from "@/components/workouts/plan-hero-card";

export const metadata: Metadata = {
  title: "Workout plans",
};

export default async function MyWorkoutPlansPage() {
  const actor = await requireRole("MEMBER");

  // listWorkoutPlansForMember enforces "self only" — a member can never
  // load another member's plans through this page.
  const plans = await listWorkoutPlansForMember(actor, actor.id);
  const active = plans.filter((plan) => plan.status === "ACTIVE");
  const past = plans.filter((plan) => plan.status !== "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workout plans"
        description="Programmes your trainer has built for you."
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workout plan yet"
          description="Your trainer hasn't assigned you a plan. Once they do, it appears here with every day and exercise."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {active.length > 0 ? (
            <ul className="grid gap-3 lg:grid-cols-2">
              {active.map((plan, index) => (
                <li key={plan.id}>
                  <PlanHeroCard
                    plan={plan}
                    href={`/member/workout-plans/${plan.id}`}
                    imageSrc={index % 2 === 0 ? "/images/landing/hero.jpg" : "/images/landing/pull-up.jpg"}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {past.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold tracking-[-0.01em]">Past plans</h2>
              <ul className="flex flex-col gap-2">
                {past.map((plan) => (
                  <li key={plan.id}>
                    <ListCard
                      href={`/member/workout-plans/${plan.id}`}
                      icon={Dumbbell}
                      title={plan.name}
                      subtitle={`${plan.days.length} day${plan.days.length === 1 ? "" : "s"} · ${plan.days.reduce((sum, day) => sum + day._count.exercises, 0)} exercises`}
                      meta={
                        plan.endDate
                          ? `${plan.startDate.toLocaleDateString(undefined, zoned())} – ${plan.endDate.toLocaleDateString(undefined, zoned())}`
                          : `Started ${plan.startDate.toLocaleDateString(undefined, zoned())}`
                      }
                      trailing={<StatusBadge kind="plan" status={plan.status} size="sm" />}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
