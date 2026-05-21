// AI listing pipeline orchestrator.
//
// On product creation we kick off 4 AI jobs:
//   1. BACKGROUND_REMOVAL   — independent, runs in parallel
//   2. DESCRIPTION          — independent, runs in parallel (uses sourceText)
//   3. PRICING_SUGGESTION   — independent, runs in parallel (uses category)
//   4. CATEGORIZATION       — depends on (2); enqueued by the description worker
//                             after the title/description are written.
//
// Each AiJob row is created up-front so the polling UI can show all four
// statuses (QUEUED → RUNNING → SUCCEEDED). Workers update the rows directly.

import type { AiJobKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getQueue, type QueueName } from "@/lib/queue";

const QUEUE_FOR: Record<
  "BACKGROUND_REMOVAL" | "DESCRIPTION" | "PRICING_SUGGESTION" | "CATEGORIZATION",
  QueueName
> = {
  BACKGROUND_REMOVAL: "ai.background_removal",
  DESCRIPTION: "ai.description",
  PRICING_SUGGESTION: "ai.pricing",
  CATEGORIZATION: "ai.categorization",
};

export const PIPELINE_KINDS: AiJobKind[] = [
  "BACKGROUND_REMOVAL",
  "DESCRIPTION",
  "PRICING_SUGGESTION",
  "CATEGORIZATION",
];

export interface PipelineInput {
  productId: string;
  imageKey: string;
  sourceLang: string;
  sourceText: string;
}

/**
 * Create AiJob rows for all 4 pipeline steps and enqueue the three that can
 * run immediately (BG, description, pricing). Categorization is enqueued by
 * the description worker once title/description exist.
 */
export async function startPipeline(input: PipelineInput) {
  const jobs = await Promise.all(
    PIPELINE_KINDS.map((kind) =>
      prisma.aiJob.create({
        data: {
          productId: input.productId,
          kind,
          status: "QUEUED",
          input: {
            imageKey: input.imageKey,
            sourceLang: input.sourceLang,
            sourceText: input.sourceText,
          },
        },
      }),
    ),
  );

  // Enqueue the three independent jobs. Categorization is deferred.
  for (const job of jobs) {
    if (job.kind === "CATEGORIZATION") continue;
    const queueName = QUEUE_FOR[job.kind as keyof typeof QUEUE_FOR];
    await getQueue(queueName).add(job.kind, {
      aiJobId: job.id,
      productId: input.productId,
    });
  }

  return jobs;
}

/**
 * Called by the description worker after it writes title/description to the
 * Product. Enqueues the categorization job whose AiJob row already exists.
 */
export async function enqueueAfterCategorize(productId: string) {
  const job = await prisma.aiJob.findFirst({
    where: { productId, kind: "CATEGORIZATION", status: "QUEUED" },
  });
  if (!job) return;
  await getQueue("ai.categorization").add("CATEGORIZATION", {
    aiJobId: job.id,
    productId,
  });
}
