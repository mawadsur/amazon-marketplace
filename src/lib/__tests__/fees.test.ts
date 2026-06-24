import { describe, expect, it } from "vitest";
import {
  serviceChargeUsdCents,
  flatShippingUsdCents,
  shopNetUsdCents,
} from "@/lib/fees";

describe("serviceChargeUsdCents", () => {
  it("returns a flat 10% of subtotal", () => {
    expect(serviceChargeUsdCents(10_000)).toBe(1_000); // $100 → $10
    expect(serviceChargeUsdCents(50_000)).toBe(5_000); // $500 → $50
  });

  it("rounds to the nearest cent", () => {
    expect(serviceChargeUsdCents(99)).toBe(10); // 9.9¢ → 10¢
  });

  it("has no minimum floor", () => {
    expect(serviceChargeUsdCents(100)).toBe(10); // 10% of $1.00 = 10¢
  });

  it("returns 0 for non-positive subtotals", () => {
    expect(serviceChargeUsdCents(0)).toBe(0);
    expect(serviceChargeUsdCents(-100)).toBe(0);
  });
});

describe("flatShippingUsdCents", () => {
  it("returns the configured flat rate", () => {
    expect(flatShippingUsdCents()).toBe(999);
  });
});

describe("shopNetUsdCents", () => {
  it("returns the full subtotal (seller is not deducted)", () => {
    expect(shopNetUsdCents(10_000)).toBe(10_000); // seller nets their full price
  });

  it("never goes negative", () => {
    expect(shopNetUsdCents(0)).toBe(0);
    expect(shopNetUsdCents(-100)).toBe(0);
  });
});
