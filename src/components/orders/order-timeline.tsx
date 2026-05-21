// Lightweight order-status timeline. Steps that have an associated
// timestamp render filled; future steps render muted. Server-safe.

import { cn } from "@/lib/utils";

export type TimelineInput = {
  placedAt: Date | null;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
};

const STEPS: { key: keyof TimelineInput; label: string }[] = [
  { key: "placedAt", label: "Placed" },
  { key: "paidAt", label: "Paid" },
  { key: "shippedAt", label: "Shipped" },
  { key: "deliveredAt", label: "Delivered" },
  { key: "completedAt", label: "Completed" },
];

export function OrderTimeline({ input }: { input: TimelineInput }) {
  if (input.cancelledAt) {
    return (
      <p className="text-sm text-muted-foreground">
        Cancelled on {input.cancelledAt.toLocaleString()}
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {STEPS.map((step, i) => {
        const ts = input[step.key];
        const done = !!ts;
        return (
          <li key={step.key} className="flex items-start gap-3">
            <div
              className={cn(
                "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                done ? "bg-primary" : "bg-muted-foreground/30",
              )}
              aria-hidden
            />
            <div className="flex-1">
              <div
                className={cn(
                  "text-sm font-medium",
                  done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {ts ? ts.toLocaleString() : i === firstPendingIndex(input) ? "Up next" : "—"}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function firstPendingIndex(input: TimelineInput): number {
  const order: (keyof TimelineInput)[] = [
    "placedAt",
    "paidAt",
    "shippedAt",
    "deliveredAt",
    "completedAt",
  ];
  for (let i = 0; i < order.length; i++) {
    if (!input[order[i]]) return i;
  }
  return -1;
}
