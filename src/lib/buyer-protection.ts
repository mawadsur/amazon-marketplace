// Buyer Protection (D6). Every PAID order gets an auto-created coverage row.
// MVP: self-funded pool capped per-order. Claim creation happens via dispute
// resolution (when admin sides with the buyer) or — later — directly from
// /buyer/orders/[id]/protection. Real insurance partner integration is TODO.

import { prisma } from "@/lib/db";

const PER_ORDER_COVERAGE_CAP_USD_CENTS = 100_000; // $1,000 max per order

export function calculateCoverageUsdCents(orderTotalUsdCents: number): number {
  return Math.min(orderTotalUsdCents, PER_ORDER_COVERAGE_CAP_USD_CENTS);
}

/**
 * Create the BuyerProtection row at order capture. Idempotent on the (unique)
 * orderId — re-running for the same order is safe.
 */
export async function createBuyerProtection(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalUsdCents: true, protection: { select: { id: true } } },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.protection) return; // already created

  await prisma.buyerProtection.create({
    data: {
      orderId: order.id,
      status: "ELIGIBLE",
      coverageUsdCents: calculateCoverageUsdCents(order.totalUsdCents),
    },
  });
}

/** Flip protection to CLAIMED. Called when a buyer opens a dispute. */
export async function claimBuyerProtection(orderId: string): Promise<void> {
  const existing = await prisma.buyerProtection.findUnique({ where: { orderId } });
  if (!existing) return; // never created — order pre-dated protection rollout
  if (existing.status !== "ELIGIBLE") return; // already claimed/paid/denied
  await prisma.buyerProtection.update({
    where: { id: existing.id },
    data: { status: "CLAIMED", claimedAt: new Date() },
  });
}

/** Admin resolution path: PAID = buyer reimbursed, DENIED = claim rejected. */
export async function resolveBuyerProtection(
  orderId: string,
  outcome: "PAID" | "DENIED",
  resolution: string,
): Promise<void> {
  const existing = await prisma.buyerProtection.findUnique({ where: { orderId } });
  if (!existing) return;
  if (existing.status === "PAID" || existing.status === "DENIED") return;
  await prisma.buyerProtection.update({
    where: { id: existing.id },
    data: { status: outcome, resolvedAt: new Date(), resolution },
  });
}
