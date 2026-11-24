import { getTimeProblems, MAX_DURATION_MIN } from "@/lib/availability";
import type { Room, TimeProblemCode } from "@/lib/availability";

/**
 * Request-layer adapter between the shared practice contract ("start +
 * duration in minutes" + a blocked flag) and the deterministic rules in
 * availability.ts. Pure functions only; presentation lives in the UI.
 */

export type DurationParse =
  | { ok: true; value: number }
  | { ok: false; error: string };

/** Parses a raw duration string: empty, non-number, 0, negative or > 120 is rejected. */
export function parseDuration(raw: string): DurationParse {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Enter a duration in minutes." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: "Duration must be a number of minutes." };
  }
  if (!Number.isInteger(value)) {
    return { ok: false, error: "Duration must be a whole number of minutes." };
  }
  if (value <= 0) {
    return { ok: false, error: "Duration must be greater than 0 minutes." };
  }
  if (value > 120) {
    return { ok: false, error: "Duration must be at most 120 minutes." };
  }
  return { ok: true, value };
}

/** Returns a copy of the room with the blocked flag applied; SAMPLE_ROOMS is never mutated. */
export function applyBlocked(room: Room, blocked: boolean): Room {
  return blocked ? { ...room, blocked: true } : room;
}

const TIME_PROBLEM_MESSAGES: Record<TimeProblemCode, string> = {
  invalid_time: "Start must be earlier than end.",
  start_not_after_now: "Start must be strictly after the current time.",
  duration_exceeded: `Duration must not exceed ${MAX_DURATION_MIN} minutes.`,
};

/**
 * All human-readable validation messages for the form. When the duration
 * itself is invalid there is no meaningful end time, so only the duration
 * message is returned and time checks are skipped entirely.
 */
export function buildValidationErrors(
  durationRaw: string,
  now: number,
  start: number
): string[] {
  const parsed = parseDuration(durationRaw);
  if (!parsed.ok) return [parsed.error];
  return getTimeProblems(now, start, start + parsed.value).map(
    (code) => TIME_PROBLEM_MESSAGES[code]
  );
}
