import { describe, expect, it } from "vitest";
import { computeTrustScore } from "@/lib/trust-score";
import { tierForScore, effectiveTier, parseTierParam } from "@/lib/tiers";

const baseInputs = {
  shopStatus: "PENDING_REVIEW" as const,
  kycStatus: null,
  reviewCount: 0,
  averageRating: 0,
  disputeCount: 0,
  orderCount: 0,
  daysSinceApproved: 0,
};

describe("computeTrustScore", () => {
  it("returns 0/NONE for suspended shops", () => {
    const r = computeTrustScore({ ...baseInputs, shopStatus: "SUSPENDED" });
    expect(r.score).toBe(0);
    expect(r.tier).toBe("NONE");
  });

  it("returns 0/NONE for rejected shops", () => {
    const r = computeTrustScore({ ...baseInputs, shopStatus: "REJECTED" });
    expect(r.score).toBe(0);
    expect(r.tier).toBe("NONE");
  });

  it("scores APPROVED + KYC VERIFIED at 50/VERIFIED with no other signal", () => {
    const r = computeTrustScore({
      ...baseInputs,
      shopStatus: "APPROVED",
      kycStatus: "VERIFIED",
    });
    expect(r.score).toBe(50);
    expect(r.tier).toBe("VERIFIED");
  });

  it("only awards KYC + approval when both are true", () => {
    const onlyKyc = computeTrustScore({ ...baseInputs, kycStatus: "VERIFIED" });
    expect(onlyKyc.score).toBe(25);
    expect(onlyKyc.tier).toBe("NEW");

    const onlyApproved = computeTrustScore({
      ...baseInputs,
      shopStatus: "APPROVED",
    });
    expect(onlyApproved.score).toBe(25);
  });

  it("adds review weight scaled by count", () => {
    const fiveReviews = computeTrustScore({
      ...baseInputs,
      shopStatus: "APPROVED",
      kycStatus: "VERIFIED",
      reviewCount: 5,
      averageRating: 4.8,
    });
    // 25 + 25 + (4.8 * 4 * 0.5) = 50 + 10 = 60
    expect(fiveReviews.score).toBe(60);

    const tenReviewsHighRated = computeTrustScore({
      ...baseInputs,
      shopStatus: "APPROVED",
      kycStatus: "VERIFIED",
      reviewCount: 12,
      averageRating: 4.8,
    });
    // 25 + 25 + (4.8 * 4 * 1.0) = 50 + 19 (rounded) = 69
    expect(tenReviewsHighRated.score).toBeGreaterThanOrEqual(68);
  });

  it("penalizes disputes", () => {
    const r = computeTrustScore({
      ...baseInputs,
      shopStatus: "APPROVED",
      kycStatus: "VERIFIED",
      disputeCount: 2,
    });
    // 50 - 20 (2 disputes × 10) = 30
    expect(r.score).toBe(30);
  });

  it("caps the dispute penalty at -25", () => {
    const r = computeTrustScore({
      ...baseInputs,
      shopStatus: "APPROVED",
      kycStatus: "VERIFIED",
      disputeCount: 10,
    });
    // 50 - 25 (capped) = 25
    expect(r.score).toBe(25);
  });

  it("crosses into TOP_RATED with sustained signal", () => {
    const r = computeTrustScore({
      ...baseInputs,
      shopStatus: "APPROVED",
      kycStatus: "VERIFIED",
      reviewCount: 20,
      averageRating: 4.9,
      orderCount: 50,
      daysSinceApproved: 120,
    });
    // 25 + 25 + 19.6→20 + 20 (sales capped) + 10 (tenure 90+) = 100 (capped)
    expect(r.score).toBe(100);
    expect(r.tier).toBe("TOP_RATED");
  });
});

describe("tierForScore", () => {
  it("maps scores to quality tiers", () => {
    expect(tierForScore(90)).toBe("VIP");
    expect(tierForScore(85)).toBe("VIP");
    expect(tierForScore(70)).toBe("APLUS");
    expect(tierForScore(69)).toBe("BPLUS");
    expect(tierForScore(50)).toBe("BPLUS");
    expect(tierForScore(49)).toBe("STANDARD");
    expect(tierForScore(0)).toBe("STANDARD");
  });
});

describe("effectiveTier", () => {
  it("derives from the score by default", () => {
    expect(effectiveTier({ trustScore: 72 })).toBe("APLUS");
    expect(effectiveTier({ trustScore: 55, manualTier: null })).toBe("BPLUS");
  });

  it("lets a valid manual override win", () => {
    expect(effectiveTier({ trustScore: 55, manualTier: "VIP" })).toBe("VIP");
  });

  it("ignores an invalid manual override", () => {
    expect(effectiveTier({ trustScore: 72, manualTier: "GOLD" })).toBe("APLUS");
  });
});

describe("parseTierParam", () => {
  it("parses tier query values", () => {
    expect(parseTierParam("vip")).toBe("VIP");
    expect(parseTierParam("aplus")).toBe("APLUS");
    expect(parseTierParam("b+")).toBe("BPLUS");
    expect(parseTierParam("nonsense")).toBeNull();
    expect(parseTierParam(undefined)).toBeNull();
  });
});
