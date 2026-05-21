// /seller/orders — incoming orders for this seller's shop. Module 1's nav
// links here. Orders show only after payment is captured (Order.status PAID).

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrdersForSeller } from "@/lib/orders";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { Card, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?as=seller&callbackUrl=/seller/orders");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/");

  const { shopId, orders } = await getOrdersForSeller(session.user.id);

  if (!shopId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-2 text-2xl font-semibold">Orders</h1>
        <p className="text-muted-foreground">
          Finish setting up your shop first.{" "}
          <Link className="underline" href="/seller/onboarding">
            Continue onboarding →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} order{orders.length === 1 ? "" : "s"} for your shop
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders yet. Buyers&apos; paid orders will appear here.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => {
            const shopSubtotal = o.items.reduce(
              (s, it) => s + it.qty * it.unitPriceUsdCents,
              0,
            );
            const itemCount = o.items.reduce((s, it) => s + it.qty, 0);
            return (
              <li key={o.id}>
                <Link
                  href={`/seller/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">Order #{o.id.slice(-8)}</p>
                      <OrderStatusPill value={o.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.placedAt).toLocaleDateString()} · {itemCount} item
                      {itemCount === 1 ? "" : "s"} · {o.buyer.name ?? o.buyer.email ?? "buyer"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatUsd(shopSubtotal)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
