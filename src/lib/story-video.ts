// Provenance Stories (D3 v1).
//
// Generates a structured storyboard (slides) for a shop's "Our Story" panel.
// The actual MP4 render via Remotion is Phase 2 — it requires Chromium in a
// production-grade env. Phase 1 ships the script generation + UI; the slides
// are rendered to HTML directly on the shop page so the differentiator (the
// human story) is visible immediately.

import { prisma } from "@/lib/db";
import { generateText } from "@/lib/ai";
import { env } from "@/lib/env";
import { getQueue } from "@/lib/queue";

// ---------------------------------------------------------------- types

export type StorySlide =
  | { kind: "title"; text: string }
  | { kind: "text"; text: string }
  | { kind: "image"; imageUrl: string; caption?: string }
  | { kind: "products"; text: string };

export type StoryScript = {
  slides: StorySlide[];
  /** ISO timestamp of last generation, for staleness checks. */
  generatedAt: string;
  /** Whether Claude composed it or the template fallback ran. */
  aiAssisted: boolean;
};

export type StoryVideoJobPayload = { shopId: string };

// ---------------------------------------------------------------- queue

export async function enqueueStoryVideo(shopId: string): Promise<void> {
  const q = getQueue<StoryVideoJobPayload>("ai.story_video");
  await q.add(
    "story",
    { shopId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 86_400 },
    },
  );
}

// ---------------------------------------------------------------- generation

type ShopForStory = {
  id: string;
  name: string;
  bio: string | null;
  story: string | null;
  city: string;
  region: string;
  category: string;
  bannerUrl: string | null;
  logoUrl: string | null;
  products: Array<{ title: string; images: Array<{ url: string }> }>;
};

async function loadShopForStory(shopId: string): Promise<ShopForStory> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        orderBy: [{ publishedAt: "desc" }],
        take: 6,
        select: {
          title: true,
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });
  if (!shop) throw new Error("SHOP_NOT_FOUND");
  return {
    id: shop.id,
    name: shop.name,
    bio: shop.bio,
    story: shop.story,
    city: shop.city,
    region: shop.region,
    category: shop.category,
    bannerUrl: shop.bannerUrl,
    logoUrl: shop.logoUrl,
    products: shop.products,
  };
}

function templateScript(shop: ShopForStory): StoryScript {
  const slides: StorySlide[] = [];
  slides.push({ kind: "title", text: shop.name });
  slides.push({
    kind: "text",
    text:
      shop.bio ||
      `${shop.name} crafts ${shop.category} from ${shop.city}, ${shop.region}.`,
  });
  if (shop.story) {
    slides.push({ kind: "text", text: shop.story });
  }
  if (shop.bannerUrl) {
    slides.push({ kind: "image", imageUrl: shop.bannerUrl });
  }
  for (const p of shop.products.slice(0, 3)) {
    if (p.images[0]?.url) {
      slides.push({ kind: "image", imageUrl: p.images[0].url, caption: p.title });
    }
  }
  slides.push({
    kind: "products",
    text: `Browse ${shop.products.length} hand-picked ${shop.category} from ${shop.name}.`,
  });
  return { slides, generatedAt: new Date().toISOString(), aiAssisted: false };
}

async function claudeScript(shop: ShopForStory): Promise<StoryScript | null> {
  if (!env.ANTHROPIC_API_KEY) return null;

  const sys = `You write a 4-6 slide micro-story for an Indian artisan shop's "Our Story" panel on a marketplace. Voice: warm, concrete, sells the human. No superlatives, no marketing-speak. Each slide is one sentence (max 22 words). Output strict JSON only.`;

  const ctx = `Shop: ${shop.name}
City/region: ${shop.city}, ${shop.region}
Category: ${shop.category}
Bio: ${shop.bio ?? "(none)"}
Story (seller-provided): ${shop.story ?? "(none)"}
Product titles: ${shop.products.map((p) => p.title).join(", ").slice(0, 400)}`;

  const prompt = `${ctx}

Return JSON: { "slides": [ { "kind": "title", "text": "..." }, { "kind": "text", "text": "..." }, ... ] }
Use 4-6 slides total. First slide MUST be kind="title" with the shop name. Mix "text" (sentences) and "image" (referencing the seller-provided product photos by index, e.g. {"kind":"image","caption":"Title here"}). End with one "products" slide inviting browse.`;

  try {
    const { text } = await generateText({ system: sys, prompt, maxTokens: 600 });
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as { slides?: unknown };
    if (!Array.isArray(parsed.slides)) return null;
    // Whitelist + sanitize. Map image slides without imageUrl to the first
    // matching product photo by caption, then fall back to banner.
    const allImages = shop.products
      .map((p, i) => ({ url: p.images[0]?.url ?? "", title: p.title, idx: i }))
      .filter((p) => p.url);
    let imgIdx = 0;
    const slides: StorySlide[] = [];
    for (const raw of parsed.slides) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      const kind = String(r.kind ?? "");
      if (kind === "title" && typeof r.text === "string") {
        slides.push({ kind: "title", text: r.text });
      } else if (kind === "text" && typeof r.text === "string") {
        slides.push({ kind: "text", text: r.text });
      } else if (kind === "image") {
        const fromCaption = typeof r.caption === "string" ? r.caption : null;
        const matched = fromCaption
          ? allImages.find((p) => p.title.toLowerCase() === fromCaption.toLowerCase())
          : null;
        const img = matched ?? allImages[imgIdx++ % Math.max(1, allImages.length)];
        if (img) {
          slides.push({
            kind: "image",
            imageUrl: img.url,
            caption: fromCaption ?? img.title,
          });
        }
      } else if (kind === "products" && typeof r.text === "string") {
        slides.push({ kind: "products", text: r.text });
      }
    }
    if (slides.length < 3) return null; // too thin — fall back to template
    return { slides, generatedAt: new Date().toISOString(), aiAssisted: true };
  } catch {
    return null;
  }
}

/**
 * Generate and persist the storyboard for a shop. Idempotent — re-running
 * overwrites the previous script. Returns the saved StoryScript.
 */
export async function generateStoryScript(shopId: string): Promise<StoryScript> {
  const shop = await loadShopForStory(shopId);
  const script = (await claudeScript(shop)) ?? templateScript(shop);
  await prisma.shop.update({
    where: { id: shopId },
    data: { storyScript: script as unknown as object },
  });
  return script;
}

/** Type-safe accessor for the Shop.storyScript JSON column. */
export function parseStoryScript(value: unknown): StoryScript | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.slides)) return null;
  return value as StoryScript;
}
