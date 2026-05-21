// Market-aware price recommendation for the seller draft editor (Module 2 / D8).
//
// Two strategies, tried in order:
//   1. If we have ≥5 published comparables in the same category, compute
//      median / p25 / p75 from real prices and surface as the market range.
//   2. Otherwise fall back to the category benchmark from src/lib/stubs.ts.
//
// When ANTHROPIC_API_KEY is set, Claude does the final synthesis (combining
// the comparables stats with product attributes for a sharper recommendation).
// Without it, we return the median directly with a low-confidence note.

import { prisma } from "@/lib/db";
import { generateText } from "@/lib/ai";
import { env } from "@/lib/env";

export type PriceSuggestionInput = {
  productId: string;
  category: string;
  title?: string | null;
  description?: string | null;
  attributes?: Record<string, unknown> | null;
};

export type PriceSuggestion = {
  recommendedUsdCents: number;
  marketLowUsdCents: number;
  marketHighUsdCents: number;
  sampleSize: number;
  /** 1..10 — how strongly we trust this recommendation. */
  confidence: number;
  rationale: string;
  /** Whether Claude shaped the recommendation or only the heuristic ran. */
  aiAssisted: boolean;
};

// ---------------------------------------------------------------- comparables

type Comparables = {
  median: number;
  p25: number;
  p75: number;
  n: number;
};

async function loadComparables(category: string, excludeProductId: string): Promise<Comparables> {
  const cat = await prisma.category.findUnique({ where: { slug: category.toLowerCase() } });
  if (!cat) return { median: 0, p25: 0, p75: 0, n: 0 };

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await prisma.product.findMany({
    where: {
      categoryId: cat.id,
      status: "PUBLISHED",
      publishedAt: { gte: since },
      id: { not: excludeProductId },
      priceUsdCents: { gt: 0 },
    },
    select: { priceUsdCents: true },
    orderBy: { priceUsdCents: "asc" },
    take: 200,
  });

  const prices = rows.map((r) => r.priceUsdCents);
  return {
    n: prices.length,
    median: percentile(prices, 0.5),
    p25: percentile(prices, 0.25),
    p75: percentile(prices, 0.75),
  };
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

// ---------------------------------------------------------------- fallback

const CATEGORY_BENCHMARKS: Record<string, { cents: number; spread: number }> = {
  handicrafts: { cents: 4500, spread: 0.4 },
  textiles: { cents: 6800, spread: 0.5 },
  jewelry: { cents: 8900, spread: 0.6 },
};

function benchmarkFallback(category: string): { recommended: number; low: number; high: number } {
  const bench = CATEGORY_BENCHMARKS[category.toLowerCase()] ?? { cents: 5000, spread: 0.5 };
  return {
    recommended: bench.cents,
    low: Math.round(bench.cents * (1 - bench.spread / 2)),
    high: Math.round(bench.cents * (1 + bench.spread / 2)),
  };
}

// ---------------------------------------------------------------- Claude polish

async function refineWithClaude(input: {
  category: string;
  title: string;
  description: string;
  attributes: Record<string, unknown>;
  comps: Comparables;
}): Promise<{ cents: number; rationale: string; confidence: number } | null> {
  if (!env.ANTHROPIC_API_KEY) return null;

  const sys = `You are a pricing analyst for a marketplace of authentic Indian goods sold to US buyers. You see product details + comparable prices and recommend a price. Output strict JSON only.`;

  const compsText =
    input.comps.n >= 5
      ? `Median $${(input.comps.median / 100).toFixed(2)}, p25 $${(input.comps.p25 / 100).toFixed(2)}, p75 $${(input.comps.p75 / 100).toFixed(2)}, sample size ${input.comps.n}.`
      : `Insufficient comparables — use category benchmark only.`;

  const prompt = `Category: ${input.category}
Title: ${input.title}
Description: ${input.description.slice(0, 500)}
Attributes: ${JSON.stringify(input.attributes).slice(0, 400)}

Comparables: ${compsText}

Return JSON: { "priceUsdCents": int, "rationale": "1-2 sentences explaining placement vs market", "confidence": int 1-10 }`;

  try {
    const { text } = await generateText({ system: sys, prompt, maxTokens: 400 });
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as {
      priceUsdCents?: unknown;
      rationale?: unknown;
      confidence?: unknown;
    };
    const cents = Math.round(Number(parsed.priceUsdCents));
    if (!Number.isFinite(cents) || cents <= 0) return null;
    return {
      cents,
      rationale: String(parsed.rationale ?? "AI recommendation."),
      confidence: Math.max(1, Math.min(10, Math.round(Number(parsed.confidence) || 5))),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- entry point

export async function recommendPrice(input: PriceSuggestionInput): Promise<PriceSuggestion> {
  const comps = await loadComparables(input.category, input.productId);
  const fallback = benchmarkFallback(input.category);

  const haveRealData = comps.n >= 5;
  const heuristicCents = haveRealData ? comps.median : fallback.recommended;
  const lowCents = haveRealData ? comps.p25 : fallback.low;
  const highCents = haveRealData ? comps.p75 : fallback.high;

  const refined = await refineWithClaude({
    category: input.category,
    title: input.title ?? "",
    description: input.description ?? "",
    attributes: input.attributes ?? {},
    comps,
  });

  if (refined) {
    return {
      recommendedUsdCents: refined.cents,
      marketLowUsdCents: lowCents,
      marketHighUsdCents: highCents,
      sampleSize: comps.n,
      confidence: refined.confidence,
      rationale: refined.rationale,
      aiAssisted: true,
    };
  }

  // Heuristic-only fallback
  const baseRationale = haveRealData
    ? `Median of ${comps.n} comparable ${input.category} items sold in the last 90 days.`
    : `Insufficient market data — using ${input.category} category benchmark.`;

  return {
    recommendedUsdCents: heuristicCents,
    marketLowUsdCents: lowCents,
    marketHighUsdCents: highCents,
    sampleSize: comps.n,
    confidence: haveRealData ? 6 : 3,
    rationale: baseRationale,
    aiAssisted: false,
  };
}

/**
 * Position label for a seller's current price vs market band.
 * - "below" = below p25
 * - "in_range" = within p25-p75
 * - "above" = above p75
 * - "unknown" = no real comparables
 */
export function positionLabel(
  currentCents: number,
  suggestion: PriceSuggestion,
): "below" | "in_range" | "above" | "unknown" {
  if (suggestion.sampleSize < 5) return "unknown";
  if (currentCents < suggestion.marketLowUsdCents) return "below";
  if (currentCents > suggestion.marketHighUsdCents) return "above";
  return "in_range";
}
