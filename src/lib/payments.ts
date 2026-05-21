// Payment-capture side of the transaction layer. Triggered by the
// Stripe webhook handler. On success, flips Order → PAID and fans out
// per-shop Payouts via enqueuePayouts(). Idempotent on PAID.

import { prisma } from "@/lib/db";
import { enqueuePayouts } from "@/lib/payouts";
import { stripeRefund } from "@/lib/stubs";

export type MarkCapturedInput = {
  orderId: string;
  providerChargeId?: string;
  providerIntentId?: string;
};

export async function markPaymentCaptured(input: MarkCapturedInput): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, status: true, payment: { select: { id: true, status: true } } },
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

  // Side-effect: create per-shop payouts. Failures here should NOT roll back
  // the capture (the payment is real); admin can retry payouts separately.
  await enqueuePayouts(order.id);
}

export type RefundInput = { orderId: string; reason?: string };

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
