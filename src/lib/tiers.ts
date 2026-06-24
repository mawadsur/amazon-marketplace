// Pure quality-tier helpers — NO server-only imports (no prisma, no env), so
// this is safe to import from client components (cards, the concierge drawer)
// as well as server code. The DB-backed recompute lives in src/lib/trust-score.ts.
//
// A buyer-facing quality tier layered on the 0-100 trust score. The marketplace
// is curated: buyers only ever see B+ and above as a positive badge — STANDARD
// (below the bar) renders nothing, so there is no "C/D" label shown to buyers.

export type QualityTier = "VIP" | "APLUS" | "BPLUS" | "STANDARD";

/** Below this score, products can be hidden from buyer browse (off by default). */
export const MIN_BUYER_VISIBLE_SCORE = 0;

const QUALITY_TIERS: QualityTier[] = ["VIP", "APLUS", "BPLUS", "STANDARD"];

/**
 * Map a trust score to a quality tier.
 *   ≥ 85 → VIP    (sustained reviews + sales + tenure + KYC)
 *   ≥ 70 → A+
 *   ≥ 50 → B+     (an APPROVED + KYC-verified shop lands here — the floor)
 *   else → STANDARD (not surfaced as a positive tier)
 */
export function tierForScore(score: number): QualityTier {
  if (score >= 85) return "VIP";
  if (score >= 70) return "APLUS";
  if (score >= 50) return "BPLUS";
  return "STANDARD";
}

/**
 * Effective tier for a shop: an admin's manual override wins, otherwise the
 * score-derived tier. Accepts the minimal shop shape so callers can pass a
 * narrow `select`.
 */
export function effectiveTier(shop: {
  trustScore: number;
  manualTier?: string | null;
}): QualityTier {
  if (shop.manualTier && (QUALITY_TIERS as string[]).includes(shop.manualTier)) {
    return shop.manualTier as QualityTier;
  }
  return tierForScore(shop.trustScore);
}

/** Minimum trust score for a tier — translates a `?tier=` filter into a score floor. */
export function minScoreForTier(tier: QualityTier): number {
  switch (tier) {
    case "VIP":
      return 85;
    case "APLUS":
      return 70;
    case "BPLUS":
      return 50;
    default:
      return 0;
  }
}

/** Parse a `?tier=` query value into a QualityTier (or null if unrecognized). */
export function parseTierParam(raw: string | undefined | null): QualityTier | null {
  if (!raw) return null;
  const up = raw.toUpperCase();
  const map: Record<string, QualityTier> = {
    VIP: "VIP",
    APLUS: "APLUS",
    "A+": "APLUS",
    BPLUS: "BPLUS",
    "B+": "BPLUS",
  };
  return map[up] ?? null;
}
