// Tone-tinted pill for DisputeStatus values. Mirrors admin/status-pill.tsx
// styling so the buyer and admin surfaces feel consistent.

import { cn } from "@/lib/utils";
import type { DisputeStatus } from "@prisma/client";

type Tone = "neutral" | "info" | "success" | "warn" | "danger";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warn: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
};

const TONES: Record<DisputeStatus, Tone> = {
  OPEN: "warn",
  UNDER_REVIEW: "info",
  RESOLVED_BUYER: "success",
  RESOLVED_SELLER: "success",
  CANCELLED: "neutral",
};

const LABELS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  RESOLVED_BUYER: "Resolved · buyer",
  RESOLVED_SELLER: "Resolved · seller",
  CANCELLED: "Cancelled",
};

export function DisputeStatusPill({
  value,
  className,
}: {
  value: DisputeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_STYLES[TONES[value]],
        className,
      )}
    >
      {LABELS[value]}
    </span>
  );
}
