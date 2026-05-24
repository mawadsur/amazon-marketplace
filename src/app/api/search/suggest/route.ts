// GET /api/search/suggest?q=marble — type-ahead suggestions for the SearchBar.
// Fast, no LLM. Returns up to 6 products, 3 shops, 3 categories matching the
// query as a case-insensitive substring. Responds in <100ms in normal load.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_PRODUCTS = 6;
const MAX_SHOPS = 3;
const MAX_CATEGORIES = 3;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);

  if (q.length < 2) {
    return NextResponse.json(
      { products: [], shops: [], categories: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [products, shops, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        shop: { status: "APPROVED" },
        title: contains,
      },
      take: MAX_PRODUCTS,
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        priceUsdCents: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.shop.findMany({
      where: { status: "APPROVED", name: contains },
      take: MAX_SHOPS,
      orderBy: { name: "asc" },
      select: { slug: true, name: true, region: true, logoUrl: true },
    }),
    prisma.category.findMany({
      where: { name: contains },
      take: MAX_CATEGORIES,
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  return NextResponse.json(
    {
      products: products.map((p) => ({
        slug: p.slug,
        title: p.title,
        priceUsdCents: p.priceUsdCents,
        image: p.images[0]?.url ?? null,
      })),
      shops,
      categories,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
