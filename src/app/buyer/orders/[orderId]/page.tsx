// /buyer/orders/[orderId] — order detail with timeline + payment status
// + a brief look at payout status (informational; admin owns the action).

import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrderForBuyer } from "@/lib/orders";
import { formatUsd, approxInrFromUsdCents, formatInr } from "@/lib/format";

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

export default async function BuyerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent(`/buyer/orders/${orderId}`)}`);
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

  const itemIds = order.items.map((it) => it.id);
  const payouts = await prisma.payout.findMany({
    where: { orderItemIds: { hasSome: itemIds } },
    select: { id: true, status: true, amountInrPaise: true, shopId: true },
  });
  const shippingAddr = order.shippingAddress as ShippingAddressLike | null;

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Order #{order.id.slice(-8)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Placed {new Date(order.placedAt).toLocaleDateString()}
            </h1>
          </div>
          <Link href="/buyer/orders" className="text-sm underline">
            All orders
          </Link>
        </div>

        <div className="mt-3">
          <OrderStatusPill value={order.status} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Items</h2>
            <ul className="space-y-3">
              {order.items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-start gap-4 rounded-lg border bg-card p-4"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
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
                      href={`/products/${it.product.slug}`}
                      className="font-medium hover:underline"
                    >
                      {it.product.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {it.product.shop.name} · qty {it.qty}
                    </p>
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
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <h2 className="text-base font-semibold">Summary</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <Row label="Subtotal" value={formatUsd(order.subtotalUsdCents)} />
                <Row label="Shipping" value={formatUsd(order.shippingUsdCents)} />
                <Row label="Fees" value={formatUsd(order.feesUsdCents)} muted />
                <div className="mt-2 flex items-baseline justify-between border-t pt-2">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-right">
                    <div className="font-semibold tabular-nums">
                      {formatUsd(order.totalUsdCents)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      approx {approxInrFromUsdCents(order.totalUsdCents)}
                    </div>
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border bg-card p-6">
              <h2 className="text-base font-semibold">Payment</h2>
              <div className="mt-2 flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <OrderStatusPill value={order.payment?.status ?? "PENDING"} />
              </div>
              {order.payment?.capturedAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Captured {order.payment.capturedAt.toLocaleString()}
                </p>
              ) : null}
            </section>

            {payouts.length > 0 ? (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="text-base font-semibold">Seller payouts</h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {payouts.map((p) => (
                    <li key={p.id} className="flex items-baseline justify-between">
                      <span className="tabular-nums">{formatInr(p.amountInrPaise)}</span>
                      <OrderStatusPill value={p.status} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {shippingAddr ? (
              <section className="rounded-lg border bg-card p-6 text-sm">
                <h2 className="text-base font-semibold">Shipping to</h2>
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
                </address>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className={muted ? "text-muted-foreground" : ""}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
