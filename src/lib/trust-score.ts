// Trust Engine (D6). Dynamic 0-100 score per shop, recomputed from real signals.
//
// Replaces the static four-tier badge with a continuous score. The tier
// (NONE / NEW / VERIFIED / TOP_RATED) is now derived from the score so existing
// badge UIs keep working without changes.

import { prisma } from "@/lib/db";
import type { VerificationBadge } from "@prisma/client";

export type TrustInputs = {
  shopStatus: "PENDING_REVIEW" | "APPROVED" | "SUSPENDED" | "REJECTED";
  kycStatus: "NOT_SUBMITTED" | "SUBMITTED" | "VERIFIED" | "REJECTED" | null;
  reviewCount: number;
  averageRating: number; // 0 if no reviews
  /** Total disputes opened against this shop's orders. */
  disputeCount: number;
  /** Number of paid orders involving this shop. */
  orderCount: number;
  /** Days since shop was approved. 0 if not approved yet. */
  daysSinceApproved: number;
};

export type TrustBreakdown = {
  kyc: number;
  approval: number;
  reviews: number;
  disputes: number;
  sales: number;
  tenure: number;
};

export type TrustResult = {
  score: number; // 0-100
  tier: VerificationBadge;
  breakdown: TrustBreakdown;
};

const MAX_REVIEW_SCALE_COUNT = 10;
const MAX_DISPUTE_PENALTY = -25;
const PER_DISPUTE_PENALTY = -10;
const MAX_SALES_BONUS = 20;
const PER_ORDER_BONUS = 1;

/**
 * Pure rule:
 *   - Suspended/Rejected shop → score 0, tier NONE.
 *   - Otherwise: sum components below, clamp 0-100.
 *
 * Components (max 100):
 *   - kyc      : 25  if KYC.VERIFIED, else 0
 *   - approval : 25  if Shop.APPROVED, else 0
 *   - reviews  : up to 20 (averageRating × 4, scaled by min(count/10, 1))
 *   - disputes : up to -25 (-10 per dispute, capped)
 *   - sales    : up to +20 (+1 per paid order, capped)
 *   - tenure   : +5 at 30 days approved, +10 at 90+ days
 *
 * Tier mapping:
 *   ≥ 80 → TOP_RATED
 *   ≥ 50 → VERIFIED
 *   ≥ 30 → NEW
 *   else  → NONE
 */
export function computeTrustScore(inputs: TrustInputs): TrustResult {
  if (inputs.shopStatus === "SUSPENDED" || inputs.shopStatus === "REJECTED") {
    return {
      score: 0,
      tier: "NONE",
      breakdown: { kyc: 0, approval: 0, reviews: 0, disputes: 0, sales: 0, tenure: 0 },
    };
  }

  const kyc = inputs.kycStatus === "VERIFIED" ? 25 : 0;
  const approval = inputs.shopStatus === "APPROVED" ? 25 : 0;

  const reviewScale = Math.min(inputs.reviewCount / MAX_REVIEW_SCALE_COUNT, 1);
  const reviews = Math.round(inputs.averageRating * 4 * reviewScale);

  const disputes = Math.max(
    MAX_DISPUTE_PENALTY,
    inputs.disputeCount * PER_DISPUTE_PENALTY,
  );

  const sales = Math.min(MAX_SALES_BONUS, inputs.orderCount * PER_ORDER_BONUS);

  let tenure = 0;
  if (inputs.daysSinceApproved >= 90) tenure = 10;
  else if (inputs.daysSinceApproved >= 30) tenure = 5;

  const raw = kyc + approval + reviews + disputes + sales + tenure;
  const score = Math.max(0, Math.min(100, raw));

  let tier: VerificationBadge = "NONE";
  if (score >= 80) tier = "TOP_RATED";
  else if (score >= 50) tier = "VERIFIED";
  else if (score >= 30) tier = "NEW";

  return {
    score,
    tier,
    breakdown: { kyc, approval, reviews, disputes, sales, tenure },
  };
}

// ---------------------------------------------------------------- I/O

export async function recomputeTrustScore(shopId: string): Promise<TrustResult> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      status: true,
      approvedAt: true,
      kyc: { select: { status: true } },
      products: { select: { id: true } },
    },
  });
  if (!shop) throw new Error("SHOP_NOT_FOUND");

  const productIds = shop.products.map((p) => p.id);

  const [reviewAgg, disputeCount, orderCount] = await Promise.all([
    productIds.length > 0
      ? prisma.review.aggregate({
          where: { productId: { in: productIds } },
          _count: { _all: true },
          _avg: { rating: true },
        })
      : Promise.resolve({ _count: { _all: 0 }, _avg: { rating: 0 } }),
    // Disputes opened on orders that contain at least one of this shop's items.
    prisma.dispute.count({
      where: { order: { items: { some: { shopId } } } },
    }),
    // Paid order count for this shop.
    prisma.order.count({
      where: {
        items: { some: { shopId } },
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] },
      },
    }),
  ]);

  const daysSinceApproved = shop.approvedAt
    ? Math.max(0, Math.floor((Date.now() - shop.approvedAt.getTime()) / 86_400_000))
    : 0;

  return computeTrustScore({
    shopStatus: shop.status,
    kycStatus: shop.kyc?.status ?? null,
    reviewCount: reviewAgg._count._all,
    averageRating: reviewAgg._avg.rating ?? 0,
    disputeCount,
    orderCount,
    daysSinceApproved,
  });
}

/**
 * Recompute + persist both the score and the derived tier on the Shop row.
 * Safe to call repeatedly. Returns the resulting score + tier.
 */
export async function applyTrustScoreNow(shopId: string): Promise<TrustResult> {
  const result = await recomputeTrustScore(shopId);
  await prisma.shop.update({
    where: { id: shopId },
    data: { trustScore: result.score, badge: result.tier },
  });
  return result;
}
