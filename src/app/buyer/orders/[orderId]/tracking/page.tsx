// /buyer/orders/[orderId]/tracking — buyer's read-only view of the
// shipment tied to one of their orders. Mirrors the seller shipment page
// but omits the dev "advance" control. The buyer's auth is checked via
// getOrderForBuyer so a stale link can't leak someone else's tracking.

import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { auth } from "@/lib/auth";
import { getOrderForBuyer } from "@/lib/orders";
import {
  getShipmentByOrderId,
  parseShipmentEvents,
} from "@/lib/shipments";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { ShipmentEventsTimeline } from "@/components/shipment/shipment-events-timeline";
import { TrackingLink } from "@/components/shipment/tracking-link";

export const dynamic = "force-dynamic";

export default async function BuyerTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/sign-in?next=${encodeURIComponent(
        `/buyer/orders/${orderId}/tracking`,
      )}`,
    );
  }

  const order = await getOrderForBuyer(session.user.id, orderId);
  if (!order) {
    return (
      <>
        <MarketplaceNav />
        <main className="container mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <Link href="/buyer/orders" className="mt-4 inline-block underline">
            Back to orders
          </Link>
        </main>
      </>
    );
  }

  const shipment = await getShipmentByOrderId(order.id);

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tracking for order #{order.id.slice(-8)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Shipment
            </h1>
          </div>
          <Link href={`/buyer/orders/${order.id}`} className="text-sm underline">
            Back to order
          </Link>
        </div>

        {!shipment ? (
          <div className="mt-8 rounded-lg border bg-card p-6">
            <h2 className="text-base font-semibold">Not shipped yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The seller hasn&apos;t generated a shipping label yet. We&apos;ll
              update this page as soon as your package is on its way.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <div className="flex flex-wrap items-center gap-3">
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

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tracking number
                  </dt>
                  <dd className="mt-1">
                    {shipment.trackingNumber ? (
                      <TrackingLink trackingNumber={shipment.trackingNumber} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {shipment.status === "DELIVERED"
                      ? "Delivered. Enjoy!"
                      : "On its way."}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border bg-card p-6">
              <h2 className="text-base font-semibold">Events</h2>
              <div className="mt-4">
                <ShipmentEventsTimeline
                  events={parseShipmentEvents(shipment.events)}
                />
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
