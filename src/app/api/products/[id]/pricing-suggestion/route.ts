// GET /api/products/[id]/pricing-suggestion
//
// Returns a market-aware price recommendation for the seller's draft.
// SELLER role required + must own the product's shop.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recommendPrice } from "@/lib/pricing";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { shop: true, category: true },
  });
  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
  }
  if (session.user.role === "SELLER" && product.shop.ownerId !== session.user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const suggestion = await recommendPrice({
    productId: product.id,
    category: product.category?.slug ?? product.shop.category,
    title: product.title,
    description: product.description,
    attributes: (product.attributes as Record<string, unknown> | null) ?? null,
  });

  return NextResponse.json({ suggestion });
}
