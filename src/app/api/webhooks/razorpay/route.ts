// POST /api/webhooks/razorpay
//
// Two modes, gated on env.RAZORPAY_WEBHOOK_SECRET:
//
// REAL MODE: verifies the X-Razorpay-Signature HMAC-SHA256 of the raw body
// against the configured secret using a constant-time compare. Parses the
// event and dispatches payout.processed / payout.failed / payout.reversed
// to markPayoutPaid / markPayoutFailed.
//
// STUB MODE (dev): "Mark payout paid" button on /seller/payouts (admin-only)
// POSTs `{ payoutId | razorpayPayoutId, status }` directly. No signature.

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import { markPayoutPaid, markPayoutFailed } from "@/lib/payouts";

const stubSchema = z
  .object({
    payoutId: z.string().optional(),
    razorpayPayoutId: z.string().optional(),
    status: z.enum(["paid", "failed"]),
    reason: z.string().optional(),
  })
  .refine((v) => Boolean(v.payoutId || v.razorpayPayoutId), {
    message: "payoutId or razorpayPayoutId required",
  });

function verifyRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // ───── REAL MODE ─────
  if (env.RAZORPAY_WEBHOOK_SECRET) {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "NO_SIGNATURE" }, { status: 401 });
    }
    if (!verifyRazorpaySignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "BAD_SIGNATURE" }, { status: 401 });
    }

    let event: {
      event?: string;
      payload?: { payout?: { entity?: { id?: string; failure_reason?: string } } };
    };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const eventType = event.event ?? "";
    const razorpayPayoutId = event.payload?.payout?.entity?.id;
    if (!razorpayPayoutId) {
      return NextResponse.json({ error: "MISSING_PAYOUT_ID" }, { status: 400 });
    }

    try {
      if (eventType === "payout.processed") {
        await markPayoutPaid({ razorpayPayoutId });
      } else if (eventType === "payout.failed" || eventType === "payout.reversed") {
        await markPayoutFailed({
          razorpayPayoutId,
          reason: event.payload?.payout?.entity?.failure_reason,
        });
      }
      // Other event types acknowledged with 200 so Razorpay stops retrying.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ERROR";
      const status = msg === "PAYOUT_NOT_FOUND" ? 404 : 500;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({ ok: true, received: eventType });
  }

  // ───── STUB MODE ─────
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = stubSchema.safeParse(json);
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
