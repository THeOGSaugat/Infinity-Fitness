"use client";

import { useActionState } from "react";
import { CircleAlert, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { AttendanceActionState } from "@/app/member/attendance/actions";

/**
 * The member's single most frequent action, given the weight it deserves.
 *
 * Checking in is a thing people do standing in a doorway holding a gym bag,
 * so on phones it is one full-width 48px control with the current state
 * stated in words directly above it, on both the home screen and the
 * attendance page — rather than a normal-sized button several taps deep. On
 * wider screens the status and the button sit side by side instead of the
 * button stretching across a laptop-width card. The surface turns
 * green while a session is open so the state is legible at a glance, but the
 * status is always written out too.
 */
export function CheckInPanel({
  isCheckedIn,
  checkedInSince,
  checkInAction,
  checkOutAction,
}: {
  isCheckedIn: boolean;
  checkedInSince?: string;
  checkInAction: (state: AttendanceActionState) => Promise<AttendanceActionState>;
  checkOutAction: (state: AttendanceActionState) => Promise<AttendanceActionState>;
}) {
  const [state, formAction, pending] = useActionState<AttendanceActionState, FormData>(
    isCheckedIn ? checkOutAction : checkInAction,
    undefined,
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-5 transition-colors md:grid md:grid-cols-[1fr_15rem] md:items-center md:gap-x-6",
        isCheckedIn
          ? "border-primary/35 bg-primary-subtle"
          : "border-border/80 bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-3 md:flex-row-reverse md:items-center md:justify-end md:gap-4">
        <div className="flex flex-col gap-1">
          <p
            className={cn(
              "text-[0.8125rem] font-medium",
              isCheckedIn ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isCheckedIn ? "You're at the gym" : "Not checked in"}
          </p>
          <p className="text-xl leading-tight font-bold tracking-[-0.015em]">
            {isCheckedIn && checkedInSince
              ? `Since ${checkedInSince}`
              : isCheckedIn
                ? "Session in progress"
                : "Ready when you are"}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            isCheckedIn
              ? "bg-primary text-primary-foreground"
              : "bg-primary-subtle text-primary"
          )}
        >
          {isCheckedIn ? <LogOut className="size-5" /> : <LogIn className="size-5" />}
        </span>
      </div>

      <form action={formAction}>
        <Button
          type="submit"
          size="xl"
          block
          disabled={pending}
          variant={isCheckedIn ? "outline" : "default"}
        >
          {pending
            ? isCheckedIn
              ? "Checking out…"
              : "Checking in…"
            : isCheckedIn
              ? "Check out"
              : "Check in"}
        </Button>
      </form>

      {state?.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm font-medium text-destructive-foreground md:col-span-2"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
