// /seller/orders/[orderId] — seller-facing order detail.
// Shows only this seller's items + Mark-shipped action. Module 5 will
// replace the manual stamp with real shipment creation.

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderForSeller } from "@/lib/orders";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { MarkShippedButton } from "@/components/orders/mark-shipped-button";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

type ShippingAddressLike = {
  fullName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?as=seller&callbackUrl=/seller/orders/${orderId}`);
  }
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/");

  const order = await getOrderForSeller(session.user.id, orderId);
  if (!order) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        <Link href="/seller/orders" className="mt-4 inline-block underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const shopSubtotal = order.items.reduce(
    (s, it) => s + it.qty * it.unitPriceUsdCents,
    0,
  );
  const canShip = order.status === "PAID" || order.status === "PROCESSING";
  const shippingAddr = order.shippingAddress as ShippingAddressLike | null;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Order #{order.id.slice(-8)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            Placed {new Date(order.placedAt).toLocaleDateString()}
          </h1>
        </div>
        <Link href="/seller/orders" className="text-sm underline">
          All orders
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <OrderStatusPill value={order.status} />
        <span className="text-xs text-muted-foreground">
          Payment {order.payment?.status?.toLowerCase() ?? "pending"}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Your items</h2>
          <ul className="space-y-3">
            {order.items.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-4 rounded-lg border bg-card p-4"
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {it.product.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.product.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/seller/products/${it.product.id}`}
                    className="font-medium hover:underline"
                  >
                    {it.product.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">qty {it.qty}</p>
                </div>
                <p className="text-sm font-medium tabular-nums">
                  {formatUsd(it.qty * it.unitPriceUsdCents)}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-lg font-semibold">Status</h2>
          <div className="rounded-lg border bg-card p-6">
            <OrderTimeline
              input={{
                placedAt: order.placedAt,
                paidAt: order.paidAt,
                shippedAt: order.shippedAt,
                deliveredAt: order.deliveredAt,
                completedAt: order.completedAt,
                cancelledAt: order.cancelledAt,
              }}
            />
            {canShip ? (
              <div className="mt-6 border-t pt-6">
                <MarkShippedButton orderId={order.id} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Once you ship, we&apos;ll notify the buyer. Module 5 will replace this
                  with automatic label creation.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-base font-semibold">Your subtotal</h2>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatUsd(shopSubtotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payout (minus 10% platform fee) appears on{" "}
              <Link href="/seller/payouts" className="underline">
                Payouts
              </Link>
              .
            </p>
          </section>

          {shippingAddr ? (
            <section className="rounded-lg border bg-card p-6 text-sm">
              <h2 className="text-base font-semibold">Ship to</h2>
              <address className="mt-2 not-italic text-muted-foreground">
                {shippingAddr.fullName}
                <br />
                {shippingAddr.line1}
                {shippingAddr.line2 ? (
                  <>
                    <br />
                    {shippingAddr.line2}
                  </>
                ) : null}
                <br />
                {shippingAddr.city}, {shippingAddr.region} {shippingAddr.postalCode}
                <br />
                {shippingAddr.country}
                {shippingAddr.phone ? (
                  <>
                    <br />
                    {shippingAddr.phone}
                  </>
                ) : null}
              </address>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
