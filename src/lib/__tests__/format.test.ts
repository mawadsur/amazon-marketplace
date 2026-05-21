import { describe, expect, it } from "vitest";
import { formatUsd, formatInr, formatRating } from "@/lib/format";

describe("formatUsd", () => {
  it("formats cents as USD currency", () => {
    expect(formatUsd(1234)).toBe("$12.34");
    expect(formatUsd(0)).toBe("$0.00");
  });
});

describe("formatInr", () => {
  it("formats paise as INR currency with no decimals", () => {
    expect(formatInr(123_400)).toMatch(/₹\s*1,234/);
  });
});

describe("formatRating", () => {
  it("returns one decimal place", () => {
    expect(formatRating(4.345)).toBe("4.3");
    expect(formatRating(5)).toBe("5.0");
  });

  it("returns an em dash for missing ratings", () => {
    expect(formatRating(null)).toBe("—");
    expect(formatRating(undefined)).toBe("—");
    expect(formatRating(NaN)).toBe("—");
  });
});
