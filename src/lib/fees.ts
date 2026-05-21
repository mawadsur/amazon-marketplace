// Fee + shipping math. Pure functions only — no DB, no I/O.
// All inputs/outputs are integer USD cents. Keep these tiny and obvious.

const PLATFORM_FEE_BPS = 1000; // 10% in basis points
const FLAT_SHIPPING_USD_CENTS = 999; // $9.99 MVP flat rate

/** Platform commission charged to the seller payout, in USD cents (10% of subtotal). */
export function platformFeeUsdCents(subtotalUsdCents: number): number {
  if (subtotalUsdCents <= 0) return 0;
  return Math.round((subtotalUsdCents * PLATFORM_FEE_BPS) / 10_000);
}

/** Flat shipping fee charged to the buyer at checkout (MVP). */
export function flatShippingUsdCents(): number {
  return FLAT_SHIPPING_USD_CENTS;
}

/** Buyer-facing total = subtotal + shipping + buyer-side fees (none for MVP). */
export function totalUsdCents(subtotalUsdCents: number): number {
  return subtotalUsdCents + flatShippingUsdCents();
}

/** Seller's net for a shop subtotal (subtotal − platform fee), in USD cents. */
export function shopNetUsdCents(shopSubtotalUsdCents: number): number {
  return Math.max(0, shopSubtotalUsdCents - platformFeeUsdCents(shopSubtotalUsdCents));
}
