// /track/[trackingNumber] — public tracking page. No auth required; the
// tracking number itself is the capability token (linkable from email).
// Renders an empty state when the tracking number is unknown, so stale
// links don't 404.

import Link from "next/link";
import {
  getShipmentByTrackingNumber,
  parseShipmentEvents,
} from "@/lib/shipments";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { ShipmentEventsTimeline } from "@/components/shipment/shipment-events-timeline";

export const dynamic = "force-dynamic";

export default async function PublicTrackingPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;
  const decoded = decodeURIComponent(trackingNumber);
  const shipment = await getShipmentByTrackingNumber(decoded);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Tracking
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {decoded}
      </h1>

      {!shipment ? (
        <div className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">No shipment found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t find a shipment for this tracking number. It may
            be too new, or the number may be incorrect.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            Return home
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <OrderStatusPill value={shipment.status} />
            <span className="text-xs text-muted-foreground">
              Carrier {shipment.carrier}
            </span>
            {shipment.estimatedDelivery ? (
              <span className="text-xs text-muted-foreground">
                ETA {new Date(shipment.estimatedDelivery).toLocaleDateString()}
              </span>
            ) : null}
          </div>

          <section className="mt-8 rounded-lg border bg-card p-6">
            <h2 className="text-base font-semibold">Tracking events</h2>
            <div className="mt-4">
              <ShipmentEventsTimeline
                events={parseShipmentEvents(shipment.events)}
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
