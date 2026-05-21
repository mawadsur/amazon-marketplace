// POST /api/upload/sign
// Body: { filename: string, contentType: string }
// Returns: { url: string, key: string }
//
// Seller-only. The client PUTs the file body directly to the returned URL.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildKey, signedUploadUrl } from "@/lib/storage";

const schema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z
    .string()
    .regex(/^image\/(jpe?g|png|webp|gif)$/i, "Only image/* content types allowed"),
});

function extFromFilename(filename: string, contentType: string): string {
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx >= 0) {
    const ext = filename.slice(dotIdx + 1).toLowerCase();
    if (/^[a-z0-9]{1,5}$/.test(ext)) return ext;
  }
  const fromType = contentType.split("/")[1]?.toLowerCase() ?? "bin";
  return fromType === "jpeg" ? "jpg" : fromType;
}

export async function POST(req: Request) {
  let user;
  try {
    user = await requireRole("SELLER");
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const shop = await prisma.shop.findUnique({ where: { ownerId: user.id } });
  if (!shop) {
    return NextResponse.json({ error: "SHOP_NOT_FOUND" }, { status: 400 });
  }

  const ext = extFromFilename(parsed.data.filename, parsed.data.contentType);
  const key = buildKey({ shopId: shop.id, kind: "original", ext });

  try {
    const url = await signedUploadUrl(key, parsed.data.contentType);
    return NextResponse.json({ url, key });
  } catch (err) {
    // Storage not configured (dev). Return a stub URL so the UI can keep going;
    // the actual PUT will fail at runtime, which the MVP tolerates.
    const message = err instanceof Error ? err.message : "STORAGE_UNAVAILABLE";
    return NextResponse.json({
      url: `/_stub/upload/${encodeURIComponent(key)}`,
      key,
      warning: message,
    });
  }
}
