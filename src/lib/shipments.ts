// Shipment orchestration: create labels via the Shiprocket stub, append
// tracking events, and on delivery flip the order + mark payouts paid.
//
// JSON-stored event shape (append-only):
//   [{ at: string ISO, status: ShipmentStatus, note?: string }, ...]
//
// Module 5 owns this file. The seller "Mark shipped" route and the dev
// "Advance status" API both route through here so all status writes share
// one code path.

import type { Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { shiprocketCreateShipment } from "@/lib/stubs";
import { markPayoutPaid } from "@/lib/payouts";

export type ShipmentEvent = {
  at: string;
  status: ShipmentStatus;
  note?: string;
};

/** Lifecycle order used by simulateShipmentProgress + buyer/seller UIs. */
export const SHIPMENT_LIFECYCLE: ShipmentStatus[] = [
  "LABEL_PENDING",
  "LABEL_CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "CUSTOMS",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function readEvents(raw: Prisma.JsonValue | null | undefined): ShipmentEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: ShipmentEvent[] = [];
  for (const row of raw) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const r = row as Record<string, unknown>;
      const at = typeof r.at === "string" ? r.at : null;
      const status = typeof r.status === "string" ? (r.status as ShipmentStatus) : null;
      if (at && status) {
        const note = typeof r.note === "string" ? r.note : undefined;
        out.push({ at, status, ...(note ? { note } : {}) });
      }
    }
  }
  return out;
}

/**
 * Create a Shiprocket shipment for one of a seller's orders.
 *
 *   - verifies the order belongs to this seller (at least one item from their shop)
 *   - rejects if a Shipment already exists OR order is not in PAID/PROCESSING
 *   - sums product weights (default 500g per unit when weightGrams is null)
 *   - calls the shiprocket stub for tracking number + label + customs doc
 *   - writes Shipment row (LABEL_CREATED) with an initial event
 *   - flips Order to SHIPPED + shippedAt
 *
 * Throws: NO_SHOP | ORDER_NOT_FOUND | INVALID_STATE | ALREADY_SHIPPED.
 */
export async function createShipment(input: {
  orderId: string;
  sellerId: string;
}) {
  const shop = await prisma.shop.findUnique({
    where: { ownerId: input.sellerId },
    select: { id: true },
  });
  if (!shop) throw new Error("NO_SHOP");

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, items: { some: { shopId: shop.id } } },
    select: {
      id: true,
      status: true,
      shippingAddress: true,
      shipment: { select: { id: true } },
      items: {
        select: {
          qty: true,
          product: { select: { weightGrams: true } },
        },
      },
    },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.shipment) throw new Error("ALREADY_SHIPPED");
  if (order.status !== "PAID" && order.status !== "PROCESSING") {
    throw new Error("INVALID_STATE");
  }

  // Default 500g per unit if weight is missing on the product.
  let weightGrams = 0;
  for (const it of order.items) {
    weightGrams += it.qty * (it.product.weightGrams ?? 500);
  }
  if (weightGrams <= 0) weightGrams = 500;

  const addr = order.shippingAddress as { country?: string } | null;
  const destinationCountry = addr?.country ?? "US";

  const sr = await shiprocketCreateShipment({
    orderId: order.id,
    weightGrams,
    destinationCountry,
  });

  const now = new Date();
  const firstEvent: ShipmentEvent = {
    at: now.toISOString(),
    status: "LABEL_CREATED",
    note: `Label created via Shiprocket (${destinationCountry}).`,
  };

  const shipment = await prisma.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        orderId: order.id,
        carrier: "shiprocket",
        trackingNumber: sr.trackingNumber,
        labelUrl: sr.labelUrl,
        customsDocUrl: sr.customsDocUrl,
        status: "LABEL_CREATED",
        estimatedDelivery: sr.estimatedDelivery,
        events: [firstEvent] as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: "SHIPPED", shippedAt: now },
    });
    return created;
  });

  return shipment;
}

/**
 * Append an event + flip the shipment's status. When transitioning to
 * DELIVERED, also flips the Order to DELIVERED + deliveredAt AND marks
 * every Payout tied to this order's items as PAID via markPayoutPaid.
 *
 * Idempotent on the DELIVERED side-effects (order won't re-stamp; payouts
 * are skipped if already PAID).
 *
 * Throws: SHIPMENT_NOT_FOUND.
 */
export async function updateShipmentStatus(input: {
  shipmentId: string;
  status: ShipmentStatus;
  eventNote?: string;
}) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: input.shipmentId },
    select: { id: true, orderId: true, status: true, events: true },
  });
  if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

  // Idempotency: no-op if status is unchanged.
  if (shipment.status === input.status) {
    return prisma.shipment.findUnique({ where: { id: shipment.id } });
  }

  const now = new Date();
  const events = readEvents(shipment.events);
  events.push({
    at: now.toISOString(),
    status: input.status,
    ...(input.eventNote ? { note: input.eventNote } : {}),
  });

  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: input.status,
      events: events as unknown as Prisma.InputJsonValue,
    },
  });

  if (input.status === "DELIVERED") {
    // Flip order to DELIVERED if not already.
    const order = await prisma.order.findUnique({
      where: { id: shipment.orderId },
      select: { id: true, status: true, deliveredAt: true, items: { select: { id: true } } },
    });
    if (order) {
      if (order.status !== "DELIVERED" && !order.deliveredAt) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "DELIVERED", deliveredAt: now },
        });
      }
      // Mark every payout that references any of this order's items as PAID.
      const itemIds = order.items.map((it) => it.id);
      if (itemIds.length > 0) {
        const payouts = await prisma.payout.findMany({
          where: { orderItemIds: { hasSome: itemIds } },
          select: { id: true, status: true },
        });
        for (const p of payouts) {
          if (p.status !== "PAID") {
            await markPayoutPaid({ payoutId: p.id });
          }
        }
      }
    }
  }

  return updated;
}

/**
 * Advance a shipment one step forward in SHIPMENT_LIFECYCLE. No-op if the
 * shipment is already DELIVERED. Returns the updated shipment (or the
 * current row when no progression is possible).
 *
 * Throws: SHIPMENT_NOT_FOUND.
 */
export async function simulateShipmentProgress(shipmentId: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, status: true },
  });
  if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

  const idx = SHIPMENT_LIFECYCLE.indexOf(shipment.status);
  // If the current status isn't on the happy path (EXCEPTION/RETURNED) or
  // already terminal, return without changes.
  if (idx < 0 || idx >= SHIPMENT_LIFECYCLE.length - 1) {
    return prisma.shipment.findUnique({ where: { id: shipment.id } });
  }

  const next = SHIPMENT_LIFECYCLE[idx + 1];
  return updateShipmentStatus({
    shipmentId: shipment.id,
    status: next,
    eventNote: `Advanced to ${next.toLowerCase().replace(/_/g, " ")} (dev).`,
  });
}

/** Read helper used by buyer/seller/public tracking pages. */
export async function getShipmentByOrderId(orderId: string) {
  return prisma.shipment.findUnique({ where: { orderId } });
}

export async function getShipmentByTrackingNumber(trackingNumber: string) {
  return prisma.shipment.findUnique({ where: { trackingNumber } });
}

/** Parse the JSON events column into a sorted (oldest-first) array. */
export function parseShipmentEvents(raw: Prisma.JsonValue | null | undefined): ShipmentEvent[] {
  return readEvents(raw).sort((a, b) => a.at.localeCompare(b.at));
}
