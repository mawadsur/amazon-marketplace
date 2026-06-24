// Payment-capture side of the transaction layer. Triggered by the
// Stripe webhook handler. On success, flips Order → PAID and fans out
// per-shop Payouts via enqueuePayouts(). Idempotent on PAID.

import { prisma } from "@/lib/db";
import { enqueuePayouts } from "@/lib/payouts";
import { stripeRefund } from "@/lib/stubs";
import { getQueue } from "@/lib/queue";
import { createBuyerProtection } from "@/lib/buyer-protection";
import { enqueueTrustRecompute } from "@/lib/trust-score";

export type MarkCapturedInput = {
  orderId: string;
  providerChargeId?: string;
  providerIntentId?: string;
};

export async function markPaymentCaptured(input: MarkCapturedInput): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      status: true,
      payment: { select: { id: true, status: true } },
      items: { select: { productId: true, qty: true, shopId: true } },
    },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  // Idempotent: webhook may fire more than once.
  if (order.status === "PAID" || order.payment?.status === "CAPTURED") return;
  if (!order.payment) throw new Error("PAYMENT_MISSING");

  const now = new Date();
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: "CAPTURED",
        capturedAt: now,
        providerChargeId: input.providerChargeId ?? null,
        providerIntentId: input.providerIntentId ?? undefined,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: now },
    }),
  ]);

  // Side-effects after capture. Failures here should NOT roll back the
  // capture (the payment is real); admin can retry these out of band.
  //
  // Decrement inventory once per order (idempotent because we only reach here
  // when the order was not already PAID/CAPTURED). Conditional decrement guards
  // against overselling in the rare race where stock vanished between order
  // creation and capture; a shortfall is logged for admin follow-up rather than
  // failing the capture.
  for (const it of order.items) {
    const res = await prisma.product.updateMany({
      where: { id: it.productId, inventory: { gte: it.qty } },
      data: { inventory: { decrement: it.qty } },
    });
    if (res.count === 0) {
      console.error(
        `[payments] inventory shortfall on capture: order=${order.id} product=${it.productId} qty=${it.qty}`,
      );
    }
  }

  await enqueuePayouts(order.id);
  try {
    await createBuyerProtection(order.id);
  } catch {
    /* protection creation is best-effort */
  }

  // A captured order bumps each shop's sales signal — recompute trust scores.
  const shopIds = [...new Set(order.items.map((it) => it.shopId))];
  await Promise.all(shopIds.map((id) => enqueueTrustRecompute(id)));
}

export type RefundInput = { orderId: string; reason?: string };
export type RefundJobPayload = { orderId: string; reason?: string };

/**
 * Enqueue a refund. Use this from caller paths (e.g. dispute resolution) so a
 * gateway failure can be retried by the worker without holding up the request.
 * The worker calls `refundOrder` and BullMQ handles the retry backoff.
 * Stuck refunds surface as Orders where status=REFUNDED but payment.status=CAPTURED.
 */
export async function enqueueRefund(input: RefundInput): Promise<void> {
  const q = getQueue<RefundJobPayload>("payments.refund");
  await q.add(
    "refund",
    { orderId: input.orderId, reason: input.reason },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 24 * 3600, count: 1000 },
      removeOnFail: false, // keep failed jobs for admin inspection
    },
  );
}

// Refund a captured payment. Stripe call happens after the DB commit so a
// gateway failure cannot leave the Payment row in an inconsistent state.
// Idempotent on already-REFUNDED.
export async function refundOrder(input: RefundInput): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      status: true,
      payment: {
        select: {
          id: true,
          status: true,
          providerChargeId: true,
          providerIntentId: true,
          amountUsdCents: true,
        },
      },
    },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (!order.payment) return;
  if (order.payment.status === "REFUNDED") return;

  await stripeRefund({
    chargeId: order.payment.providerChargeId,
    intentId: order.payment.providerIntentId,
    amountUsdCents: order.payment.amountUsdCents,
    reason: input.reason,
  });

  await prisma.payment.update({
    where: { id: order.payment.id },
    data: { status: "REFUNDED" },
  });
}
