import { describe, expect, it } from "vitest";
import { formatMinutes } from "./activity-display";

describe("formatMinutes", () => {
  it.each([
    [0, "0m"],
    [45, "45m"],
    [60, "1h"],
    [270, "4h 30m"],
    [-5, "0m"],
  ])("%d → %s", (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });

  it("has a compact form for tight chart labels", () => {
    expect(formatMinutes(270, true)).toBe("4.5h");
    expect(formatMinutes(120, true)).toBe("2h");
    expect(formatMinutes(20, true)).toBe("20m");
  });
});
