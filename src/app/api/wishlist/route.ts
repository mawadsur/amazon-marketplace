// Wishlist API — GET / POST / DELETE. All require an authenticated user.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  addToWishlist,
  listWishlist,
  removeFromWishlist,
} from "@/lib/wishlist";

async function getUserIdOr401() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

export async function GET() {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const items = await listWishlist(userId);
  return NextResponse.json({ items });
}

const bodySchema = z.object({ productId: z.string().min(1) });

export async function POST(req: Request) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  try {
    const items = await addToWishlist(userId, parsed.data.productId);
    return NextResponse.json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ERROR";
    const status = msg === "PRODUCT_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: Request) {
  const userId = await getUserIdOr401();
  if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const items = await removeFromWishlist(userId, parsed.data.productId);
  return NextResponse.json({ items });
}
