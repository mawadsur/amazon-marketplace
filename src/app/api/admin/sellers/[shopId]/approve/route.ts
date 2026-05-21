// POST /api/admin/sellers/[shopId]/approve  { reason?: string }

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { approveShop } from "@/lib/admin";

const bodySchema = z.object({ reason: z.string().max(2000).optional() });

export async function POST(req: Request, ctx: { params: Promise<{ shopId: string }> }) {
  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { shopId } = await ctx.params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const shop = await approveShop(shopId, admin.id, parsed.data.reason);
    return NextResponse.json({ shop });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status = msg === "SHOP_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
