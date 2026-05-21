// POST /api/admin/listings/[productId]/reject  { reason: string }

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { rejectProduct } from "@/lib/admin";

const bodySchema = z.object({ reason: z.string().min(1).max(2000) });

export async function POST(req: Request, ctx: { params: Promise<{ productId: string }> }) {
  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { productId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "REASON_REQUIRED" }, { status: 400 });
  }

  try {
    const product = await rejectProduct(productId, admin.id, parsed.data.reason);
    return NextResponse.json({ product });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status = msg === "PRODUCT_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
