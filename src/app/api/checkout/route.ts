// POST /api/checkout
// Body: { shippingAddress }. Creates an Order from the buyer's current cart
// (in a Prisma transaction), then asks the Stripe stub for a checkout URL.
// Returns { orderId, checkoutUrl } so the client can redirect.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createOrderFromCart } from "@/lib/orders";
import { stripeCreateCheckout } from "@/lib/stubs";
import { prisma } from "@/lib/db";

const shippingSchema = z.object({
  fullName: z.string().min(2).max(120),
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional().or(z.literal("").transform(() => undefined)),
  city: z.string().min(1).max(100),
  region: z.string().min(1).max(100),
  postalCode: z.string().min(2).max(20),
  country: z.string().min(2).max(60),
  phone: z.string().max(30).optional().or(z.literal("").transform(() => undefined)),
});

const bodySchema = z.object({ shippingAddress: shippingSchema });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let order: { orderId: string; totalUsdCents: number };
  try {
    order = await createOrderFromCart({
      userId: session.user.id,
      shippingAddress: parsed.data.shippingAddress,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status =
      msg === "CART_EMPTY" ? 400 : msg === "PRODUCT_UNAVAILABLE" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const checkout = await stripeCreateCheckout({
    orderId: order.orderId,
    amountUsdCents: order.totalUsdCents,
  });

  // Persist the intent id on the Payment row for later reconciliation.
  await prisma.payment.update({
    where: { orderId: order.orderId },
    data: { providerIntentId: checkout.intentId },
  });

  return NextResponse.json({ orderId: order.orderId, checkoutUrl: checkout.url });
}
