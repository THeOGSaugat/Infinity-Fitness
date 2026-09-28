import { db } from "@/server/db";
import {
  canRecordAttendanceFor,
  canViewAttendanceFor,
  canViewAllAttendance,
  type Actor,
} from "@/lib/auth/policies";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { startOfDay } from "@/lib/date";
import { isUniqueConstraintError } from "@/server/prisma-errors";
import type { AttendanceMethod } from "@/generated/prisma/client";
import { clampPage } from "@/lib/pagination";

const HISTORY_PAGE_SIZE = 20;

async function findOpenSession(memberId: string) {
  return db.attendance.findFirst({ where: { memberId, checkOutAt: null } });
}

async function requireMember(memberId: string) {
  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "MEMBER") {
    throw new NotFoundError("Member not found.");
  }
  return member;
}

/**
 * Checks a member in. `method` exists specifically so a future QR-code
 * check-in flow — decode the QR payload to a memberId, then call this
 * exact function with method: "QR" — requires zero changes here. There
 * is deliberately no timestamp parameter: check-in time is always the
 * server's own clock at the moment this runs, never a client-supplied
 * value (see the Attendance model's comment in schema.prisma).
 */
export async function checkIn(
  actor: Actor,
  memberId: string,
  method: AttendanceMethod = "MANUAL",
) {
  if (!canRecordAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You can only check yourself in.");
  }

  await requireMember(memberId);

  const openSession = await findOpenSession(memberId);
  if (openSession) {
    throw new ConflictError("You're already checked in. Check out first.");
  }

  const now = new Date();

  try {
    return await db.attendance.create({
      data: {
        memberId,
        checkInAt: now,
        attendanceDate: startOfDay(now),
        method,
        recordedByUserId: actor.id,
      },
    });
  } catch (error) {
    // Defense-in-depth against a race between the check above and this
    // insert (e.g. a double-tapped button or two open tabs) — caught by
    // the partial unique index on (memberId) WHERE checkOutAt IS NULL.
    if (isUniqueConstraintError(error, "memberId")) {
      throw new ConflictError("You're already checked in. Check out first.");
    }
    throw error;
  }
}

export async function checkOut(actor: Actor, memberId: string) {
  if (!canRecordAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You can only check yourself out.");
  }

  await requireMember(memberId);

  const openSession = await findOpenSession(memberId);
  if (!openSession) {
    throw new ConflictError("You don't have an active check-in to check out from.");
  }

  return db.attendance.update({
    where: { id: openSession.id },
    data: { checkOutAt: new Date() },
  });
}

type AttendanceRecord = NonNullable<Awaited<ReturnType<typeof findOpenSession>>>;

export type TodayStatus = {
  openSession: AttendanceRecord | null;
  todaysRecords: AttendanceRecord[];
};

/** A member's (or, for an admin, any member's) status for the current day. */
export async function getTodayStatus(actor: Actor, memberId: string): Promise<TodayStatus> {
  if (!canViewAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You don't have permission to view this member's attendance.");
  }

  const today = startOfDay(new Date());

  const [openSession, todaysRecords] = await Promise.all([
    findOpenSession(memberId),
    db.attendance.findMany({
      where: { memberId, attendanceDate: today },
      orderBy: { checkInAt: "desc" },
    }),
  ]);

  return { openSession, todaysRecords };
}

export async function listAttendanceForMember(actor: Actor, memberId: string, page = 1) {
  if (!canViewAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You don't have permission to view this member's attendance.");
  }

  const safePage = clampPage(page);
  const where = { memberId };

  const [items, total] = await Promise.all([
    db.attendance.findMany({
      where,
      orderBy: { checkInAt: "desc" },
      skip: (safePage - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
    }),
    db.attendance.count({ where }),
  ]);

  return {
    items,
    total,
    page: safePage,
    pageSize: HISTORY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
  };
}

/** Admin-only: everyone's attendance for today, most recent check-in first. */
export type ActivityDay = {
  /** Midnight UTC of the day (the same day boundary attendance uses everywhere). */
  date: Date;
  visits: number;
  /** Time spent at the gym that day, in whole minutes. */
  minutes: number;
  isToday: boolean;
};

/** A session longer than this is treated as a forgotten check-out, not a workout. */
const MAX_SESSION_MINUTES = 12 * 60;

/**
 * The member's last `days` days of gym visits, oldest first — one entry
 * per day including empty ones, so a chart can draw a bar for each.
 *
 * Built only from real check-ins: a day's minutes are the sum of its
 * sessions (check-in to check-out). A session still open *today* counts up
 * to now; an open session from an earlier day (a forgotten check-out)
 * counts as a visit but adds no time, rather than inventing hours.
 */
export async function getRecentActivity(
  actor: Actor,
  memberId: string,
  days = 7,
): Promise<{ days: ActivityDay[]; totalVisits: number; totalMinutes: number; activeDays: number }> {
  if (!canViewAttendanceFor(actor, memberId)) {
    throw new ForbiddenError("You don't have permission to view this member's attendance.");
  }

  const now = new Date();
  const today = startOfDay(now);
  const span = Math.min(Math.max(Math.floor(days), 1), 31);
  const from = new Date(today.getTime() - (span - 1) * 24 * 60 * 60 * 1000);

  const records = await db.attendance.findMany({
    where: { memberId, attendanceDate: { gte: from } },
    select: { attendanceDate: true, checkInAt: true, checkOutAt: true },
  });

  const result: ActivityDay[] = Array.from({ length: span }, (_, i) => {
    const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    return { date, visits: 0, minutes: 0, isToday: date.getTime() === today.getTime() };
  });

  for (const record of records) {
    const index = Math.round((record.attendanceDate.getTime() - from.getTime()) / 86_400_000);
    const day = result[index];
    if (!day) continue;
    day.visits += 1;
    const end = record.checkOutAt ?? (day.isToday ? now : null);
    if (end) {
      const minutes = Math.floor((end.getTime() - record.checkInAt.getTime()) / 60_000);
      day.minutes += Math.min(Math.max(minutes, 0), MAX_SESSION_MINUTES);
    }
  }

  return {
    days: result,
    totalVisits: result.reduce((sum, day) => sum + day.visits, 0),
    totalMinutes: result.reduce((sum, day) => sum + day.minutes, 0),
    activeDays: result.filter((day) => day.visits > 0).length,
  };
}

export async function listTodayAttendance(actor: Actor) {
  if (!canViewAllAttendance(actor)) {
    throw new ForbiddenError("Only admins can view all members' attendance.");
  }

  const today = startOfDay(new Date());

  return db.attendance.findMany({
    where: { attendanceDate: today },
    include: { member: true },
    orderBy: { checkInAt: "desc" },
  });
}

export type AttendanceHistoryParams = {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
};

/** Admin-only: gym-wide attendance history, searchable by member and filterable by date range. */
export async function listAttendanceHistory(actor: Actor, params: AttendanceHistoryParams = {}) {
  if (!canViewAllAttendance(actor)) {
    throw new ForbiddenError("Only admins can view attendance history.");
  }

  const page = clampPage(params.page);
  const search = params.search?.trim();

  const where = {
    ...(params.dateFrom || params.dateTo
      ? {
          attendanceDate: {
            ...(params.dateFrom ? { gte: startOfDay(params.dateFrom) } : {}),
            ...(params.dateTo ? { lte: startOfDay(params.dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          member: {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.attendance.findMany({
      where,
      include: { member: true },
      orderBy: { checkInAt: "desc" },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
    }),
    db.attendance.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: HISTORY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
  };
}
