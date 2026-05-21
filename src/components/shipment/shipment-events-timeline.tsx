// Server-safe events timeline for a shipment. Renders the parsed events
// array in chronological order with status pills. Empty state when there
// are no events yet (e.g. label freshly issued).

import type { ShipmentEvent } from "@/lib/shipments";
import { OrderStatusPill } from "@/components/orders/order-status-pill";

export function ShipmentEventsTimeline({ events }: { events: ShipmentEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tracking events yet. We&apos;ll update this as the carrier scans
        your package.
      </p>
    );
  }

  // Newest first for readability.
  const ordered = [...events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <ol className="space-y-4">
      {ordered.map((ev, i) => {
        const when = new Date(ev.at);
        return (
          <li key={`${ev.at}-${i}`} className="flex items-start gap-3">
            <div
              className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusPill value={ev.status} />
                <span className="text-xs text-muted-foreground">
                  {when.toLocaleString()}
                </span>
              </div>
              {ev.note ? (
                <p className="mt-1 text-sm text-muted-foreground">{ev.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
