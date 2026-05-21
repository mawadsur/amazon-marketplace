// Payout orchestration: split a paid order's revenue per shop, create one
// Payout row per shop, and call the Razorpay stub. The webhook handler later
// flips PROCESSING → PAID via markPayoutPaid().

import { prisma } from "@/lib/db";
import { razorpayCreatePayout, usdCentsToInrPaise } from "@/lib/stubs";
import { shopNetUsdCents } from "@/lib/fees";

export type EnqueuePayoutsResult = {
  created: { payoutId: string; shopId: string; amountInrPaise: number }[];
};

/**
 * For each shop with items in this order:
 *   - subtotal = sum(qty * unitPriceUsdCents) for that shop's order items
 *   - net (USD cents) = subtotal − 10% platform fee
 *   - amount (INR paise) = net converted via FX stub
 *   - create Payout row, call razorpay stub, persist payoutId
 *
 * Idempotent per (orderId, shopId): if a Payout already references one of
 * this order's items, that shop is skipped.
 */
export async function enqueuePayouts(orderId: string): Promise<EnqueuePayoutsResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { select: { id: true, shopId: true, qty: true, unitPriceUsdCents: true } } },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  // Group items by shop.
  const byShop = new Map<string, { itemIds: string[]; subtotal: number }>();
  for (const it of order.items) {
    const entry = byShop.get(it.shopId) ?? { itemIds: [], subtotal: 0 };
    entry.itemIds.push(it.id);
    entry.subtotal += it.qty * it.unitPriceUsdCents;
    byShop.set(it.shopId, entry);
  }

  const created: EnqueuePayoutsResult["created"] = [];

  for (const [shopId, group] of byShop) {
    // Idempotency: have we already created a Payout that contains any of these items?
    const existing = await prisma.payout.findFirst({
      where: { shopId, orderItemIds: { hasSome: group.itemIds } },
      select: { id: true },
    });
    if (existing) continue;

    const netUsd = shopNetUsdCents(group.subtotal);
    const amountInrPaise = usdCentsToInrPaise(netUsd);

    const payout = await prisma.payout.create({
      data: {
        shopId,
        status: "PROCESSING",
        amountInrPaise,
        orderItemIds: group.itemIds,
      },
      select: { id: true },
    });

    // Look up the shop's Razorpay fund account (set during onboarding).
    const bank = await prisma.bankAccount.findUnique({
      where: { shopId },
      select: { razorpayFundAccountId: true },
    });

    if (bank?.razorpayFundAccountId) {
      const res = await razorpayCreatePayout({
        fundAccountId: bank.razorpayFundAccountId,
        amountInrPaise,
        reference: `${orderId}_${shopId}`,
      });
      await prisma.payout.update({
        where: { id: payout.id },
        data: { razorpayPayoutId: res.payoutId },
      });
    }
    // If bank is missing we still create the Payout row (PROCESSING). An
    // admin can wire the bank later and retry; outside Module 4 scope.

    created.push({ payoutId: payout.id, shopId, amountInrPaise });
  }

  return { created };
}

/** Webhook side-effect: razorpay payout completed. Idempotent on PAID. */
export async function markPayoutPaid(input: {
  razorpayPayoutId?: string;
  payoutId?: string;
}): Promise<void> {
  const where = input.razorpayPayoutId
    ? { razorpayPayoutId: input.razorpayPayoutId }
    : input.payoutId
      ? { id: input.payoutId }
      : null;
  if (!where) throw new Error("PAYOUT_KEY_REQUIRED");

  const payout = await prisma.payout.findFirst({ where });
  if (!payout) throw new Error("PAYOUT_NOT_FOUND");
  if (payout.status === "PAID") return;

  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: "PAID", paidAt: new Date() },
  });
}

export async function markPayoutFailed(input: {
  razorpayPayoutId?: string;
  payoutId?: string;
  reason?: string;
}): Promise<void> {
  const where = input.razorpayPayoutId
    ? { razorpayPayoutId: input.razorpayPayoutId }
    : input.payoutId
      ? { id: input.payoutId }
      : null;
  if (!where) throw new Error("PAYOUT_KEY_REQUIRED");

  const payout = await prisma.payout.findFirst({ where });
  if (!payout) throw new Error("PAYOUT_NOT_FOUND");

  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: "FAILED", failureReason: input.reason ?? null },
  });
}
