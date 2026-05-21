// Backwards-compatible wrapper around the Trust Engine (D6).
//
// All callers (onboarding.ts, admin.ts) still call `applyBadgeNow(shopId)`.
// Under the hood it now runs the full trust-score recompute and writes both
// `Shop.trustScore` and `Shop.badge`. The legacy `computeBadge()` pure helper
// is kept for tests but routes through the new engine.

import type { VerificationBadge } from "@prisma/client";
import {
  applyTrustScoreNow,
  computeTrustScore,
  recomputeTrustScore,
} from "@/lib/trust-score";

export type BadgeInputs = {
  shopStatus: "PENDING_REVIEW" | "APPROVED" | "SUSPENDED" | "REJECTED";
  kycStatus: "NOT_SUBMITTED" | "SUBMITTED" | "VERIFIED" | "REJECTED" | null;
  reviewCount: number;
  averageRating: number;
};

/** Legacy pure-rule entry point. Now derives the tier from the full trust
 * score with zero disputes/sales/tenure assumed (the minimal information set
 * the old caller had). New code should use `computeTrustScore` directly. */
export function computeBadge(inputs: BadgeInputs): VerificationBadge {
  return computeTrustScore({
    ...inputs,
    disputeCount: 0,
    orderCount: 0,
    daysSinceApproved: 0,
  }).tier;
}

export async function recomputeShopBadge(shopId: string): Promise<VerificationBadge> {
  const result = await recomputeTrustScore(shopId);
  return result.tier;
}

export async function applyBadgeNow(shopId: string): Promise<VerificationBadge> {
  const result = await applyTrustScoreNow(shopId);
  return result.tier;
}
