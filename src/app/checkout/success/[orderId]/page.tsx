// /checkout/success/[orderId] — post-payment thank-you. Links into the
// buyer's order detail page where they can see the full status timeline.

import Link from "next/link";
import { redirect } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getOrderForBuyer } from "@/lib/orders";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";

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
        <main className="container mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <Link href="/shop" className="mt-4 inline-block underline">
            Keep browsing
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-xl px-4 py-16">
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-green-700">
            Payment received
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Thank you</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve received your order. A confirmation will be available in your
            account.
          </p>

          <dl className="mt-8 space-y-2 rounded-md bg-muted/40 p-4 text-left text-sm">
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Order</dt>
              <dd className="font-medium">#{order.id.slice(-8)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-muted-foreground">Total paid</dt>
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

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`/buyer/orders/${order.id}`}>View order</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
