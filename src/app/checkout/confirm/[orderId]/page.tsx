// /checkout/confirm/[orderId] — bridge between order creation and the
// Stripe checkout redirect. Useful when a buyer reopens an unpaid order
// (e.g. after closing the tab) — we re-issue a stub Stripe URL and send
// them there.

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
        <main className="container mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <Link href="/cart" className="mt-4 inline-block underline">
            Back to cart
          </Link>
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
