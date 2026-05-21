// Wishlist operations — all functions require an authenticated user id.

import { prisma } from "@/lib/db";

export async function listWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          shop: { select: { name: true, slug: true } },
        },
      },
    },
  });
}

export async function addToWishlist(userId: string, productId: string) {
  // Ensure the product exists. Don't require PUBLISHED — buyers may wishlist
  // drafts they were shown, but the page will hide non-published items.
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
  return listWishlist(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  return listWishlist(userId);
}

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  const row = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  return !!row;
}
