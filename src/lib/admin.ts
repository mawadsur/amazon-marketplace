// Admin-side mutations and read helpers for Module 7.
//
// All writes happen inside a transaction with a paired AdminAction row, so the
// audit log can never disagree with reality.
//
// Module 2 already exports a seller-facing `publishProduct`; the admin version
// here is `adminPublishProduct` to avoid name collisions when both are imported.

import { prisma } from "@/lib/db";
import { applyBadgeNow } from "@/lib/badges";
import { enqueueStoryVideo } from "@/lib/story-video";

// ---------------------------------------------------------------- shops

export async function approveShop(shopId: string, adminId: string, reason?: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("SHOP_NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.shop.update({
      where: { id: shopId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });
    await tx.adminAction.create({
      data: {
        adminId,
        targetType: "shop",
        targetId: shopId,
        action: "approve",
        reason: reason ?? null,
      },
    });
    return u;
  });

  // Re-derive badge from the canonical rules (VERIFIED or TOP_RATED depending
  // on KYC + reviews). Best-effort; never roll back approval on a badge failure.
  try {
    await applyBadgeNow(shopId);
  } catch {
    /* ignore */
  }

  // Trigger Provenance Story generation (D3) — best-effort, runs async via
  // the ai.story_video worker. Approval is what unlocks the shop for buyers,
  // so generating the story now means the storefront has it ready.
  try {
    await enqueueStoryVideo(shopId);
  } catch {
    /* worker not running / Redis missing — story can be regenerated later */
  }

  return updated;
}

export async function rejectShop(shopId: string, adminId: string, reason: string) {
  if (!reason || !reason.trim()) throw new Error("REASON_REQUIRED");
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error("SHOP_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.shop.update({
      where: { id: shopId },
      data: { status: "REJECTED" },
    });
    await tx.adminAction.create({
      data: {
        adminId,
        targetType: "shop",
        targetId: shopId,
        action: "reject",
        reason,
      },
    });
    return updated;
  });
}

// ---------------------------------------------------------------- products

export async function adminPublishProduct(
  productId: string,
  adminId: string,
  reason?: string,
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: { status: "PUBLISHED", publishedAt: new Date(), rejectionNote: null },
    });
    await tx.adminAction.create({
      data: {
        adminId,
        targetType: "product",
        targetId: productId,
        action: "approve",
        reason: reason ?? null,
      },
    });
    return updated;
  });
}

export async function rejectProduct(productId: string, adminId: string, reason: string) {
  if (!reason || !reason.trim()) throw new Error("REASON_REQUIRED");
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: { status: "REJECTED", rejectionNote: reason },
    });
    await tx.adminAction.create({
      data: {
        adminId,
        targetType: "product",
        targetId: productId,
        action: "reject",
        reason,
      },
    });
    return updated;
  });
}

// ---------------------------------------------------------------- dashboard summary

export async function summary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    pendingSellers,
    pendingListings,
    openDisputes,
    ordersLast24h,
    gmvAgg,
  ] = await Promise.all([
    prisma.shop.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.order.count({ where: { placedAt: { gte: since } } }),
    prisma.order.aggregate({
      where: { placedAt: { gte: since } },
      _sum: { totalUsdCents: true },
    }),
  ]);

  return {
    pendingSellers,
    pendingListings,
    openDisputes,
    ordersLast24h,
    gmvLast24hUsdCents: gmvAgg._sum.totalUsdCents ?? 0,
  };
}

// ---------------------------------------------------------------- order timeline

export type OrderTimelineEvent = {
  label: string;
  at: Date;
};

export async function getOrderTimeline(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { id: true, email: true, phone: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, title: true, slug: true, shopId: true } },
        },
      },
      payment: true,
      shipment: true,
      dispute: true,
    },
  });
  if (!order) return null;

  const events: OrderTimelineEvent[] = [{ label: "Placed", at: order.placedAt }];
  if (order.paidAt) events.push({ label: "Paid", at: order.paidAt });
  if (order.shippedAt) events.push({ label: "Shipped", at: order.shippedAt });
  if (order.deliveredAt) events.push({ label: "Delivered", at: order.deliveredAt });
  if (order.completedAt) events.push({ label: "Completed", at: order.completedAt });
  if (order.cancelledAt) events.push({ label: "Cancelled", at: order.cancelledAt });

  // Payouts may not exist yet if Module 4 hasn't created them. Be defensive.
  const shopIds = Array.from(new Set(order.items.map((i) => i.shopId)));
  const payouts =
    shopIds.length > 0
      ? await prisma.payout.findMany({
          where: { shopId: { in: shopIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return { order, events, payouts };
}
