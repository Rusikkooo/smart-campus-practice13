export type Booking = {
  roomId: string;
  start: number; // minutes after midnight (half-open interval)
  end: number; // minutes after midnight
};

export type Room = {
  id: string;
  name: string;
  location: string;
  blocked: boolean;
  bookings: Booking[];
};

export type AvailabilityRequest = {
  now: number; // simulated current time, minutes after midnight
  start: number; // candidate start, minutes after midnight
  end: number; // candidate end, minutes after midnight
  room: Room;
};

export type AvailabilityResult =
  | { available: true }
  | { available: false; reason: string; code: RejectCode };

export type RejectCode =
  | "invalid_time"
  | "start_not_after_now"
  | "duration_exceeded"
  | "room_blocked"
  | "overlap";

export const MAX_DURATION_MIN = 120;
export const DAY_END_MIN = 1440;

export type TimeProblemCode = Extract<
  RejectCode,
  "invalid_time" | "start_not_after_now" | "duration_exceeded"
>;

/**
 * Time-only rules (AC1, AC2) for a requested slot, in rule order.
 * Returns every failing rule; an empty array means the times are valid.
 */
export function getTimeProblems(now: number, start: number, end: number): TimeProblemCode[] {
  const problems: TimeProblemCode[] = [];
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    !Number.isInteger(now) ||
    start < 0 ||
    end > DAY_END_MIN ||
    start >= end
  ) {
    problems.push("invalid_time");
  }
  if (start <= now) problems.push("start_not_after_now");
  if (end - start > MAX_DURATION_MIN) problems.push("duration_exceeded");
  return problems;
}

/**
 * Pure availability check. Does not mutate any booking or room data.
 *
 * Rules:
 *  AC1: 0 <= start < end <= 1440; start must be strictly after now (start == now rejected).
 *  AC2: duration = end - start must not exceed 120; exactly 120 is allowed.
 *  AC3: reject when the selected room is blocked.
 *  AC4: reject overlap with existing bookings; touching endpoints do NOT overlap (half-open).
 *  AC5: return an unambiguous Available / Unavailable result.
 */
export function checkAvailability(req: AvailabilityRequest): AvailabilityResult {
  const { now, start, end, room } = req;

  // AC3: blocked room always rejected — reported before any other check.
  if (room.blocked) {
    return {
      available: false,
      code: "room_blocked",
      reason: `${room.name} is currently blocked and cannot be booked.`,
    };
  }

  // AC1 and AC2: time rules, reported in rule order.
  const [problem] = getTimeProblems(now, start, end);

  if (problem === "invalid_time") {
    return {
      available: false,
      code: "invalid_time",
      reason: "Start must be earlier than end, both within 00:00–24:00.",
    };
  }

  if (problem === "start_not_after_now") {
    return {
      available: false,
      code: "start_not_after_now",
      reason: "Start time must be strictly later than the current simulated time.",
    };
  }

  if (problem === "duration_exceeded") {
    const duration = end - start;
    return {
      available: false,
      code: "duration_exceeded",
      reason: `Booking length is ${duration} min. Maximum allowed is ${MAX_DURATION_MIN} min.`,
    };
  }

  // AC4: overlap with existing bookings (half-open intervals — touching is fine).
  for (const b of room.bookings) {
    if (start < b.end && b.start < end) {
      return {
        available: false,
        code: "overlap",
        reason: `Overlaps an existing booking (${fmt(b.start)}–${fmt(b.end)}).`,
      };
    }
  }

  // AC5: unambiguous available result.
  return { available: true };
}

/** Format integer minutes after midnight as HH:MM. */
export function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
