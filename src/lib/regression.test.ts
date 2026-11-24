import { describe, it, expect } from "vitest";
import { checkAvailability, type Room, type Booking } from "./availability";

// Practice #08 regression tests for BUG-A and BUG-B.
// Fixed clock (NOW = 09:00) and a fresh fixture for every test.
const NOW = 540;

const freshRoom = (bookings: Booking[] = [{ roomId: "r1", start: 600, end: 660 }]): Room => ({
  id: "r1",
  name: "Test Room",
  location: "B",
  blocked: false,
  bookings: bookings.map((b) => ({ ...b })),
});

// Deep-freeze so any write to the room or its bookings throws a TypeError.
const deepFreeze = <T>(o: T): T => {
  Object.values(o as object).forEach((v) => {
    if (v && typeof v === "object") deepFreeze(v);
  });
  return Object.freeze(o);
};

describe("BUG-A regression: touching endpoints are NOT conflicts (AC4)", () => {
  it("R-A1 new booking starts exactly when existing ends (11:00-12:00 after 10:00-11:00) -> Available", () => {
    expect(checkAvailability({ now: NOW, start: 660, end: 720, room: freshRoom() })).toEqual({ available: true });
  });

  it("R-A2 new booking ends exactly when existing starts (09:20-10:00 before 10:00-11:00) -> Available", () => {
    expect(checkAvailability({ now: NOW, start: 560, end: 600, room: freshRoom() })).toEqual({ available: true });
  });

  it("R-A3 one minute of real overlap (10:59-11:30) -> Unavailable with code overlap", () => {
    const r = checkAvailability({ now: NOW, start: 659, end: 690, room: freshRoom() });
    expect(r.available).toBe(false);
    expect(r).toMatchObject({ code: "overlap" });
  });
});

describe("BUG-B regression: availability check never changes booking data (AC5)", () => {
  // Bookings intentionally NOT sorted by start time.
  const unsorted: Booking[] = [
    { roomId: "r1", start: 900, end: 960 },
    { roomId: "r1", start: 600, end: 660 },
    { roomId: "r1", start: 720, end: 780 },
  ];

  it("R-B1 unsorted bookings keep the same order, length and array reference", () => {
    const room = freshRoom(unsorted);
    const ref = room.bookings;
    const snapshot = JSON.stringify(room);
    checkAvailability({ now: NOW, start: 660, end: 720, room });
    expect(room.bookings).toBe(ref);
    expect(room.bookings.map((b) => b.start)).toEqual([900, 600, 720]);
    expect(JSON.stringify(room)).toBe(snapshot);
  });

  it("R-B2 deep-frozen room: Available path does not try to write", () => {
    const room = deepFreeze(freshRoom(unsorted));
    expect(() => checkAvailability({ now: NOW, start: 660, end: 720, room })).not.toThrow();
  });

  it("R-B3 deep-frozen room: Unavailable (overlap) path does not try to write", () => {
    const room = deepFreeze(freshRoom(unsorted));
    let r: ReturnType<typeof checkAvailability> | undefined;
    expect(() => { r = checkAvailability({ now: NOW, start: 630, end: 690, room }); }).not.toThrow();
    expect(r?.available).toBe(false);
  });
});
