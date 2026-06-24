import { describe, expect, it } from "vitest";
import {
  estimateDutyUsdCents,
  estimateLanded,
  categoryCustoms,
  isDdp,
} from "@/lib/customs";

describe("estimateDutyUsdCents", () => {
  it("applies the category rate for US destination", () => {
    // textiles 6.5% on $100
    expect(estimateDutyUsdCents("textiles", 10_000, "US")).toBe(650);
    // jewelry 5.5% on $100
    expect(estimateDutyUsdCents("jewelry", 10_000, "US")).toBe(550);
    // handicrafts 3.5% on $100
    expect(estimateDutyUsdCents("handicrafts", 10_000, "US")).toBe(350);
  });

  it("returns 0 for non-US destinations", () => {
    expect(estimateDutyUsdCents("textiles", 10_000, "IN")).toBe(0);
    expect(estimateDutyUsdCents("textiles", 10_000, "uk")).toBe(0);
  });

  it("returns 0 when subtotal is non-positive", () => {
    expect(estimateDutyUsdCents("textiles", 0, "US")).toBe(0);
    expect(estimateDutyUsdCents("textiles", -100, "US")).toBe(0);
  });

  it("uses the default rate for unmapped categories", () => {
    // default 5% on $100
    expect(estimateDutyUsdCents("widgets", 10_000, "US")).toBe(500);
  });
});

describe("estimateLanded", () => {
  it("sums items + shipping + duty + service into a coherent total", () => {
    const result = estimateLanded(
      [
        { category: "textiles", lineSubtotalUsdCents: 8_500 },
      ],
      "US",
    );
    expect(result.subtotalUsdCents).toBe(8_500);
    expect(result.shippingUsdCents).toBe(999);
    expect(result.dutyUsdCents).toBe(553); // 6.5% of $85
    expect(result.serviceUsdCents).toBe(850); // 10% of $85
    expect(result.totalUsdCents).toBe(
      result.subtotalUsdCents +
        result.shippingUsdCents +
        result.dutyUsdCents +
        result.serviceUsdCents,
    );
    expect(result.dutyApplied).toBe(true);
    expect(result.destinationCountry).toBe("US");
  });

  it("skips duty for non-US destinations and flags dutyApplied=false", () => {
    const result = estimateLanded(
      [{ category: "textiles", lineSubtotalUsdCents: 10_000 }],
      "IN",
    );
    expect(result.dutyUsdCents).toBe(0);
    expect(result.dutyApplied).toBe(false);
  });

  it("emits per-line detail with HS code + rate for transparency", () => {
    const result = estimateLanded(
      [
        { category: "textiles", lineSubtotalUsdCents: 5_000 },
        { category: "jewelry", lineSubtotalUsdCents: 3_000 },
      ],
      "US",
    );
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].hsCode).toBe(categoryCustoms("textiles").hsCode);
    expect(result.lines[0].rate).toBe(0.065);
    expect(result.lines[1].hsCode).toBe(categoryCustoms("jewelry").hsCode);
  });
});

describe("isDdp", () => {
  it("is true for US, false otherwise", () => {
    expect(isDdp("US")).toBe(true);
    expect(isDdp("us")).toBe(true);
    expect(isDdp("IN")).toBe(false);
    expect(isDdp("CA")).toBe(false);
  });
});
