// POST /api/webhooks/stripe
//
// Dev/stub mode (no STRIPE_WEBHOOK_SECRET): the stub checkout page POSTs
// { orderId } directly here to simulate a "checkout.session.completed" event.
// Real mode (secret configured): would verify the Stripe signature and parse
// the event payload; left as TODO so we don't depend on the live SDK in MVP.

import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { markPaymentCaptured } from "@/lib/payments";

const stubSchema = z.object({
  orderId: z.string().min(1),
  providerChargeId: z.string().optional(),
});

export async function POST(req: Request) {
  // Real-mode path: verify signature, parse event, then call markPaymentCaptured.
  if (env.STRIPE_WEBHOOK_SECRET) {
    // TODO(payments): wire stripe.webhooks.constructEvent + handle event types
    return NextResponse.json({ error: "REAL_STRIPE_NOT_WIRED" }, { status: 501 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = stubSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    await markPaymentCaptured({
      orderId: parsed.data.orderId,
      providerChargeId: parsed.data.providerChargeId ?? `ch_stub_${parsed.data.orderId}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status = msg === "ORDER_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true });
}
