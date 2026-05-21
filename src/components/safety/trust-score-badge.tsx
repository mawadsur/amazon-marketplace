// TrustScoreBadge — numeric 0-100 Trust Engine score (D6) shown alongside the
// VerificationBadge tier. Color coded so it scans in one glance.

import { cn } from "@/lib/utils";

function toneFor(score: number): string {
  if (score >= 80) return "bg-amber-50 text-amber-900 border-amber-200";
  if (score >= 50) return "bg-green-50 text-green-800 border-green-200";
  if (score >= 30) return "bg-blue-50 text-blue-800 border-blue-200";
  return "bg-muted text-muted-foreground border-transparent";
}

export function TrustScoreBadge({
  score,
  className,
  title = "Trust Engine score: KYC + reviews + dispute rate + sales velocity + tenure",
}: {
  score: number;
  className?: string;
  title?: string;
}) {
  const tone = toneFor(score);
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-baseline gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <span className="text-[10px] uppercase tracking-wide opacity-70">Trust</span>
      <span className="tabular-nums">{score}</span>
      <span className="text-[10px] opacity-70">/100</span>
    </span>
  );
}
