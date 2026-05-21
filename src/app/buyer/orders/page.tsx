// /buyer/orders — list of all orders for the authenticated buyer.

import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { auth } from "@/lib/auth";
import { getOrdersForBuyer } from "@/lib/orders";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BuyerOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent("/buyer/orders")}`);
  }

  const orders = await getOrdersForBuyer(session.user.id);

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} order{orders.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link href="/buyer/account" className="text-sm underline">
            Back to account
          </Link>
        </div>

        <section className="mt-8 space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
              You don&apos;t have any orders yet.{" "}
              <Link href="/shop" className="underline">
                Start browsing
              </Link>
              .
            </div>
          ) : (
            orders.map((o) => {
              const previewImg = o.items[0]?.product.images[0]?.url;
              const itemCount = o.items.reduce((s, it) => s + it.qty, 0);
              return (
                <Link
                  key={o.id}
                  href={`/buyer/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {previewImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImg} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">Order #{o.id.slice(-8)}</p>
                      <OrderStatusPill value={o.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.placedAt).toLocaleDateString()} · {itemCount} item
                      {itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatUsd(o.totalUsdCents)}
                  </p>
                </Link>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
