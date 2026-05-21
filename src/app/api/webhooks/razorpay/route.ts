// POST /api/webhooks/razorpay
//
// Dev/stub mode: receives { payoutId?, razorpayPayoutId?, status } and flips
// the matching Payout row. The "Mark payout paid" button on /seller/payouts
// (admin-gated) calls this directly. Module 5 will eventually trigger PAID
// automatically on delivery confirmation.

import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { markPayoutPaid, markPayoutFailed } from "@/lib/payouts";

const bodySchema = z
  .object({
    payoutId: z.string().optional(),
    razorpayPayoutId: z.string().optional(),
    status: z.enum(["paid", "failed"]),
    reason: z.string().optional(),
  })
  .refine((v) => Boolean(v.payoutId || v.razorpayPayoutId), {
    message: "payoutId or razorpayPayoutId required",
  });

export async function POST(req: Request) {
  if (env.RAZORPAY_WEBHOOK_SECRET) {
    // TODO(payouts): verify X-Razorpay-Signature HMAC + parse real event shape
    return NextResponse.json({ error: "REAL_RAZORPAY_NOT_WIRED" }, { status: 501 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    if (parsed.data.status === "paid") {
      await markPayoutPaid({
        payoutId: parsed.data.payoutId,
        razorpayPayoutId: parsed.data.razorpayPayoutId,
      });
    } else {
      await markPayoutFailed({
        payoutId: parsed.data.payoutId,
        razorpayPayoutId: parsed.data.razorpayPayoutId,
        reason: parsed.data.reason,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status = msg === "PAYOUT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true });
}
