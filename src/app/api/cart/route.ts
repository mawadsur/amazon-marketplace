// Cart API — GET / POST / DELETE. All require an authenticated user.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  addToCart,
  getOrCreateCart,
  removeFromCart,
  updateQty,
  computeCartTotals,
} from "@/lib/cart";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/ratelimit";

async function getUserIdOr401() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

export async function GET() {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const cart = await getOrCreateCart(userId);
  return NextResponse.json({ cart, totals: computeCartTotals(cart.items) });
}

const postSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(0).max(99).default(1),
  mode: z.enum(["add", "set"]).default("add"),
});

export async function POST(req: Request) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const rl = await rateLimit(clientKey(req, "cart.write", userId), 30, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED", retryAfterSeconds: rl.retryAfterSeconds },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  const { productId, qty, mode } = parsed.data;

  try {
    const cart =
      mode === "set"
        ? await updateQty(userId, productId, qty)
        : await addToCart(userId, productId, qty || 1);
    return NextResponse.json({ cart, totals: computeCartTotals(cart.items) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status = msg === "PRODUCT_NOT_AVAILABLE" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

const deleteSchema = z.object({ productId: z.string().min(1) });

export async function DELETE(req: Request) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const cart = await removeFromCart(userId, parsed.data.productId);
  return NextResponse.json({ cart, totals: computeCartTotals(cart.items) });
}
