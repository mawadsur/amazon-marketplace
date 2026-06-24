"use server";

// Server actions for the seller product CRUD flow.
//
//  - createDraftFromUpload : creates a Product (DRAFT) + ProductImage(ORIGINAL)
//                            row and kicks off the AI pipeline.
//  - updateDraft           : seller edits the AI-generated fields.
//  - publishProduct        : flips the product into PENDING_REVIEW.
//
// Mutations only — reads happen in pages via the prisma client directly.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { publicUrl } from "@/lib/storage";
import { usdCentsToInrPaise } from "@/lib/stubs";
import { startPipeline, enqueueAvatarVideo } from "@/lib/ai-pipeline";

// ---------------------------------------------------------------- helpers

async function getCurrentShop() {
  const user = await requireRole("SELLER");
  const shop = await prisma.shop.findUnique({ where: { ownerId: user.id } });
  if (!shop) throw new Error("SHOP_NOT_FOUND");
  return shop;
}

function tempSlug(productId: string) {
  return `draft-${productId.slice(-10)}`;
}

function imageUrlFromKey(key: string): string {
  // The S3 stub may not have a public base URL configured — fall back to a
  // synthetic path so we still have *something* to record. The real upload may
  // have failed at runtime, which is acceptable for the MVP demo.
  try {
    return publicUrl(key);
  } catch {
    return `/_stub/uploads/${key}`;
  }
}

// ---------------------------------------------------------------- createDraftFromUpload

const createSchema = z.object({
  imageKey: z.string().min(1),
  sourceLang: z.string().min(2).max(8).default("en"),
  sourceText: z.string().max(2000).default(""),
});

export async function createDraftFromUpload(inp: {
  imageKey: string;
  sourceLang?: string;
  sourceText?: string;
}) {
  const parsed = createSchema.parse({
    imageKey: inp.imageKey,
    sourceLang: inp.sourceLang ?? "en",
    sourceText: inp.sourceText ?? "",
  });
  const shop = await getCurrentShop();

  const product = await prisma.product.create({
    data: {
      shopId: shop.id,
      // Slug must be unique; we use a temp placeholder and replace once the
      // description worker generates a real title.
      slug: `tmp-${crypto.randomUUID().slice(0, 8)}`,
      title: "Generating…",
      description: null,
      sourceLang: parsed.sourceLang,
      sourceText: parsed.sourceText,
      // Prices are placeholders until the pricing worker runs.
      priceUsdCents: 0,
      priceInrPaise: 0,
      status: "DRAFT",
    },
  });

  // Give the temp slug a stable form once we have the product id.
  await prisma.product.update({
    where: { id: product.id },
    data: { slug: tempSlug(product.id) },
  });

  await prisma.productImage.create({
    data: {
      productId: product.id,
      url: imageUrlFromKey(parsed.imageKey),
      kind: "ORIGINAL",
      position: 0,
      aiMetadata: { storageKey: parsed.imageKey },
    },
  });

  await startPipeline({
    productId: product.id,
    imageKey: parsed.imageKey,
    sourceLang: parsed.sourceLang,
    sourceText: parsed.sourceText,
  });

  revalidatePath("/seller/products");
  return { productId: product.id };
}

// ---------------------------------------------------------------- updateDraft

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(8000).optional(),
  priceUsdCents: z.number().int().min(0).max(10_000_000).optional(),
  inventory: z.number().int().min(0).max(1_000_000).optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
});

type UpdateDraftPatch = z.infer<typeof updateSchema>;

export async function updateDraft(productId: string, patch: UpdateDraftPatch) {
  const shop = await getCurrentShop();
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const parsed = updateSchema.parse(patch);
  const data: Record<string, unknown> = {};
  if (parsed.title !== undefined) data.title = parsed.title;
  if (parsed.description !== undefined) data.description = parsed.description;
  if (parsed.priceUsdCents !== undefined) {
    data.priceUsdCents = parsed.priceUsdCents;
    data.priceInrPaise = usdCentsToInrPaise(parsed.priceUsdCents);
  }
  if (parsed.inventory !== undefined) data.inventory = parsed.inventory;

  await prisma.product.update({ where: { id: productId }, data });

  if (parsed.tags) {
    // Replace existing tag set with the provided list.
    const tagRecords = await Promise.all(
      parsed.tags.map((raw) => {
        const slug = raw
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40);
        return prisma.tag.upsert({
          where: { slug },
          update: {},
          create: { slug, name: raw },
        });
      }),
    );
    await prisma.product.update({
      where: { id: productId },
      data: { tags: { set: tagRecords.map((t) => ({ id: t.id })) } },
    });
  }

  revalidatePath(`/seller/products/${productId}`);
  revalidatePath("/seller/products");
}

// ---------------------------------------------------------------- regenerateAvatarVideo

/**
 * (Re)generate the avatar try-on video for a seller's product. Creates a fresh
 * QUEUED AVATAR_VIDEO job and enqueues it. Used by the editor's Generate / Retry
 * / Regenerate buttons (and for seeded/legacy products with no pipeline run).
 */
export async function regenerateAvatarVideo(productId: string) {
  const shop = await getCurrentShop();
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id },
    select: { id: true },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  await prisma.aiJob.create({
    data: { productId, kind: "AVATAR_VIDEO", status: "QUEUED", input: {} },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { avatarVideoStatus: "QUEUED" },
  });
  await enqueueAvatarVideo(productId);

  revalidatePath(`/seller/products/${productId}`);
}

// ---------------------------------------------------------------- publishProduct

export async function publishProduct(productId: string) {
  const shop = await getCurrentShop();
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  if (!product.title || product.priceUsdCents <= 0) {
    throw new Error("INCOMPLETE_PRODUCT");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { status: "PENDING_REVIEW", publishedAt: new Date() },
  });

  revalidatePath(`/seller/products/${productId}`);
  revalidatePath("/seller/products");
}
