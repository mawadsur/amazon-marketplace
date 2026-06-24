// scripts/seed-avatar-videos.ts — Generate avatar try-on videos for the seeded
// catalog using Higgsfield, saving MP4s under public/seed so the feature is
// demoable with NO runtime key/cost (served straight from /public, like the
// seeded images). The runtime worker path uses S3 instead.
//
// Usage:
//   HIGGSFIELD_API_KEY=... DATABASE_URL=... npx tsx scripts/seed-avatar-videos.ts
//
// Flags:
//   --limit=20         max products to process (credit guard; default 10)
//   --category=textiles  only animate one category (textiles drape best)
//   --shops=a,b,c      restrict to these shop slugs
//   --skip-existing    skip products already READY (default ON)
//   --dry-run          print prompts + targets, no API calls / no writes

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildAvatarPrompt } from "../src/lib/stubs";

const prisma = new PrismaClient();
const API_BASE = "https://platform.higgsfield.ai/v1";

type Args = {
  limit: number;
  category: string | null;
  shops: string[] | null;
  skipExisting: boolean;
  dryRun: boolean;
};

function parseArgs(): Args {
  const out: Args = { limit: 10, category: null, shops: null, skipExisting: true, dryRun: false };
  for (const a of process.argv.slice(2)) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--skip-existing") out.skipExisting = true;
    else if (a === "--no-skip-existing") out.skipExisting = false;
    else if (a.startsWith("--limit=")) out.limit = Number(a.slice(8));
    else if (a.startsWith("--category=")) out.category = a.slice(11);
    else if (a.startsWith("--shops=")) out.shops = a.slice(8).split(",").map((s) => s.trim()).filter(Boolean);
  }
  return out;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Submit + poll a Higgsfield image→video job; returns the result URL. */
async function higgsfieldVideo(imageUrl: string, prompt: string): Promise<string> {
  const key = process.env.HIGGSFIELD_API_KEY;
  if (!key) throw new Error("HIGGSFIELD_API_KEY required (or use --dry-run)");
  const auth = { Authorization: `Bearer ${key}` };

  const submit = await fetch(`${API_BASE}/image2video`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, prompt, duration: 5 }),
  });
  if (!submit.ok) throw new Error(`submit ${submit.status}`);
  const sj = (await submit.json()) as { id?: string; job_id?: string };
  const jobId = sj.id ?? sj.job_id;
  if (!jobId) throw new Error("no job id");

  for (let i = 0; i < 60; i++) {
    await sleep(5_000);
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, { headers: auth });
    if (!res.ok) continue;
    const j = (await res.json()) as { status?: string; result?: { url?: string; video_url?: string } };
    const status = (j.status ?? "").toLowerCase();
    if (status === "completed" || status === "succeeded") {
      const url = j.result?.url ?? j.result?.video_url;
      if (url) return url;
    }
    if (status === "failed" || status === "error") throw new Error("job failed");
  }
  throw new Error("timeout");
}

async function main() {
  const args = parseArgs();
  console.log("Args:", args);

  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      ...(args.category ? { shop: { category: args.category } } : {}),
      ...(args.shops ? { shop: { slug: { in: args.shops } } } : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      attributes: true,
      avatarVideoStatus: true,
      shop: { select: { slug: true, category: true } },
      images: { orderBy: { position: "asc" }, take: 2, select: { url: true, kind: true } },
    },
    take: args.limit,
  });

  console.log(`Candidates: ${products.length}`);
  let done = 0;
  for (const p of products) {
    if (args.skipExisting && p.avatarVideoStatus === "READY") {
      console.log(`  skip (ready): ${p.slug}`);
      continue;
    }
    const img =
      p.images.find((i) => i.kind === "BG_REMOVED") ?? p.images[0];
    if (!img) {
      console.log(`  skip (no image): ${p.slug}`);
      continue;
    }
    const prompt = buildAvatarPrompt({
      title: p.title,
      category: p.shop.category,
      attributes: (p.attributes as Record<string, unknown> | null) ?? null,
    });

    if (args.dryRun) {
      console.log(`  [dry-run] ${p.slug}\n    prompt: ${prompt}`);
      continue;
    }

    try {
      console.log(`  generating: ${p.slug}…`);
      const remoteUrl = await higgsfieldVideo(img.url, prompt);
      const bytes = Buffer.from(await (await fetch(remoteUrl)).arrayBuffer());
      const rel = `seed/${p.shop.slug}/${p.slug}.mp4`;
      const dest = resolve("public", rel);
      await mkdir(resolve(dest, ".."), { recursive: true });
      await writeFile(dest, bytes);
      await prisma.product.update({
        where: { id: p.id },
        data: {
          avatarVideoUrl: `/${rel}`,
          avatarVideoPoster: p.images[0]?.url ?? null,
          avatarVideoStatus: "READY",
        },
      });
      done += 1;
      console.log(`    ✓ ${rel}`);
    } catch (err) {
      console.error(`    ✗ ${p.slug}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`Done. ${done} video(s) generated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
