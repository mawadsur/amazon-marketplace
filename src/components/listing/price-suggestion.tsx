"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Position = "below" | "in_range" | "above" | "unknown";

type Suggestion = {
  recommendedUsdCents: number;
  marketLowUsdCents: number;
  marketHighUsdCents: number;
  sampleSize: number;
  confidence: number;
  rationale: string;
  aiAssisted: boolean;
};

interface Props {
  productId: string;
  currentPriceUsd: string; // dollar string from the form
  onApply: (priceUsd: string) => void;
}

function fmt(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function positionFor(currentCents: number, s: Suggestion): Position {
  if (s.sampleSize < 5) return "unknown";
  if (currentCents < s.marketLowUsdCents) return "below";
  if (currentCents > s.marketHighUsdCents) return "above";
  return "in_range";
}

function positionLabel(p: Position): { label: string; tone: string } {
  switch (p) {
    case "below":
      return { label: "Below market", tone: "text-amber-700 bg-amber-50 border-amber-200" };
    case "above":
      return { label: "Above market", tone: "text-red-700 bg-red-50 border-red-200" };
    case "in_range":
      return { label: "In market range", tone: "text-green-700 bg-green-50 border-green-200" };
    case "unknown":
      return { label: "Limited data", tone: "text-muted-foreground bg-muted border-border" };
  }
}

export function PriceSuggestion({ productId, currentPriceUsd, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  async function fetchSuggestion() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/pricing-suggestion`);
      if (!res.ok) throw new Error(`Suggestion failed (${res.status})`);
      const data = (await res.json()) as { suggestion: Suggestion };
      setSuggestion(data.suggestion);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const currentCents = Math.round((parseFloat(currentPriceUsd) || 0) * 100);
  const position = suggestion ? positionFor(currentCents, suggestion) : null;
  const positionInfo = position ? positionLabel(position) : null;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">AI price recommendation</p>
          <p className="text-xs text-muted-foreground">
            Based on category benchmarks + comparable products sold in the last 90 days.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchSuggestion}
          disabled={loading}
        >
          {loading ? "Analyzing…" : suggestion ? "Refresh" : "Get suggestion"}
        </Button>
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      {suggestion ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Recommended</p>
              <p className="text-2xl font-semibold">{fmt(suggestion.recommendedUsdCents)}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                Market range: {fmt(suggestion.marketLowUsdCents)}
                {" – "}
                {fmt(suggestion.marketHighUsdCents)}
              </p>
              <p className="text-xs">
                {suggestion.sampleSize >= 5
                  ? `${suggestion.sampleSize} comparables · `
                  : "Category benchmark · "}
                Confidence {suggestion.confidence}/10
                {suggestion.aiAssisted ? " · AI-shaped" : ""}
              </p>
            </div>
            {positionInfo ? (
              <span
                className={cn(
                  "ml-auto rounded-full border px-2 py-0.5 text-xs font-medium",
                  positionInfo.tone,
                )}
              >
                Your price: {positionInfo.label}
              </span>
            ) : null}
          </div>

          <p className="text-sm">{suggestion.rationale}</p>

          <Button
            type="button"
            size="sm"
            onClick={() => onApply((suggestion.recommendedUsdCents / 100).toFixed(2))}
          >
            Use {fmt(suggestion.recommendedUsdCents)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
