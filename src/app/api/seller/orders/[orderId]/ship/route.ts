// POST /api/seller/orders/[orderId]/ship
//
// Seller marks one of their orders as SHIPPED. Module 5 now creates a real
// Shipment row via the Shiprocket stub (label + customs doc + tracking
// number) and flips Order.status = SHIPPED. The route surface (POST,
// no body) is unchanged so the existing MarkShippedButton keeps working.

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createShipment } from "@/lib/shipments";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ orderId: string }> },
) {
  let user;
  try {
    user = await requireRole("SELLER");
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { orderId } = await ctx.params;

  try {
    const shipment = await createShipment({ orderId, sellerId: user.id });
    return NextResponse.json({
      ok: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      shipmentUrl: `/seller/orders/${orderId}/shipment`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status =
      msg === "NO_SHOP" || msg === "ORDER_NOT_FOUND"
        ? 404
        : msg === "INVALID_STATE" || msg === "ALREADY_SHIPPED"
          ? 409
          : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
