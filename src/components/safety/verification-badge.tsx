// Small chip rendering a Shop's VerificationBadge value. Used on buyer
// surfaces (shop card, product detail, listings page) to convey trust.

import { cn } from "@/lib/utils";
import type { VerificationBadge as Badge } from "@prisma/client";

type Tone = "neutral" | "info" | "success" | "highlight";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-green-50 text-green-800 border-green-200",
  highlight: "bg-amber-50 text-amber-900 border-amber-200",
};

const BADGE_META: Record<Badge, { label: string; tone: Tone; icon: string }> = {
  NONE: { label: "Unverified", tone: "neutral", icon: "·" },
  NEW: { label: "New shop", tone: "info", icon: "✦" },
  VERIFIED: { label: "Verified", tone: "success", icon: "✓" },
  TOP_RATED: { label: "Top rated", tone: "highlight", icon: "★" },
};

export function VerificationBadge({
  value,
  className,
  /** When true, only render if the badge is meaningful (skip NONE). */
  hideIfNone,
}: {
  value: Badge;
  className?: string;
  hideIfNone?: boolean;
}) {
  if (hideIfNone && value === "NONE") return null;
  const meta = BADGE_META[value];
  return (
    <span
      title={meta.label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_STYLES[meta.tone],
        className,
      )}
    >
      <span aria-hidden>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}
