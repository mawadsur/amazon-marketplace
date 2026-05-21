// Background worker entrypoint. Run with `npm run dev:worker`.
//
// One Worker per AI queue, each one:
//   1) marks the AiJob RUNNING + sets startedAt
//   2) calls the appropriate stub from src/lib/stubs.ts
//   3) writes the output back to AiJob + any derived rows on Product/ProductImage
//   4) marks the AiJob SUCCEEDED (or FAILED on throw)
//
// All jobs share a tiny payload shape: { aiJobId, productId }.
// The worker reads the AiJob row to get inputs — this keeps queue messages
// small and the DB row the source of truth.
//
// Run from project root: `npm run dev:worker`
// Env is expected to be set in the shell (or via `node --env-file=.env`).

import * as Sentry from "@sentry/node";
import type { AiJob, Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import { makeWorker, type QueueName } from "@/lib/queue";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}
import {
  removeBackground,
  aiGenerateDescription,
  aiCategorize,
  usdCentsToInrPaise,
} from "@/lib/stubs";
import { recommendPrice } from "@/lib/pricing";
import { enqueueAfterCategorize } from "@/lib/ai-pipeline";
import { refundOrder, type RefundJobPayload } from "@/lib/payments";
import { generateStoryScript, type StoryVideoJobPayload } from "@/lib/story-video";

export type AiJobPayload = { aiJobId: string; productId: string };

// ---------------------------------------------------------------- helpers

async function runJob<T>(
  payload: AiJobPayload,
  fn: (job: AiJob, product: Product) => Promise<T>,
): Promise<T> {
  const job = await prisma.aiJob.update({
    where: { id: payload.aiJobId },
    data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
  });
  if (!job.productId) throw new Error(`AiJob ${job.id} has no productId`);
  const product = await prisma.product.findUniqueOrThrow({ where: { id: job.productId } });
  try {
    const out = await fn(job, product);
    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        finishedAt: new Date(),
        output: out as unknown as object,
      },
    });
    return out;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.aiJob.update({
      where: { id: job.id },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
    throw err;
  }
}

// ---------------------------------------------------------------- workers

function startBackgroundRemoval() {
  return makeWorker<AiJobPayload>("ai.background_removal", async (j) => {
    const payload = j.data;
    return runJob(payload, async (_aiJob, product) => {
      const original = await prisma.productImage.findFirst({
        where: { productId: product.id, kind: "ORIGINAL" },
        orderBy: { position: "asc" },
      });
      if (!original) throw new Error("No ORIGINAL image to process");
      const { outputUrl } = await removeBackground(original.url);
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: outputUrl,
          kind: "BG_REMOVED",
          position: 1,
          aiMetadata: { source: "stub", originalImageId: original.id },
        },
      });
      return { outputUrl };
    });
  });
}

function startDescription() {
  return makeWorker<AiJobPayload>("ai.description", async (j) => {
    const payload = j.data;
    return runJob(payload, async (_aiJob, product) => {
      const shop = await prisma.shop.findUniqueOrThrow({ where: { id: product.shopId } });
      const out = await aiGenerateDescription({
        sourceText: product.sourceText ?? "",
        sourceLang: product.sourceLang ?? "en",
        shopName: shop.name,
        category: shop.category,
      });
      await prisma.product.update({
        where: { id: product.id },
        data: {
          title: out.title,
          description: out.description,
          slug: await uniqueSlug(out.title, product.id),
        },
      });
      await attachTags(product.id, out.tags);
      return out;
    });
  });
}

function startPricing() {
  return makeWorker<AiJobPayload>("ai.pricing", async (j) => {
    const payload = j.data;
    return runJob(payload, async (_aiJob, product) => {
      const shop = await prisma.shop.findUniqueOrThrow({ where: { id: product.shopId } });
      const out = await recommendPrice({
        productId: product.id,
        category: shop.category,
        title: product.title,
        description: product.description,
        attributes: (product.attributes as Record<string, unknown> | null) ?? null,
      });
      await prisma.product.update({
        where: { id: product.id },
        data: {
          priceUsdCents: out.recommendedUsdCents,
          priceInrPaise: usdCentsToInrPaise(out.recommendedUsdCents),
        },
      });
      return out;
    });
  });
}

function startCategorization() {
  return makeWorker<AiJobPayload>("ai.categorization", async (j) => {
    const payload = j.data;
    return runJob(payload, async (_aiJob, product) => {
      // Categorization depends on title/description set by ai.description.
      // Re-read the product so we see the latest description-worker writes.
      const fresh = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      const out = await aiCategorize({
        title: fresh.title ?? "",
        description: fresh.description ?? "",
      });
      const cat = await prisma.category.upsert({
        where: { slug: out.category },
        update: {},
        create: { slug: out.category, name: out.category },
      });
      await prisma.product.update({
        where: { id: fresh.id },
        data: { categoryId: cat.id },
      });
      await attachTags(fresh.id, out.tags);
      return out;
    });
  });
}

// ---------------------------------------------------------------- util

async function uniqueSlug(title: string, productId: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "item";
  // Suffix with short product id segment for uniqueness.
  return `${base}-${productId.slice(-6)}`;
}

async function attachTags(productId: string, tagSlugs: string[]) {
  for (const raw of tagSlugs) {
    const slug = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    if (!slug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { slug, name: raw },
    });
    await prisma.product.update({
      where: { id: productId },
      data: { tags: { connect: { id: tag.id } } },
    });
  }
}

// ---------------------------------------------------------------- refunds

function startRefunds() {
  return makeWorker<RefundJobPayload>("payments.refund", async (j) => {
    // refundOrder is idempotent — replays in the retry queue are safe.
    await refundOrder({ orderId: j.data.orderId, reason: j.data.reason });
    return { ok: true };
  });
}

// ---------------------------------------------------------------- story video

function startStoryVideo() {
  return makeWorker<StoryVideoJobPayload>("ai.story_video", async (j) => {
    // Phase 1: generate + persist the structured storyboard.
    // Phase 2 (deferred): render to MP4 via Remotion + upload to S3, then
    // set Shop.storyVideoUrl.
    const script = await generateStoryScript(j.data.shopId);
    return { slides: script.slides.length, aiAssisted: script.aiAssisted };
  });
}

// ---------------------------------------------------------------- bootstrap

const workers = [
  startBackgroundRemoval(),
  startDescription(),
  startPricing(),
  startCategorization(),
  startRefunds(),
  startStoryVideo(),
];

const queueNames: QueueName[] = [
  "ai.background_removal",
  "ai.description",
  "ai.pricing",
  "ai.categorization",
  "payments.refund",
  "ai.story_video",
];

// Description finishing triggers categorization (sequential dependency).
workers[1]?.on("completed", async (job) => {
  const payload = job.data as AiJobPayload;
  await enqueueAfterCategorize(payload.productId);
});

for (const w of workers) {
  w.on("failed", (job, err) => {
    console.error(`[worker] ${w.name} job ${job?.id} failed:`, err.message);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err, {
        tags: { queue: w.name, jobId: job?.id ?? "unknown" },
      });
    }
  });
}

console.log(`[worker] listening on: ${queueNames.join(", ")}`);

async function shutdown() {
  console.log("[worker] shutting down...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
