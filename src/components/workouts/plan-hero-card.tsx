import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Dumbbell, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { zoned } from "@/lib/time-zone";
import type { WorkoutPlanStatus } from "@/generated/prisma/client";

export type PlanHeroCardPlan = {
  id: string;
  name: string;
  status: WorkoutPlanStatus;
  startDate: Date;
  days: { label: string; _count: { exercises: number } }[];
};

/**
 * The "Today's workout" card: plan name, its days and counts on the left,
 * a training photo fading in from the right, and a lime pill to open it.
 * Only real plan data is shown — the counts come from the plan's own days.
 */
export function PlanHeroCard({
  plan,
  href,
  imageSrc = "/images/landing/hero.jpg",
  ctaLabel = "Open workout",
}: {
  plan: PlanHeroCardPlan;
  href: string;
  imageSrc?: string;
  ctaLabel?: string;
}) {
  const exerciseCount = plan.days.reduce((sum, day) => sum + day._count.exercises, 0);

  return (
    <div className="relative isolate flex min-h-48 overflow-hidden rounded-2xl border border-border/80 bg-card">
      {/* The photo sits on the right and fades into the card, so the text
          on the left always stays readable. */}
      <div className="absolute inset-y-0 right-0 -z-10 w-[62%] sm:w-1/2">
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 380px, 62vw"
          className="object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-card via-card/55 to-transparent" />
      </div>
      <div className="flex max-w-[68%] flex-col justify-between gap-4 p-5 sm:max-w-[55%]">
        <div className="flex flex-col gap-1.5">
          <StatusBadge kind="plan" status={plan.status} size="sm" />
          <h3 className="text-xl leading-tight font-extrabold tracking-[-0.02em] text-balance">
            {plan.name}
          </h3>
          <p className="line-clamp-1 text-[0.8125rem] text-muted-foreground">
            {plan.days.length > 0
              ? plan.days.map((day) => day.label).join(" · ")
              : `Started ${plan.startDate.toLocaleDateString(undefined, zoned())}`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Dumbbell aria-hidden="true" className="size-4 text-primary" />
              {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4 text-primary" />
              {plan.days.length} day{plan.days.length === 1 ? "" : "s"}
            </span>
          </div>
          <Button
            className="w-fit pr-3"
            nativeButton={false}
            render={
              <Link href={href}>
                {ctaLabel}
                <span
                  aria-hidden="true"
                  className="flex size-6 items-center justify-center rounded-full bg-primary-foreground text-primary"
                >
                  <Play className="size-3 fill-current" />
                </span>
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
