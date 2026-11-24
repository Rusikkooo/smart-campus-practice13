import { describe, it, expect } from "vitest";
import { SAMPLE_ROOMS } from "@/data/rooms";
import { checkAvailability } from "@/lib/availability";
import { applyBlocked, buildValidationErrors, parseDuration } from "@/lib/request";

// Shared practice contract: now = 09:30 (570), Athena Library Room 201,
// booking 10:00–11:00 (600–660). Outputs: isAvailable, reasonCode, message.

const NOW = 570;
const athena = SAMPLE_ROOMS.find((r) => r.name === "Athena Library Room 201")!;

function check(start: number, duration: number, blocked = false) {
  const room = applyBlocked(athena, blocked);
  return checkAvailability({ now: NOW, start, end: start + duration, room });
}

describe("shared contract T1–T8", () => {
  it("T1: 12:00 + 60 -> Available", () => {
    const res = check(720, 60);
    expect(res.available).toBe(true);
  });

  it("T2: 10:30 + 60 -> Unavailable (overlap)", () => {
    const res = check(630, 60);
    expect(res.available).toBe(false);
    if (!res.available) expect(res.code).toBe("overlap");
  });

  it("T3: 12:00 + 60 with blocked toggle -> Unavailable (blocked)", () => {
    const res = check(720, 60, true);
    expect(res.available).toBe(false);
    if (!res.available) expect(res.code).toBe("room_blocked");
  });

  it("T4: 12:00 + 0 -> validation error", () => {
    const parsed = parseDuration("0");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/greater than 0/i);
  });

  it("T5: 12:00 + 121 -> validation error", () => {
    const parsed = parseDuration("121");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/at most 120/i);
  });

  it("T6: 09:00 + 30 -> validation error (past start)", () => {
    const room = applyBlocked(athena, false);
    const res = checkAvailability({ now: NOW, start: 540, end: 570, room });
    expect(res.available).toBe(false);
    if (!res.available) expect(res.code).toBe("start_not_after_now");
  });

  it("T7: 11:00 + 60 -> Available (adjacent booking)", () => {
    const res = check(660, 60);
    expect(res.available).toBe(true);
  });

  it("T8: SAMPLE_ROOMS unchanged after all checks", () => {
    expect(SAMPLE_ROOMS[0].blocked).toBe(false);
    expect(SAMPLE_ROOMS[0].bookings).toEqual([
      { roomId: "r-lib-201", start: 600, end: 660 },
    ]);
    expect(SAMPLE_ROOMS[3].blocked).toBe(true);
    expect(SAMPLE_ROOMS.every((r) => r.bookings.length >= 0)).toBe(true);
  });
});

describe("duration parsing (AC6 feedback)", () => {
  it("rejects empty, non-number, negative and fractional input", () => {
    expect(parseDuration("").ok).toBe(false);
    expect(parseDuration("   ").ok).toBe(false);
    expect(parseDuration("abc").ok).toBe(false);
    expect(parseDuration("-30").ok).toBe(false);
    expect(parseDuration("12.5").ok).toBe(false);
  });

  it("accepts 1 and 120, and returns the parsed number", () => {
    expect(parseDuration("1")).toEqual({ ok: true, value: 1 });
    expect(parseDuration(" 120 ")).toEqual({ ok: true, value: 120 });
  });

  it("applyBlocked never mutates the original room object", () => {
    const copy = applyBlocked(athena, true);
    expect(copy.blocked).toBe(true);
    expect(athena.blocked).toBe(false);
    expect(copy).not.toBe(athena);
  });
});

describe("invalid duration suppresses time-rule messages (defect regression)", () => {
  const NOW = 570; // 09:30

  it("duration 0 shows exactly one message: the duration error", () => {
    const messages = buildValidationErrors("0", NOW, 720);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/greater than 0/i);
  });

  it("duration 121 shows exactly one message: the duration error", () => {
    const messages = buildValidationErrors("121", NOW, 720);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/at most 120/i);
  });

  it("no 'Start must be earlier than end.' message appears for duration 0 or 121", () => {
    for (const raw of ["0", "121", "-5", "abc", ""]) {
      const messages = buildValidationErrors(raw, NOW, 720);
      expect(messages.some((m) => m.includes("earlier than end"))).toBe(false);
    }
  });

  it("valid durations still surface time-rule messages as before", () => {
    const pastStart = buildValidationErrors("30", NOW, 540);
    expect(pastStart).toHaveLength(1);
    expect(pastStart[0]).toMatch(/strictly after the current time/i);

    const fine = buildValidationErrors("60", NOW, 720);
    expect(fine).toHaveLength(0);
  });
});
