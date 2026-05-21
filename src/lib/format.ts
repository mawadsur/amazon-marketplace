// Currency + display formatting helpers for buyer surfaces.
// Single source of truth — never inline currency math in components.

import { FX_USD_TO_INR } from "@/lib/stubs";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format integer USD cents as "$12.34". */
export function formatUsd(cents: number): string {
  return usdFormatter.format(cents / 100);
}

/** Format integer INR paise as "₹1,234". */
export function formatInr(paise: number): string {
  return inrFormatter.format(paise / 100);
}

/** "Approximate INR" display derived from USD cents via FX stub. */
export function approxInrFromUsdCents(usdCents: number): string {
  const inrRupees = (usdCents / 100) * FX_USD_TO_INR;
  return inrFormatter.format(inrRupees);
}

/** Format a 1..5 rating with one decimal, e.g. "4.3". */
export function formatRating(avg: number | null | undefined): string {
  if (avg == null || Number.isNaN(avg)) return "—";
  return avg.toFixed(1);
}
