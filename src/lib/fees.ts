// Fee + shipping math. Pure functions only — no DB, no I/O.
// All inputs/outputs are integer USD cents. Keep these tiny and obvious.

const PLATFORM_FEE_BPS = 1000; // 10% in basis points (seller-side commission)
const BUYER_SERVICE_FEE_BPS = 400; // 4% in basis points (buyer-side service fee)
const BUYER_SERVICE_FEE_MIN_CENTS = 199; // $1.99 floor
const FLAT_SHIPPING_USD_CENTS = 999; // $9.99 MVP flat rate

/** Platform commission charged to the seller payout, in USD cents (10% of subtotal). */
export function platformFeeUsdCents(subtotalUsdCents: number): number {
  if (subtotalUsdCents <= 0) return 0;
  return Math.round((subtotalUsdCents * PLATFORM_FEE_BPS) / 10_000);
}

/** Buyer-side service fee at checkout, in USD cents. 4% with a $1.99 floor. */
export function buyerServiceFeeUsdCents(subtotalUsdCents: number): number {
  if (subtotalUsdCents <= 0) return 0;
  const pct = Math.round((subtotalUsdCents * BUYER_SERVICE_FEE_BPS) / 10_000);
  return Math.max(BUYER_SERVICE_FEE_MIN_CENTS, pct);
}

/** Flat shipping fee charged to the buyer at checkout (MVP). */
export function flatShippingUsdCents(): number {
  return FLAT_SHIPPING_USD_CENTS;
}

/**
 * Simple subtotal+shipping total (legacy — kept for code paths that don't yet
 * use the customs landed-cost calc). New code paths should call
 * `estimateLanded()` from src/lib/customs.ts which includes duty + service fee.
 */
export function totalUsdCents(subtotalUsdCents: number): number {
  return subtotalUsdCents + flatShippingUsdCents();
}

/** Seller's net for a shop subtotal (subtotal − platform fee), in USD cents. */
export function shopNetUsdCents(shopSubtotalUsdCents: number): number {
  return Math.max(0, shopSubtotalUsdCents - platformFeeUsdCents(shopSubtotalUsdCents));
}
