// /seller/orders/[orderId]/shipment — seller's shipment view for one order.
// Shows tracking number (linking to /track/[n]), label + customs PDF links,
// status pill, ETA, and the events timeline. Exposes the dev "advance"
// button so the seller can demo the full lifecycle by hand.

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderForSeller } from "@/lib/orders";
import {
  getShipmentByOrderId,
  parseShipmentEvents,
} from "@/lib/shipments";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { ShipmentEventsTimeline } from "@/components/shipment/shipment-events-timeline";
import { AdvanceShipmentButton } from "@/components/shipment/advance-shipment-button";
import { TrackingLink } from "@/components/shipment/tracking-link";

export const dynamic = "force-dynamic";

export default async function SellerShipmentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/sign-in?as=seller&callbackUrl=/seller/orders/${orderId}/shipment`,
    );
  }
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  const order = await getOrderForSeller(session.user.id, orderId);
  if (!order) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        <Link href="/seller/orders" className="mt-4 inline-block underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const shipment = await getShipmentByOrderId(order.id);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Shipment for order #{order.id.slice(-8)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Shipment details</h1>
        </div>
        <Link
          href={`/seller/orders/${order.id}`}
          className="text-sm underline"
        >
          Back to order
        </Link>
      </div>

      {!shipment ? (
        <div className="mt-8 rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">No shipment yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mark this order as shipped from the order page to create a label.
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
                  Documents
                </dt>
                <dd className="mt-1 flex flex-wrap gap-3 text-sm">
                  {shipment.labelUrl ? (
                    <a
                      href={shipment.labelUrl}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Shipping label (PDF)
                    </a>
                  ) : null}
                  {shipment.customsDocUrl ? (
                    <a
                      href={shipment.customsDocUrl}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Customs doc (PDF)
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>

            {shipment.status !== "DELIVERED" ? (
              <div className="mt-6 border-t pt-6">
                <AdvanceShipmentButton shipmentId={shipment.id} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Dev helper: advances one step in the lifecycle. In production
                  the carrier webhook drives these transitions automatically.
                </p>
              </div>
            ) : (
              <p className="mt-6 border-t pt-6 text-sm text-muted-foreground">
                Delivered. Payouts for this order have been released.
              </p>
            )}
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
    </div>
  );
}
