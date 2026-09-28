import { describe, expect, it } from "vitest";
import { prismaMock } from "@/test/prisma-mock";
import {
  checkIn,
  checkOut,
  getTodayStatus,
  listAttendanceForMember,
  listTodayAttendance,
  listAttendanceHistory,
  getRecentActivity,
} from "./attendance.service";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";
import { startOfDay } from "@/lib/date";
import { Prisma } from "@/generated/prisma/client";
import type { Actor } from "@/lib/auth/policies";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const member: Actor = { id: "member-1", role: "MEMBER" };
const otherMember: Actor = { id: "member-2", role: "MEMBER" };
const trainer: Actor = { id: "trainer-1", role: "TRAINER" };

const memberUser = {
  id: "member-1",
  email: "m@example.com",
  passwordHash: "x",
  fullName: "Mo Member",
  phone: null,
  role: "MEMBER" as const,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function attendanceRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "attendance-1",
    memberId: "member-1",
    checkInAt: new Date(),
    checkOutAt: null,
    attendanceDate: startOfDay(new Date()),
    method: "MANUAL" as const,
    recordedByUserId: "member-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("checkIn", () => {
  it("throws ForbiddenError when checking in on behalf of another member", async () => {
    await expect(checkIn(member, "member-2")).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.attendance.create).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError for an admin trying to check a member in — no admin-assisted check-in yet", async () => {
    await expect(checkIn(admin, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a non-existent or non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(checkIn(member, "member-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("checks a member in successfully, using the server's own clock", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.attendance.findFirst.mockResolvedValue(null); // no open session
    prismaMock.attendance.create.mockResolvedValue(attendanceRow());

    const before = new Date();
    await checkIn(member, "member-1");
    const after = new Date();

    const call = prismaMock.attendance.create.mock.calls[0]?.[0];
    const checkInAt = call?.data.checkInAt as Date;
    expect(checkInAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(checkInAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(call?.data.attendanceDate).toEqual(startOfDay(checkInAt));
    expect(call?.data.recordedByUserId).toBe("member-1");
    expect(call?.data.method).toBe("MANUAL");
  });

  it("defaults to MANUAL but accepts an explicit method (QR-readiness)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.attendance.findFirst.mockResolvedValue(null);
    prismaMock.attendance.create.mockResolvedValue(attendanceRow());

    await checkIn(member, "member-1", "QR");

    const call = prismaMock.attendance.create.mock.calls[0]?.[0];
    expect(call?.data.method).toBe("QR");
  });

  it("throws ConflictError when the member already has an open session", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.attendance.findFirst.mockResolvedValue(attendanceRow());

    await expect(checkIn(member, "member-1")).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.attendance.create).not.toHaveBeenCalled();
  });

  it("maps a database-level unique-constraint race to the same ConflictError", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.attendance.findFirst.mockResolvedValue(null); // check passes...
    // ...but the insert loses a race to a concurrent request and hits the
    // partial unique index (see the migration's hand-written SQL). Meta
    // shape as actually observed from @prisma/adapter-pg against real
    // Postgres (confirmed by hand against Neon, not just this mock) —
    // notably *not* the conventional flat `meta.target`.
    prismaMock.attendance.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: {
          driverAdapterError: {
            cause: { constraint: { index: "attendance_memberId_open_session_key" } },
          },
        },
      }),
    );

    await expect(checkIn(member, "member-1")).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("checkOut", () => {
  it("throws ForbiddenError when checking out on behalf of another member", async () => {
    await expect(checkOut(member, "member-2")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFoundError for a non-member id", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(checkOut(member, "member-1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ConflictError when there is no open session", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    prismaMock.attendance.findFirst.mockResolvedValue(null);
    await expect(checkOut(member, "member-1")).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.attendance.update).not.toHaveBeenCalled();
  });

  it("checks out successfully, setting checkOutAt to the server's own clock", async () => {
    prismaMock.user.findUnique.mockResolvedValue(memberUser);
    const open = attendanceRow();
    prismaMock.attendance.findFirst.mockResolvedValue(open);
    prismaMock.attendance.update.mockResolvedValue({ ...open, checkOutAt: new Date() });

    const before = new Date();
    await checkOut(member, "member-1");
    const after = new Date();

    const call = prismaMock.attendance.update.mock.calls[0]?.[0];
    expect(call?.where).toEqual({ id: "attendance-1" });
    const checkOutAt = call?.data.checkOutAt as Date;
    expect(checkOutAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(checkOutAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe("getTodayStatus", () => {
  it("throws ForbiddenError for a member requesting someone else's status", async () => {
    await expect(getTodayStatus(member, "member-2")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("denies TRAINER", async () => {
    await expect(getTodayStatus(trainer, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows self and admin, returning the open session and today's records", async () => {
    const open = attendanceRow();
    prismaMock.attendance.findFirst.mockResolvedValue(open);
    prismaMock.attendance.findMany.mockResolvedValue([open]);

    const selfResult = await getTodayStatus(member, "member-1");
    expect(selfResult.openSession?.id).toBe("attendance-1");
    expect(selfResult.todaysRecords).toHaveLength(1);

    const adminResult = await getTodayStatus(admin, "member-1");
    expect(adminResult.openSession?.id).toBe("attendance-1");
  });

  it("queries only today's attendanceDate", async () => {
    prismaMock.attendance.findFirst.mockResolvedValue(null);
    prismaMock.attendance.findMany.mockResolvedValue([]);

    await getTodayStatus(admin, "member-1");

    const call = prismaMock.attendance.findMany.mock.calls[0]?.[0];
    expect(call?.where).toEqual({ memberId: "member-1", attendanceDate: startOfDay(new Date()) });
  });
});

describe("listAttendanceForMember", () => {
  it("throws ForbiddenError for a member requesting someone else's history", async () => {
    await expect(listAttendanceForMember(member, "member-2")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows self and admin, paginated", async () => {
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);

    await listAttendanceForMember(member, "member-1", 2);

    expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { memberId: "member-1" }, skip: 20, take: 20 }),
    );

    await expect(listAttendanceForMember(admin, "member-1")).resolves.toMatchObject({ total: 0 });
  });
});

describe("listTodayAttendance", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(listTodayAttendance(member)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listTodayAttendance(trainer)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns today's attendance for an admin", async () => {
    prismaMock.attendance.findMany.mockResolvedValue([attendanceRow()]);
    const result = await listTodayAttendance(admin);
    expect(result).toHaveLength(1);
    const call = prismaMock.attendance.findMany.mock.calls[0]?.[0];
    expect(call?.where).toEqual({ attendanceDate: startOfDay(new Date()) });
  });
});

describe("listAttendanceHistory", () => {
  it("throws ForbiddenError for a non-admin actor", async () => {
    await expect(listAttendanceHistory(member, {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listAttendanceHistory(otherMember, {})).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("filters by a date range and search term for an admin", async () => {
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);

    const dateFrom = new Date("2026-06-01T12:00:00Z");
    const dateTo = new Date("2026-06-30T08:00:00Z");
    await listAttendanceHistory(admin, { search: "mo", dateFrom, dateTo, page: 1 });

    const call = prismaMock.attendance.findMany.mock.calls[0]?.[0];
    expect(call?.where).toMatchObject({
      attendanceDate: { gte: startOfDay(dateFrom), lte: startOfDay(dateTo) },
      member: {
        OR: [
          { fullName: { contains: "mo", mode: "insensitive" } },
          { email: { contains: "mo", mode: "insensitive" } },
        ],
      },
    });
  });

  it("paginates", async () => {
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.attendance.count.mockResolvedValue(0);

    await listAttendanceHistory(admin, { page: 3 });

    expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
  });
});

describe("getRecentActivity", () => {
  const DAY = 24 * 60 * 60 * 1000;

  it("is limited to the member themself (and admins) — never another member or a trainer", async () => {
    await expect(getRecentActivity(otherMember, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getRecentActivity(trainer, "member-1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(prismaMock.attendance.findMany).not.toHaveBeenCalled();
  });

  it("returns one entry per day, oldest first, with real visit counts and minutes", async () => {
    const today = startOfDay(new Date());
    const twoDaysAgo = new Date(today.getTime() - 2 * DAY);
    prismaMock.attendance.findMany.mockResolvedValue([
      // Two closed sessions two days ago: 60 + 30 minutes.
      { attendanceDate: twoDaysAgo, checkInAt: new Date(twoDaysAgo.getTime() + 8 * 3600e3), checkOutAt: new Date(twoDaysAgo.getTime() + 9 * 3600e3) },
      { attendanceDate: twoDaysAgo, checkInAt: new Date(twoDaysAgo.getTime() + 18 * 3600e3), checkOutAt: new Date(twoDaysAgo.getTime() + 18.5 * 3600e3) },
    ] as never);

    const result = await getRecentActivity(member, "member-1", 7);

    expect(result.days).toHaveLength(7);
    expect(result.days[6]?.isToday).toBe(true);
    expect(result.days[4]).toMatchObject({ visits: 2, minutes: 90 });
    expect(result).toMatchObject({ totalVisits: 2, totalMinutes: 90, activeDays: 1 });
    expect(prismaMock.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { memberId: "member-1", attendanceDate: { gte: result.days[0]?.date } } }),
    );
  });

  it("counts a forgotten check-out as a visit without inventing time", async () => {
    const today = startOfDay(new Date());
    const yesterday = new Date(today.getTime() - DAY);
    prismaMock.attendance.findMany.mockResolvedValue([
      { attendanceDate: yesterday, checkInAt: new Date(yesterday.getTime() + 10 * 3600e3), checkOutAt: null },
    ] as never);

    const result = await getRecentActivity(member, "member-1", 7);
    expect(result.days[5]).toMatchObject({ visits: 1, minutes: 0 });
    expect(result.totalMinutes).toBe(0);
  });

  it("caps an absurdly long session so one mistake can't dominate the week", async () => {
    const today = startOfDay(new Date());
    const threeDaysAgo = new Date(today.getTime() - 3 * DAY);
    prismaMock.attendance.findMany.mockResolvedValue([
      { attendanceDate: threeDaysAgo, checkInAt: threeDaysAgo, checkOutAt: new Date(threeDaysAgo.getTime() + 30 * 3600e3) },
    ] as never);

    const result = await getRecentActivity(member, "member-1", 7);
    expect(result.days[3]?.minutes).toBe(12 * 60);
  });

  it("lets an admin view a member's activity", async () => {
    prismaMock.attendance.findMany.mockResolvedValue([]);
    await expect(getRecentActivity(admin, "member-1")).resolves.toMatchObject({ totalVisits: 0 });
  });
});
