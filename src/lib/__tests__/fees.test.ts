import { describe, expect, it } from "vitest";
import {
  platformFeeUsdCents,
  buyerServiceFeeUsdCents,
  flatShippingUsdCents,
  shopNetUsdCents,
} from "@/lib/fees";

describe("platformFeeUsdCents", () => {
  it("returns 10% of subtotal", () => {
    expect(platformFeeUsdCents(10_000)).toBe(1_000); // $100 → $10
    expect(platformFeeUsdCents(8_500)).toBe(850);
  });

  it("rounds to the nearest cent", () => {
    expect(platformFeeUsdCents(99)).toBe(10); // 9.9¢ → 10¢
  });

  it("returns 0 for non-positive subtotals", () => {
    expect(platformFeeUsdCents(0)).toBe(0);
    expect(platformFeeUsdCents(-100)).toBe(0);
  });
});

describe("buyerServiceFeeUsdCents", () => {
  it("returns 4% of subtotal above the floor", () => {
    expect(buyerServiceFeeUsdCents(10_000)).toBe(400); // $100 → $4.00
    expect(buyerServiceFeeUsdCents(50_000)).toBe(2_000); // $500 → $20
  });

  it("enforces the $1.99 minimum floor", () => {
    expect(buyerServiceFeeUsdCents(100)).toBe(199); // 4¢ would be below floor
    expect(buyerServiceFeeUsdCents(4_000)).toBe(199); // 4% = $1.60 → floor
  });

  it("returns 0 for non-positive subtotals", () => {
    expect(buyerServiceFeeUsdCents(0)).toBe(0);
    expect(buyerServiceFeeUsdCents(-100)).toBe(0);
  });
});

describe("flatShippingUsdCents", () => {
  it("returns the configured flat rate", () => {
    expect(flatShippingUsdCents()).toBe(999);
  });
});

describe("shopNetUsdCents", () => {
  it("returns subtotal minus 10% platform fee", () => {
    expect(shopNetUsdCents(10_000)).toBe(9_000); // $100 → $90 net
  });

  it("never goes negative", () => {
    expect(shopNetUsdCents(0)).toBe(0);
    expect(shopNetUsdCents(-100)).toBe(0);
  });
});
