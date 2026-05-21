// Customs + landed-cost estimation (D4).
//
// At checkout, the buyer sees the true landed cost upfront — items + shipping
// + estimated US import duty + service fee. Reduces the #1 stated cross-border
// risk (surprise duties at delivery → disputes / refunds).
//
// Duty rates here are illustrative MFN approximations from the US HTS for the
// three pilot categories (handicrafts, textiles, jewelry). Real classifications
// vary by product specifics — when we wire Shiprocket DDP, their HS-code lookup
// will be the source of truth and we'll fold their numbers in here.

import {
  flatShippingUsdCents,
  buyerServiceFeeUsdCents,
} from "@/lib/fees";

// ---------------------------------------------------------------- HS / duty

/** Representative US HTS chapter + simplified MFN duty rate per category. */
type CategoryCustoms = {
  hsCode: string;
  hsChapter: string;
  /** Duty rate as fraction (0.065 = 6.5%). */
  usDutyRate: number;
  note: string;
};

const CATEGORY_TABLE: Record<string, CategoryCustoms> = {
  handicrafts: {
    hsCode: "4602.11",
    hsChapter: "46 — Manufactures of plaiting/straw/basketwork",
    usDutyRate: 0.035,
    note: "Estimate; exact classification depends on material and craft type.",
  },
  textiles: {
    hsCode: "6304.99",
    hsChapter: "63 — Other made-up textile articles",
    usDutyRate: 0.065,
    note: "Estimate for woven decorative textiles; apparel falls under separate sub-chapters.",
  },
  jewelry: {
    hsCode: "7113.19",
    hsChapter: "71 — Articles of jewellery and parts thereof",
    usDutyRate: 0.055,
    note: "Estimate for non-precious-metal-mounted articles; precious stones vary.",
  },
};

const DEFAULT_CUSTOMS: CategoryCustoms = {
  hsCode: "9999.00",
  hsChapter: "Other",
  usDutyRate: 0.05,
  note: "Default estimate when category is unmapped.",
};

export function categoryCustoms(categorySlug: string): CategoryCustoms {
  return CATEGORY_TABLE[categorySlug.toLowerCase()] ?? DEFAULT_CUSTOMS;
}

// ---------------------------------------------------------------- duty calc

/**
 * Estimate US import duty for one line item.
 * Duty applies only to US-bound shipments. Non-US destinations return 0.
 */
export function estimateDutyUsdCents(
  category: string,
  itemSubtotalUsdCents: number,
  destinationCountry: string,
): number {
  if (destinationCountry.toUpperCase() !== "US") return 0;
  if (itemSubtotalUsdCents <= 0) return 0;
  const rate = categoryCustoms(category).usDutyRate;
  return Math.round(itemSubtotalUsdCents * rate);
}

// ---------------------------------------------------------------- landed cost

export type LandedItem = {
  /** Category slug, e.g. "textiles". */
  category: string;
  /** qty × unit price, in USD cents. */
  lineSubtotalUsdCents: number;
};

export type LandedBreakdown = {
  subtotalUsdCents: number;
  shippingUsdCents: number;
  dutyUsdCents: number;
  serviceUsdCents: number;
  totalUsdCents: number;
  /** Per-line duty detail so the buyer can see why the number is what it is. */
  lines: Array<{
    category: string;
    hsCode: string;
    rate: number;
    lineSubtotalUsdCents: number;
    lineDutyUsdCents: number;
  }>;
  destinationCountry: string;
  /** True when at least one line is US-bound and incurred non-zero duty. */
  dutyApplied: boolean;
};

/**
 * Compute the landed cost for a set of items being shipped to a destination.
 * Shipping is the flat MVP rate (Module 4); service fee comes from src/lib/fees.ts.
 */
export function estimateLanded(
  items: LandedItem[],
  destinationCountry: string,
): LandedBreakdown {
  const lines = items.map((it) => {
    const cat = categoryCustoms(it.category);
    const lineDuty = estimateDutyUsdCents(
      it.category,
      it.lineSubtotalUsdCents,
      destinationCountry,
    );
    return {
      category: it.category,
      hsCode: cat.hsCode,
      rate: cat.usDutyRate,
      lineSubtotalUsdCents: it.lineSubtotalUsdCents,
      lineDutyUsdCents: lineDuty,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineSubtotalUsdCents, 0);
  const shipping = flatShippingUsdCents();
  const duty = lines.reduce((s, l) => s + l.lineDutyUsdCents, 0);
  const service = buyerServiceFeeUsdCents(subtotal);
  const total = subtotal + shipping + duty + service;

  return {
    subtotalUsdCents: subtotal,
    shippingUsdCents: shipping,
    dutyUsdCents: duty,
    serviceUsdCents: service,
    totalUsdCents: total,
    lines,
    destinationCountry: destinationCountry.toUpperCase(),
    dutyApplied: duty > 0,
  };
}

// ---------------------------------------------------------------- DDP toggle

/**
 * Whether the order ships under Delivered-Duty-Paid (we collect + remit duty
 * upfront via the carrier, no surprise charge to the buyer). MVP: ALWAYS DDP
 * for US-bound — Shiprocket X / DHL DDP services this. Non-US: not applicable.
 */
export function isDdp(destinationCountry: string): boolean {
  return destinationCountry.toUpperCase() === "US";
}
