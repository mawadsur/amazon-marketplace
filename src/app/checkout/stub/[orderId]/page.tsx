// /checkout/stub/[orderId] — dev-only "Stripe" surface.
//
// In real life the Stripe Checkout URL points at stripe.com; the stub URL
// returned by stripeCreateCheckout() points here so the local dev flow works.
// The Pay-now button POSTs to /api/webhooks/stripe to simulate capture.

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrderForBuyer } from "@/lib/orders";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";
import { PayNowButton } from "@/components/checkout/pay-now-button";

export const dynamic = "force-dynamic";

export default async function StripeStubPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent(`/checkout/stub/${orderId}`)}`);
  }

  const order = await getOrderForBuyer(session.user.id, orderId);
  if (!order) {
    return (
      <main className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find that order on your account.
        </p>
        <Link href="/cart" className="mt-4 inline-block underline">
          Back to cart
        </Link>
      </main>
    );
  }

  // Already paid? Skip straight to success.
  if (order.status !== "PLACED") {
    redirect(`/checkout/success/${orderId}`);
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Dev mode · Stripe stub
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Confirm payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Order #{order.id.slice(-8)}
        </p>

        <div className="mt-6 rounded-md bg-muted/40 p-4 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Amount due</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatUsd(order.totalUsdCents)}
            </span>
          </div>
          <div className="mt-1 text-right text-xs text-muted-foreground">
            approx {approxInrFromUsdCents(order.totalUsdCents)}
          </div>
        </div>

        <div className="mt-6">
          <PayNowButton orderId={order.id} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          This is a development stub. No card is charged. Click &ldquo;Pay now&rdquo; to
          simulate a successful Stripe checkout.
        </p>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/cart" className="text-muted-foreground underline">
          Cancel and return to cart
        </Link>
      </p>
    </main>
  );
}
