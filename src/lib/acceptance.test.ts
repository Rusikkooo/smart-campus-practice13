import { describe, it, expect } from "vitest";
import { checkAvailability, type Room } from "./availability";
import { SAMPLE_ROOMS } from "@/data/rooms";

// Times are minutes after midnight. 540 = 09:00, 570 = 09:30, 600 = 10:00,
// 660 = 11:00, 720 = 12:00, 780 = 13:00.
const NOW = 540;

const room = (overrides: Partial<Room> = {}): Room => ({
  id: "r-test",
  name: "Test Room",
  location: "Test",
  blocked: false,
  bookings: [{ roomId: "r-test", start: 600, end: 660 }], // 10:00-11:00
  ...overrides,
});

describe("AC1: start must be later than now and within the day", () => {
  it("rejects a start time equal to the current time (09:30 start at 09:30 now)", () => {
    // AC1 requires start strictly after now, so a start equal to now is rejected.
    const r = checkAvailability({ now: 570, start: 570, end: 630, room: room({ bookings: [] }) });
    expect(r).toMatchObject({ available: false, code: "start_not_after_now" });
  });

  it("rejects a start time in the past (09:00 start at 09:30 now)", () => {
    // AC1: the start time is before the simulated current time.
    const r = checkAvailability({ now: 570, start: 540, end: 600, room: room({ bookings: [] }) });
    expect(r).toMatchObject({ available: false, code: "start_not_after_now" });
  });

  it("rejects a reversed interval where end is before start (12:00 to 11:00)", () => {
    // AC1: requires start < end, so the reversed interval is invalid.
    const r = checkAvailability({ now: NOW, start: 720, end: 660, room: room({ bookings: [] }) });
    expect(r).toMatchObject({ available: false, code: "invalid_time" });
  });

  it("rejects an interval whose start equals its end (zero length)", () => {
    // AC1: start must be strictly less than end.
    const r = checkAvailability({ now: NOW, start: 720, end: 720, room: room({ bookings: [] }) });
    expect(r).toMatchObject({ available: false, code: "invalid_time" });
  });
});

describe("AC2: duration must not exceed 120 minutes", () => {
  it("rejects a 121-minute booking (12:00 to 14:01) with the duration code", () => {
    // AC2: 121 minutes is over the 120-minute cap.
    const r = checkAvailability({ now: NOW, start: 720, end: 841, room: room({ bookings: [] }) });
    expect(r).toMatchObject({ available: false, code: "duration_exceeded" });
    expect(r.available === false && r.reason).toContain("121 min");
  });

  it("accepts a 120-minute booking at the boundary (12:00 to 14:00)", () => {
    // AC2: exactly 120 minutes is allowed.
    const r = checkAvailability({ now: NOW, start: 720, end: 840, room: room({ bookings: [] }) });
    expect(r).toEqual({ available: true });
  });
});

describe("AC3: blocked rooms are always rejected", () => {
  it("rejects a blocked room even when the requested time is otherwise valid", () => {
    // AC3: the room is blocked, so the valid time slot does not matter.
    const r = checkAvailability({ now: NOW, start: 720, end: 780, room: room({ blocked: true, bookings: [] }) });
    expect(r).toMatchObject({ available: false, code: "room_blocked" });
  });

  it("reports the blocked reason before any time-based reason", () => {
    // AC3 is checked first, so an invalid time in a blocked room still reports the room.
    const r = checkAvailability({ now: NOW, start: 780, end: 720, room: room({ blocked: true, bookings: [] }) });
    expect(r).toMatchObject({ available: false, code: "room_blocked" });
  });
});

describe("AC4: overlaps are rejected; touching endpoints are allowed", () => {
  it("rejects a request that overlaps an existing booking (10:30 to 11:30 vs 10:00-11:00)", () => {
    // AC4: the two intervals share 10:30-11:00.
    const r = checkAvailability({ now: NOW, start: 630, end: 690, room: room() });
    expect(r).toMatchObject({ available: false, code: "overlap" });
    expect(r.available === false && r.reason).toContain("10:00–11:00");
  });

  it("accepts a request that starts exactly when an existing booking ends (11:00 to 12:00)", () => {
    // AC4: 11:00 is the end of the existing booking, and touching is not overlapping.
    const r = checkAvailability({ now: NOW, start: 660, end: 720, room: room() });
    expect(r).toEqual({ available: true });
  });

  it("accepts a request that ends exactly when an existing booking starts (09:00 to 10:00)", () => {
    // AC4: 10:00 is the start of the existing booking, and touching is not overlapping.
    // Now is 08:30 so that the 09:00 start is still in the future (AC1).
    const r = checkAvailability({ now: 510, start: 540, end: 600, room: room() });
    expect(r).toEqual({ available: true });
  });
});

describe("Sample fixtures from src/data/rooms.ts stay unchanged", () => {
  it("checks against every sample room do not change any fixture data", () => {
    const before = JSON.stringify(SAMPLE_ROOMS);
    const times = [
      { start: 570 + 1, end: 630 },
      { start: 630, end: 690 },
      { start: 660, end: 720 },
      { start: 720, end: 841 },
    ];
    for (const r of SAMPLE_ROOMS) {
      for (const t of times) {
        checkAvailability({ now: 570, start: t.start, end: t.end, room: r });
      }
    }
    expect(JSON.stringify(SAMPLE_ROOMS)).toBe(before);
  });

  it("sample outcomes match the fixture data (now = 09:30)", () => {
    const lib = SAMPLE_ROOMS.find((r) => r.id === "r-lib-201")!;
    const eng = SAMPLE_ROOMS.find((r) => r.id === "r-eng-104")!;
    const maint = SAMPLE_ROOMS.find((r) => r.id === "r-maint")!;

    // Library 201 is booked 10:00-11:00: 11:00-12:00 touches and is available (AC4).
    expect(checkAvailability({ now: 570, start: 660, end: 720, room: lib })).toEqual({ available: true });
    // Library 201 overlap at 10:30-11:30 is rejected (AC4).
    expect(checkAvailability({ now: 570, start: 630, end: 690, room: lib })).toMatchObject({ code: "overlap" });
    // Engineering Lab 104 has a gap at 10:00-13:00, so 11:00-12:00 fits (AC4).
    expect(checkAvailability({ now: 570, start: 660, end: 720, room: eng })).toEqual({ available: true });
    // Newton Lecture Hall A is blocked, so every request is rejected (AC3).
    expect(checkAvailability({ now: 570, start: 660, end: 720, room: maint })).toMatchObject({ code: "room_blocked" });
  });
});
