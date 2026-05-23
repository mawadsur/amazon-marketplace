// Read-side query helpers for the public marketplace.
// All listing queries filter to ProductStatus.PUBLISHED + ShopStatus.APPROVED
// unless the caller opts in to a broader scope (none do, yet).

import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { SearchIntent } from "@/lib/concierge";

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

/** Simple ILIKE search across product title + description. Kept for callers
 * that haven't moved to intent-based search yet. New code should prefer
 * `searchWithIntent`. */
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

const SEARCH_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  priceUsdCents: true,
  priceInrPaise: true,
  shop: { select: { name: true, slug: true, region: true, category: true } },
  images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
  category: { select: { slug: true, name: true } },
} satisfies Prisma.ProductSelect;

/**
 * Intent-aware search. Applies category/region/price filters from the parsed
 * intent, ANDs keyword ILIKE on top. Falls back to plain ILIKE on the raw
 * query when the intent is empty (e.g. Claude parsed it as pure noise).
 */
export async function searchWithIntent(intent: SearchIntent) {
  const haveStructured =
    intent.categories.length > 0 ||
    intent.regions.length > 0 ||
    intent.priceMaxUsdCents !== null ||
    intent.priceMinUsdCents !== null;
  const haveKeywords = intent.keywords.length > 0;

  if (!haveStructured && !haveKeywords) {
    if (!intent.rawQuery.trim()) return [];
    return search(intent.rawQuery);
  }

  // Build a price filter once and reuse.
  const priceFilter: Prisma.IntFilter | undefined =
    intent.priceMinUsdCents !== null || intent.priceMaxUsdCents !== null
      ? {
          ...(intent.priceMinUsdCents !== null ? { gte: intent.priceMinUsdCents } : {}),
          ...(intent.priceMaxUsdCents !== null ? { lte: intent.priceMaxUsdCents } : {}),
        }
      : undefined;

  // Shop filter (region + always APPROVED via PUBLISHED_PRODUCT_WHERE).
  const shopFilter: Prisma.ShopWhereInput = { status: "APPROVED" as const };
  if (intent.regions.length > 0) shopFilter.region = { in: intent.regions };

  // Category match against either the Category table OR the Shop.category
  // free-text column (covers shops whose products haven't been categorized yet).
  const categoryOr: Prisma.ProductWhereInput[] | undefined =
    intent.categories.length > 0
      ? [
          { category: { slug: { in: intent.categories } } },
          { shop: { ...shopFilter, category: { in: intent.categories } } },
        ]
      : undefined;

  const ands: Prisma.ProductWhereInput[] = [];
  if (categoryOr) ands.push({ OR: categoryOr });
  if (haveKeywords) {
    ands.push({
      OR: intent.keywords.flatMap((k) => [
        { title: { contains: k, mode: "insensitive" as const } },
        { description: { contains: k, mode: "insensitive" as const } },
      ]),
    });
  }

  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    shop: shopFilter,
    ...(priceFilter ? { priceUsdCents: priceFilter } : {}),
    ...(ands.length > 0 ? { AND: ands } : {}),
  };

  return prisma.product.findMany({
    where,
    take: 60,
    orderBy: [{ publishedAt: "desc" }],
    select: SEARCH_SELECT,
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

const RAIL_SELECT = {
  id: true,
  slug: true,
  title: true,
  priceUsdCents: true,
  priceInrPaise: true,
  shop: { select: { name: true, slug: true, region: true, badge: true } },
  images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;

// "Frequently bought together" — pulled from real order co-occurrence first,
// then padded with same-shop products. Empty array means "no rail".
export async function getFrequentlyBoughtTogether(opts: {
  productId: string;
  shopId: string;
  limit?: number;
}) {
  const limit = opts.limit ?? 3;

  // Real co-occurrence: orders that contained this product, find other items.
  const coOrders = await prisma.orderItem.findMany({
    where: { productId: opts.productId },
    select: { orderId: true },
    take: 200,
  });
  const orderIds = coOrders.map((r) => r.orderId);

  const groupedRaw =
    orderIds.length > 0
      ? await prisma.orderItem.groupBy({
          by: ["productId"],
          where: { orderId: { in: orderIds }, productId: { not: opts.productId } },
          _sum: { qty: true },
          orderBy: { _sum: { qty: "desc" } },
          take: limit,
        })
      : [];
  const realIds = groupedRaw.map((g) => g.productId);

  // Pad with same-shop fallbacks.
  let padIds: string[] = [];
  if (realIds.length < limit) {
    const pad = await prisma.product.findMany({
      where: {
        ...PUBLISHED_PRODUCT_WHERE,
        shopId: opts.shopId,
        id: { not: opts.productId, notIn: realIds },
      },
      orderBy: { publishedAt: "desc" },
      take: limit - realIds.length,
      select: { id: true },
    });
    padIds = pad.map((p) => p.id);
  }
  const ids = [...realIds, ...padIds];
  if (ids.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, ...PUBLISHED_PRODUCT_WHERE },
    select: RAIL_SELECT,
  });
  // Preserve the order of `ids`.
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}

// "Customers also bought" / related rail — same category, different shop, within price band.
export async function getRelatedProducts(opts: {
  productId: string;
  categoryId?: string | null;
  shopId: string;
  priceUsdCents: number;
  limit?: number;
}) {
  const limit = opts.limit ?? 8;
  const where: Prisma.ProductWhereInput = {
    ...PUBLISHED_PRODUCT_WHERE,
    id: { not: opts.productId },
  };
  if (opts.categoryId) {
    where.categoryId = opts.categoryId;
  }
  // Try category + different shop first.
  const sameCatOtherShop = await prisma.product.findMany({
    where: { ...where, shopId: { not: opts.shopId } },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: RAIL_SELECT,
  });
  if (sameCatOtherShop.length >= limit) return sameCatOtherShop;

  // Pad with anything published in the same category (including same shop).
  const seen = new Set(sameCatOtherShop.map((p) => p.id));
  const extra = await prisma.product.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: limit - sameCatOtherShop.length + seen.size,
    select: RAIL_SELECT,
  });
  const padded = [...sameCatOtherShop];
  for (const p of extra) {
    if (padded.length >= limit) break;
    if (seen.has(p.id)) continue;
    padded.push(p);
    seen.add(p.id);
  }
  return padded;
}
