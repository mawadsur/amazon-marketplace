// Cart operations — all functions require an authenticated user id.
// Callers (API routes, server actions) handle auth; this module trusts inputs.

import { prisma } from "@/lib/db";

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { position: "asc" }, take: 1 },
              shop: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });
}

export async function addToCart(userId: string, productId: string, qty = 1) {
  if (qty < 1) throw new Error("qty must be >= 1");

  // Ensure the product exists and is buyable.
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true, inventory: true },
  });
  if (!product || product.status !== "PUBLISHED") {
    throw new Error("PRODUCT_NOT_AVAILABLE");
  }

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

  // Upsert the cart line; on conflict, add qty.
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { qty: { increment: qty } },
    create: { cartId: cart.id, productId, qty },
  });

  return getOrCreateCart(userId);
}

export async function updateQty(userId: string, productId: string, qty: number) {
  if (qty < 0) throw new Error("qty must be >= 0");
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!cart) return getOrCreateCart(userId);

  if (qty === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { qty },
    });
  }
  return getOrCreateCart(userId);
}

export async function removeFromCart(userId: string, productId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!cart) return getOrCreateCart(userId);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return getOrCreateCart(userId);
}

export type CartTotals = {
  itemCount: number;
  subtotalUsdCents: number;
};

/** Cheap read-only sum of cart quantities for the nav badge (no upsert). */
export async function getCartItemCount(userId: string): Promise<number> {
  const res = await prisma.cartItem.aggregate({
    where: { cart: { userId } },
    _sum: { qty: true },
  });
  return res._sum.qty ?? 0;
}

export function computeCartTotals(items: { qty: number; product: { priceUsdCents: number } }[]): CartTotals {
  let itemCount = 0;
  let subtotalUsdCents = 0;
  for (const it of items) {
    itemCount += it.qty;
    subtotalUsdCents += it.qty * it.product.priceUsdCents;
  }
  return { itemCount, subtotalUsdCents };
}
