// TierBadge — buyer-facing seller quality tier (A+ VIP / A+ / B+). Layered on
// the 0-100 trust score via tierForScore/effectiveTier. STANDARD renders nothing
// so the marketplace reads as quality-curated (no "C/D" labels shown to buyers).

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QualityTier } from "@/lib/tiers";

const TIER_META: Record<
  QualityTier,
  { label: string; className: string; crown?: boolean }
> = {
  VIP: {
    label: "A+ VIP",
    className: "bg-secondary/15 text-secondary border-secondary/30",
    crown: true,
  },
  APLUS: {
    label: "A+ Seller",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  BPLUS: {
    label: "B+ Seller",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  STANDARD: { label: "", className: "" },
};

export function TierBadge({
  tier,
  className,
  /** When true (default), STANDARD renders nothing. */
  hideIfStandard = true,
}: {
  tier: QualityTier;
  className?: string;
  hideIfStandard?: boolean;
}) {
  if (tier === "STANDARD" && hideIfStandard) return null;
  const meta = TIER_META[tier];
  if (!meta.label) return null;
  return (
    <span
      title={`${meta.label} — quality tier from the Trust Engine`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {meta.crown ? <Crown className="h-3 w-3" aria-hidden /> : null}
      <span>{meta.label}</span>
    </span>
  );
}
