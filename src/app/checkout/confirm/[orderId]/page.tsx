// /checkout/confirm/[orderId] — bridge between order creation and the
// Stripe checkout redirect. Useful when a buyer reopens an unpaid order
// (e.g. after closing the tab) — we re-issue a stub Stripe URL and send
// them there. While the redirect happens, this renders a brief spinner.

import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { auth } from "@/lib/auth";
import { getOrderForBuyer } from "@/lib/orders";
import { stripeCreateCheckout } from "@/lib/stubs";

export const dynamic = "force-dynamic";

export default async function CheckoutConfirmPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent(`/checkout/confirm/${orderId}`)}`);
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
              <p className="mt-2 text-sm text-muted-foreground">
                We couldn&apos;t find that order on your account.
              </p>
              <Link href="/cart" className="amzn-link mt-4 inline-block text-sm">
                Back to cart
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (order.status !== "PLACED") {
    // Already paid (or beyond) — show them the order detail.
    redirect(`/buyer/orders/${order.id}`);
  }

  const checkout = await stripeCreateCheckout({
    orderId: order.id,
    amountUsdCents: order.totalUsdCents,
  });
  redirect(checkout.url);
}
