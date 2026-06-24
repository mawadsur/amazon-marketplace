// Fee + shipping math. Pure functions only — no DB, no I/O.
// All inputs/outputs are integer USD cents. Keep these tiny and obvious.
//
// Fee model: a single flat 10% service charge is added at checkout (buyer-facing,
// shown as its own line). Sellers net their EXACT listed price — no deduction.
// Platform revenue = the 10% service charge collected from the buyer.

const SERVICE_CHARGE_BPS = 1000; // 10% in basis points — the one and only platform fee
const FLAT_SHIPPING_USD_CENTS = 999; // $9.99 MVP flat rate

/**
 * Buyer-facing service charge at checkout, in USD cents. Flat 10% of subtotal,
 * no minimum floor. This is the platform's entire cut (sellers are not deducted).
 */
export function serviceChargeUsdCents(subtotalUsdCents: number): number {
  if (subtotalUsdCents <= 0) return 0;
  return Math.round((subtotalUsdCents * SERVICE_CHARGE_BPS) / 10_000);
}

/** Flat shipping fee charged to the buyer at checkout (MVP). */
export function flatShippingUsdCents(): number {
  return FLAT_SHIPPING_USD_CENTS;
}

/**
 * Simple subtotal+shipping total (legacy — kept for code paths that don't yet
 * use the customs landed-cost calc). New code paths should call
 * `estimateLanded()` from src/lib/customs.ts which includes duty + service charge.
 */
export function totalUsdCents(subtotalUsdCents: number): number {
  return subtotalUsdCents + flatShippingUsdCents();
}

/**
 * Seller's net for a shop subtotal, in USD cents. The seller is paid their full
 * listed price — the platform fee is collected from the buyer at checkout, not
 * deducted here. (Kept as a function so payout code reads intentionally.)
 */
export function shopNetUsdCents(shopSubtotalUsdCents: number): number {
  return Math.max(0, shopSubtotalUsdCents);
}
