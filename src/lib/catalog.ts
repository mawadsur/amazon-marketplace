// Read-side query helpers for the public marketplace.
// All listing queries filter to ProductStatus.PUBLISHED + ShopStatus.APPROVED
// unless the caller opts in to a broader scope (none do, yet).

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ShopFilter = {
  category?: string;
  region?: string;
  limit?: number;
};

export type ProductFilter = {
  shopId?: string;
  categorySlug?: string;
  region?: string;
  limit?: number;
};

const PUBLISHED_PRODUCT_WHERE = {
  status: "PUBLISHED" as const,
  shop: { status: "APPROVED" as const },
};

const APPROVED_SHOP_WHERE = { status: "APPROVED" as const };

export async function listShops(filter: ShopFilter = {}) {
  const where: Prisma.ShopWhereInput = { ...APPROVED_SHOP_WHERE };
  if (filter.category) where.category = filter.category;
  if (filter.region) where.region = filter.region;

  return prisma.shop.findMany({
    where,
    take: filter.limit,
    orderBy: [{ badge: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      bio: true,
      city: true,
      region: true,
      category: true,
      logoUrl: true,
      bannerUrl: true,
      badge: true,
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function listProducts(filter: ProductFilter = {}) {
  const where: Prisma.ProductWhereInput = { ...PUBLISHED_PRODUCT_WHERE };
  if (filter.shopId) where.shopId = filter.shopId;
  if (filter.categorySlug) where.category = { slug: filter.categorySlug };
  if (filter.region) {
    where.shop = { status: "APPROVED", region: filter.region };
  }

  return prisma.product.findMany({
    where,
    take: filter.limit,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      priceUsdCents: true,
      priceInrPaise: true,
      shop: { select: { name: true, slug: true, region: true, city: true } },
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
      category: { select: { slug: true, name: true } },
    },
  });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      shop: true,
      category: true,
      tags: true,
      images: { orderBy: { position: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          buyer: { select: { name: true, image: true } },
        },
      },
    },
  });
  if (!product) return null;

  const stats = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    ...product,
    ratingAvg: stats._avg.rating ?? null,
    ratingCount: stats._count.rating,
  };
}

export async function getShopBySlug(slug: string) {
  const shop = await prisma.shop.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          category: { select: { slug: true, name: true } },
        },
      },
    },
  });
  if (!shop) return null;
  if (shop.status !== "APPROVED") return null;
  return shop;
}

/** Simple ILIKE search across product title + description. */
export async function search(q: string) {
  const term = q.trim();
  if (!term) return [];
  return prisma.product.findMany({
    where: {
      ...PUBLISHED_PRODUCT_WHERE,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ],
    },
    take: 60,
    orderBy: [{ publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      priceUsdCents: true,
      priceInrPaise: true,
      shop: { select: { name: true, slug: true, region: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: { where: { status: "PUBLISHED" } } },
      },
    },
  });
}

export async function listRegions() {
  // Distinct list of regions across approved shops, with a shop count.
  const rows = await prisma.shop.groupBy({
    by: ["region"],
    where: APPROVED_SHOP_WHERE,
    _count: { region: true },
    orderBy: { region: "asc" },
  });
  return rows.map((r) => ({ region: r.region, shopCount: r._count.region }));
}

/** Convert a URL-friendly region slug ("tamil-nadu") to the stored form ("Tamil Nadu"). */
export function regionSlugToName(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function regionNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
