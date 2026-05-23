// /checkout/success/[orderId] — Amazon-style post-payment thank-you.
// Links into the buyer's order detail page where they can see the full
// status timeline.

import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { auth } from "@/lib/auth";
import { getOrderForBuyer } from "@/lib/orders";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent(`/checkout/success/${orderId}`)}`);
  }

  const order = await getOrderForBuyer(session.user.id, orderId);
  if (!order) {
    return (
      <>
        <MarketplaceNav />
        <main className="bg-background pb-12">
          <div className="mx-auto max-w-3xl px-4 py-10">
            <div className="rounded-sm border border-border bg-card p-8 text-center">
              <h1 className="text-2xl font-medium text-foreground">
                Order not found
              </h1>
              <Link href="/shop" className="amzn-link mt-4 inline-block text-sm">
                Keep browsing
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MarketplaceNav />
      <main className="bg-background pb-12">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-sm border border-border bg-card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check
                className="h-7 w-7 text-green-700"
                aria-hidden="true"
                strokeWidth={3}
              />
            </div>
            <h1 className="mt-4 text-2xl font-medium text-foreground">
              Thanks! Your order has been placed.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Order #{order.id.slice(-8)}
            </p>

            <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-sm border border-border bg-background p-4 text-left text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-muted-foreground">Order</dt>
                <dd className="font-medium text-foreground">
                  #{order.id.slice(-8)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-muted-foreground">Total paid</dt>
                <dd className="font-bold tabular-nums text-foreground">
                  {formatUsd(order.totalUsdCents)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/buyer/orders/${order.id}`}
                className="amzn-button-yellow w-full sm:w-auto"
              >
                View your order
              </Link>
              <Link
                href="/"
                className="amzn-button-orange w-full sm:w-auto"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
