// /seller/payouts — payouts for this seller's shop. Admins additionally see a
// "Mark paid" button (stub of the razorpay webhook) for each PROCESSING row.

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatusPill } from "@/components/orders/order-status-pill";
import { MarkPayoutPaidButton } from "@/components/orders/mark-payout-paid-button";
import { Card, CardContent } from "@/components/ui/card";
import { formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SellerPayoutsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?as=seller&callbackUrl=/seller/payouts");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/");

  const shop = await prisma.shop.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  });
  if (!shop) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-2 text-2xl font-semibold">Payouts</h1>
        <p className="text-muted-foreground">
          Finish setting up your shop first.{" "}
          <Link className="underline" href="/seller/onboarding">
            Continue onboarding →
          </Link>
        </p>
      </div>
    );
  }

  const payouts = await prisma.payout.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  // Map an order item id back to its Order to show the reference for context.
  const itemIds = payouts.flatMap((p) => p.orderItemIds);
  const items = await prisma.orderItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, orderId: true },
  });
  const itemToOrder = new Map(items.map((it) => [it.id, it.orderId]));

  const isAdmin = session.user.role === "ADMIN";
  const totalPending = payouts
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + p.amountInrPaise, 0);
  const totalPaid = payouts
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amountInrPaise, 0);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Pending
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {formatInr(totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Paid out
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {formatInr(totalPaid)}
            </div>
          </CardContent>
        </Card>
      </div>

      {payouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payouts yet. They&apos;ll appear here once your orders are paid.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {payouts.map((p) => {
            const firstOrderId = p.orderItemIds
              .map((id) => itemToOrder.get(id))
              .find((x): x is string => Boolean(x));
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-lg border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium tabular-nums">
                      {formatInr(p.amountInrPaise)}
                    </p>
                    <OrderStatusPill value={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                    {firstOrderId ? (
                      <>
                        {" · "}
                        <Link
                          href={`/seller/orders/${firstOrderId}`}
                          className="underline"
                        >
                          Order #{firstOrderId.slice(-8)}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  {p.razorpayPayoutId ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ref: {p.razorpayPayoutId}
                    </p>
                  ) : null}
                </div>
                {isAdmin && p.status !== "PAID" ? (
                  <MarkPayoutPaidButton payoutId={p.id} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
