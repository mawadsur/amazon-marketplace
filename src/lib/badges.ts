// Verification badge computation for shops.
//
// Pure rules (no I/O in `recomputeShopBadge` — it takes the shop+kyc+review
// aggregate and returns the badge). `applyBadgeNow(shopId)` does the I/O:
// fetches the relevant rows, computes the new badge, writes if it changed,
// and returns the resulting badge.

import { prisma } from "@/lib/db";
import type { VerificationBadge } from "@prisma/client";

export type BadgeInputs = {
  shopStatus: "PENDING_REVIEW" | "APPROVED" | "SUSPENDED" | "REJECTED";
  kycStatus: "NOT_SUBMITTED" | "SUBMITTED" | "VERIFIED" | "REJECTED" | null;
  reviewCount: number;
  averageRating: number; // 0 if no reviews
};

const TOP_RATED_MIN_REVIEWS = 10;
const TOP_RATED_MIN_AVG = 4.6;

/**
 * Pure rule:
 *   - NONE if shop is suspended or rejected.
 *   - TOP_RATED if APPROVED + KYC VERIFIED + ≥10 reviews + avg ≥ 4.6.
 *   - VERIFIED if APPROVED + KYC VERIFIED (regardless of review count).
 *   - NEW otherwise.
 */
export function computeBadge(inputs: BadgeInputs): VerificationBadge {
  if (inputs.shopStatus === "SUSPENDED" || inputs.shopStatus === "REJECTED") {
    return "NONE";
  }
  const verified =
    inputs.shopStatus === "APPROVED" && inputs.kycStatus === "VERIFIED";
  if (
    verified &&
    inputs.reviewCount >= TOP_RATED_MIN_REVIEWS &&
    inputs.averageRating >= TOP_RATED_MIN_AVG
  ) {
    return "TOP_RATED";
  }
  if (verified) return "VERIFIED";
  return "NEW";
}

/**
 * Load the shop + its KYC + review aggregate over all the shop's products and
 * compute the badge. Returns the badge (does NOT write).
 */
export async function recomputeShopBadge(shopId: string): Promise<VerificationBadge> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      status: true,
      kyc: { select: { status: true } },
      products: { select: { id: true } },
    },
  });
  if (!shop) throw new Error("SHOP_NOT_FOUND");

  const productIds = shop.products.map((p) => p.id);
  let reviewCount = 0;
  let averageRating = 0;
  if (productIds.length > 0) {
    const agg = await prisma.review.aggregate({
      where: { productId: { in: productIds } },
      _count: { _all: true },
      _avg: { rating: true },
    });
    reviewCount = agg._count._all;
    averageRating = agg._avg.rating ?? 0;
  }

  return computeBadge({
    shopStatus: shop.status,
    kycStatus: shop.kyc?.status ?? null,
    reviewCount,
    averageRating,
  });
}

/**
 * Recompute + persist the badge on the Shop row. Returns the badge that was
 * written (or already in place). Safe to call repeatedly.
 */
export async function applyBadgeNow(shopId: string): Promise<VerificationBadge> {
  const badge = await recomputeShopBadge(shopId);
  await prisma.shop.update({
    where: { id: shopId },
    data: { badge },
  });
  return badge;
}
