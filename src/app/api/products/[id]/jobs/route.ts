// GET /api/products/[id]/jobs
// Returns the AiJob statuses for the given product (seller-owned only).
// Used by the /seller/products/new/processing/[id] polling page.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireRole("SELLER");
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const product = await prisma.product.findFirst({
    where: { id, shop: { ownerId: user.id } },
    select: { id: true, status: true, title: true, priceUsdCents: true },
  });
  if (!product) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const jobs = await prisma.aiJob.findMany({
    where: { productId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      kind: true,
      status: true,
      error: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  const total = jobs.length;
  const succeeded = jobs.filter((j) => j.status === "SUCCEEDED").length;
  const failed = jobs.filter((j) => j.status === "FAILED").length;
  const done = total > 0 && succeeded === total;

  return NextResponse.json({ product, jobs, total, succeeded, failed, done });
}
