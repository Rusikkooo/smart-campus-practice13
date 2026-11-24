import { describe, it, expect } from "vitest";
import { getTimeProblems, DAY_END_MIN, MAX_DURATION_MIN } from "./availability";

describe("getTimeProblems: time rule codes in rule order (AC1, AC2)", () => {
  it("returns no problems for a valid future slot at the 120-minute boundary", () => {
    expect(getTimeProblems(540, 720, 840)).toEqual([]);
  });

  it("flags a start equal to now as start_not_after_now (AC1)", () => {
    expect(getTimeProblems(570, 570, 630)).toEqual(["start_not_after_now"]);
  });

  it("flags a reversed interval as invalid_time (AC1)", () => {
    expect(getTimeProblems(540, 720, 660)).toEqual(["invalid_time"]);
  });

  it("reports invalid_time before start_not_after_now when both fail (AC1)", () => {
    expect(getTimeProblems(570, 540, 500)).toEqual(["invalid_time", "start_not_after_now"]);
  });

  it("flags a 121-minute slot as duration_exceeded (AC2)", () => {
    expect(getTimeProblems(540, 720, 841)).toEqual(["duration_exceeded"]);
  });

  it("flags an end past the day boundary as invalid_time (AC1)", () => {
    expect(getTimeProblems(0, 1380, DAY_END_MIN + 1)).toEqual(["invalid_time"]);
  });

  it("flags a negative start as invalid_time and also as not after now (AC1)", () => {
    expect(getTimeProblems(540, -10, 30)).toEqual(["invalid_time", "start_not_after_now"]);
  });

  it("uses the documented constants", () => {
    expect(MAX_DURATION_MIN).toBe(120);
    expect(DAY_END_MIN).toBe(1440);
  });
});
