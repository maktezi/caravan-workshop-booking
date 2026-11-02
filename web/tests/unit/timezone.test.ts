import { describe, expect, test } from "bun:test";
import {
  formatDateTime,
  melbourneToUtc,
  toLocalInput,
} from "../../lib/timezone";

describe("Melbourne time conversion", () => {
  test("converts summer local time to UTC", () => {
    expect(melbourneToUtc("2026-11-03T09:00")).toBe("2026-11-02T22:00:00.000Z");
  });
  test("converts winter local time to UTC", () => {
    expect(melbourneToUtc("2026-06-15T09:00:30")).toBe(
      "2026-06-14T23:00:30.000Z",
    );
  });
  test("formats input independently of the host timezone", () => {
    expect(toLocalInput("2026-11-02T22:00:00Z")).toBe("2026-11-03T09:00:00");
    expect(toLocalInput("2026-06-14T23:00:30Z")).toBe("2026-06-15T09:00:30");
  });
  test("rejects the hour skipped when DST starts", () => {
    expect(() => melbourneToUtc("2026-10-04T02:30")).toThrow("does not exist");
  });
  test("rejects the repeated hour when DST ends", () => {
    expect(() => melbourneToUtc("2026-04-05T02:30")).toThrow("occurs twice");
  });
  test("accepts both sides of the spring transition", () => {
    expect(melbourneToUtc("2026-10-04T01:59:59")).toBe(
      "2026-10-03T15:59:59.000Z",
    );
    expect(melbourneToUtc("2026-10-04T03:00:00")).toBe(
      "2026-10-03T16:00:00.000Z",
    );
  });
  test("accepts both sides of the autumn transition", () => {
    expect(melbourneToUtc("2026-04-05T01:59:59")).toBe(
      "2026-04-04T14:59:59.000Z",
    );
    expect(melbourneToUtc("2026-04-05T03:00:00")).toBe(
      "2026-04-04T17:00:00.000Z",
    );
  });
  test.each([
    "",
    "not a date",
    "2026-02-30T09:00",
    "2026-13-01T09:00",
    "2026-11-03T25:00",
    "2026-11-03T09:00Z",
  ])("rejects invalid local input: %s", (input) => {
    expect(() => melbourneToUtc(input)).toThrow("valid date and time");
  });
  test("displays a Melbourne date and timezone", () => {
    expect(formatDateTime("2026-11-02T22:00:00Z")).toContain("3 Nov 2026");
    expect(formatDateTime("2026-11-02T22:00:00Z")).toContain("AEDT");
  });
});
