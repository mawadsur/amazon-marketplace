// scripts/seed-gemini.ts — Generate realistic shops + products + reviews using Gemini.
//
// Usage:
//   GEMINI_API_KEY=... DATABASE_URL=... npx tsx scripts/seed-gemini.ts
//
// Flags:
//   --shops=12       number of seller shops to (re)create
//   --products=6     products per shop
//   --reviews=10     reviews per product (averaged across buyer pool)
//   --skip-images    use placeholders instead of calling Gemini image gen
//   --dry-run        log what would happen, no DB writes
//
// Idempotent: shops and products upsert by slug. Re-runs replace images +
// description but keep order history + wishlist links intact.

import { GoogleGenAI, Modality } from "@google/genai";
import { PrismaClient, type Prisma } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FX_USD_TO_INR } from "../src/lib/stubs";

type Args = { shops: number; products: number; reviews: number; skipImages: boolean; dryRun: boolean };

function parseArgs(): Args {
  const out: Args = { shops: 12, products: 6, reviews: 10, skipImages: false, dryRun: false };
  for (const a of process.argv.slice(2)) {
    if (a === "--skip-images") out.skipImages = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--shops=")) out.shops = Number(a.slice(8));
    else if (a.startsWith("--products=")) out.products = Number(a.slice(11));
    else if (a.startsWith("--reviews=")) out.reviews = Number(a.slice(10));
  }
  return out;
}

const SHOP_ARCHETYPES: Array<{
  slug: string;
  name: string;
  city: string;
  region: string;
  category: "handicrafts" | "textiles" | "jewelry";
  craft: string;
  languages: string[];
}> = [
  { slug: "kalpana-block-prints", name: "Kalpana Block Prints", city: "Jaipur", region: "Rajasthan", category: "textiles", craft: "hand block-printed cotton textiles using natural indigo and madder dyes", languages: ["en", "hi"] },
  { slug: "rohan-meenakari", name: "Rohan Meenakari Atelier", city: "Jaipur", region: "Rajasthan", category: "jewelry", craft: "meenakari enamel jewelry on 925 sterling silver, generational technique", languages: ["en", "hi"] },
  { slug: "thanjavur-bronze-works", name: "Thanjavur Bronze Works", city: "Thanjavur", region: "Tamil Nadu", category: "handicrafts", craft: "lost-wax cast bronze idols and lamps from temple-town artisan family", languages: ["en", "ta"] },
  { slug: "kanchi-silk-house", name: "Kanchi Silk House", city: "Kanchipuram", region: "Tamil Nadu", category: "textiles", craft: "pure mulberry silk Kanchipuram sarees, zari woven, GI-tagged", languages: ["en", "ta"] },
  { slug: "ahmedabad-bandhani", name: "Bandhani by Anjali", city: "Ahmedabad", region: "Gujarat", category: "textiles", craft: "hand-tied bandhani dupattas and stoles in traditional Gujarati palette", languages: ["en", "gu", "hi"] },
  { slug: "kutch-mirror-craft", name: "Kutch Mirror Craft", city: "Bhuj", region: "Gujarat", category: "handicrafts", craft: "Kutchi mirror embroidery wall hangings, cushion covers, and bags", languages: ["en", "gu"] },
  { slug: "kerala-coir-studio", name: "Kerala Coir Studio", city: "Alleppey", region: "Kerala", category: "handicrafts", craft: "handwoven coir rugs, baskets, and natural fiber home decor", languages: ["en", "ml"] },
  { slug: "kannur-handlooms", name: "Kannur Handlooms", city: "Kannur", region: "Kerala", category: "textiles", craft: "100% cotton Kerala handloom kasavu sarees, bedsheets, and stoles", languages: ["en", "ml"] },
  { slug: "varanasi-brocade", name: "Varanasi Brocade Co.", city: "Varanasi", region: "Uttar Pradesh", category: "textiles", craft: "real-zari Banarasi silk brocade sarees and dupattas, Mughal motifs", languages: ["en", "hi"] },
  { slug: "moradabad-brass", name: "Moradabad Brass Lab", city: "Moradabad", region: "Uttar Pradesh", category: "handicrafts", craft: "hand-engraved brass decor, hammered serveware, and ritual lamps", languages: ["en", "hi"] },
  { slug: "kolhapuri-leather", name: "Kolhapuri Leather Co.", city: "Kolhapur", region: "Maharashtra", category: "handicrafts", craft: "GI-tagged Kolhapuri leather sandals, fully vegetable-tanned", languages: ["en", "mr", "hi"] },
  { slug: "agra-marble-inlay", name: "Agra Marble Inlay", city: "Agra", region: "Uttar Pradesh", category: "handicrafts", craft: "pietra dura semi-precious stone inlay on white marble, Taj-school heritage", languages: ["en", "hi"] },
];

const BUYER_NAMES = [
  "Sarah J.", "Michael R.", "Priya K.", "David L.", "Emma W.", "James M.", "Olivia P.", "Daniel T.",
  "Sophia G.", "Christopher B.", "Ava H.", "Matthew F.", "Isabella N.", "Andrew S.", "Mia C.", "Joshua A.",
  "Charlotte D.", "Ethan V.", "Amelia O.", "Ryan Q.", "Harper E.", "Tyler U.", "Evelyn Z.", "Brandon I.",
  "Abigail Y.", "Justin X.", "Ella W.", "Kevin V.", "Lily T.", "Aaron R.", "Zoe Q.", "Nathan P.",
  "Madison O.", "Jacob N.", "Layla M.", "Logan L.", "Riley K.", "Lucas J.", "Aria I.", "Mason H.",
  "Chloe G.", "Hunter F.", "Penelope E.", "Cameron D.", "Hannah C.", "Connor B.", "Grace A.", "Owen S.",
  "Aubrey T.", "Eli U.", "Scarlett V.", "Levi W.", "Victoria X.", "Henry Y.", "Aurora Z.", "Sebastian P.",
  "Stella Q.", "Carter R.", "Natalie S.", "Wyatt T.",
];

function tagSlugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function slugify(s: string) {
  return tagSlugify(s);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

async function gemText(ai: GoogleGenAI, prompt: string, json = false): Promise<string> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: json ? { responseMimeType: "application/json" } : undefined,
      });
      const text = res.text;
      if (!text) throw new Error("Gemini returned empty text");
      return text;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (attempt === 4) throw e;
      const backoff = 1500 * attempt;
      console.warn(`  gemText retry ${attempt}/3 after ${backoff}ms: ${msg.slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error("unreachable");
}

async function gemImage(ai: GoogleGenAI, prompt: string): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: prompt,
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      });
      const parts = res.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) {
        if (p.inlineData?.data) {
          return Buffer.from(p.inlineData.data, "base64");
        }
      }
      return null;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (attempt === 3) {
        console.warn(`  gemImage gave up: ${msg.slice(0, 120)}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  return null;
}

type ProductSpec = {
  title: string;
  description: string;
  priceUsdCents: number;
  attributes: Record<string, string>;
  tags: string[];
  imagePrompt: string;
};

async function generateProductSpecs(
  ai: GoogleGenAI,
  shop: (typeof SHOP_ARCHETYPES)[number],
  count: number,
): Promise<ProductSpec[]> {
  const prompt = `You are a senior copywriter for a cross-border marketplace selling authentic Indian artisan goods to US buyers.
Generate ${count} product listings for this shop:

Shop: ${shop.name}
City/region: ${shop.city}, ${shop.region}
Craft: ${shop.craft}
Category: ${shop.category}

Return a JSON array of exactly ${count} objects, each with this shape (no markdown fences, just JSON):
[
  {
    "title": "Product title, 6-10 words, real and specific (not 'Beautiful Handmade Item')",
    "description": "5 short bullet points starting with '- '. Each bullet 8-18 words. Cover: what it is, materials, dimensions/weight, how it's made, care/use. US-English. No emojis. No marketing fluff.",
    "priceUsdCents": integer between 2900 and 24900,
    "attributes": { "material": "...", "dimensions": "...", "color": "...", "weight": "..." },
    "tags": ["3-6 lowercase tags", "no spaces use hyphens", "category-relevant"],
    "imagePrompt": "A 20-30 word product photography prompt: 'Studio product photo of [item], [materials/colors], on white background, soft natural light, 45-degree angle, sharp focus, no logo, no text.'"
  }
]
Make products distinct from each other (different sub-products within ${shop.craft}). Use realistic prices. Vary materials and dimensions.`;
  const text = await gemText(ai, prompt, true);
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`No JSON array in response: ${text.slice(0, 200)}`);
  }
  const arr = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as ProductSpec[];
  return arr.slice(0, count);
}

async function generateShopCopy(
  ai: GoogleGenAI,
  shop: (typeof SHOP_ARCHETYPES)[number],
): Promise<{ bio: string; story: string }> {
  const prompt = `Write 2 short paragraphs for an Indian artisan shop on a cross-border marketplace.

Shop: ${shop.name}, ${shop.city}, ${shop.region}
Craft: ${shop.craft}

Return JSON: { "bio": "...", "story": "..." }
- bio: 2-3 sentences, ~30-45 words. Plain US-English. What they make, what makes them legit. No emojis.
- story: 4-5 sentences, ~80-110 words. Origin of the family/workshop, what makes the craft special, what a buyer gets that they wouldn't from a factory. No emojis, no all-caps, no marketing cliches.`;
  const text = await gemText(ai, prompt, true);
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
}

async function generateReviewBatch(
  ai: GoogleGenAI,
  productTitle: string,
  craft: string,
  count: number,
): Promise<Array<{ rating: number; body: string }>> {
  const prompt = `Write ${count} customer reviews for this product. Mix of 5-star (60%), 4-star (25%), 3-star (10%), 2-star (5%). One review may be lukewarm or critical.

Product: ${productTitle}
About the craft: ${craft}

Return JSON array of exactly ${count} objects: [{ "rating": 5, "body": "..." }, ...]
- body: 1-3 sentences, ~15-50 words, US-English, casual but specific. Mention something concrete (color, fit, packaging, shipping, weight, gift, comparison). No emojis. No all-caps. Vary sentence structure.`;
  const text = await gemText(ai, prompt, true);
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");
  const arr = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Array<{ rating: number; body: string }>;
  return arr.map((r) => ({ rating: Math.max(1, Math.min(5, Math.round(r.rating))), body: r.body }));
}

async function saveImage(
  buffer: Buffer | null,
  destPath: string,
  fallbackLabel: string,
): Promise<{ url: string }> {
  if (buffer) {
    const fs = await import("node:fs/promises");
    await fs.mkdir(resolve(destPath, ".."), { recursive: true });
    await fs.writeFile(destPath, buffer);
    const rel = destPath.replace(/^.*\/public/, "");
    return { url: rel };
  }
  // Fallback: deterministic placeholder
  const label = encodeURIComponent(fallbackLabel.slice(0, 40));
  return { url: `https://placehold.co/1024x1024/eeeeee/333.png?text=${label}` };
}

async function main() {
  const args = parseArgs();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

  console.log(`Seeding ${args.shops} shops × ${args.products} products × ${args.reviews} reviews. dryRun=${args.dryRun} skipImages=${args.skipImages}`);

  const ai = new GoogleGenAI({ apiKey });
  const prisma = new PrismaClient();

  // Buyer pool (60 users) — idempotent.
  console.log("Ensuring buyer pool...");
  const buyerIds: string[] = [];
  for (const name of BUYER_NAMES) {
    const email = `${slugify(name)}@seed.bazaar.local`;
    const row = await prisma.user.upsert({
      where: { email },
      update: { name, role: "BUYER" },
      create: { email, name, role: "BUYER" },
    });
    buyerIds.push(row.id);
  }

  // Categories must already exist (prisma/seed.ts seeds them). Look up by slug.
  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  for (const slug of ["handicrafts", "textiles", "jewelry"]) {
    if (!catBySlug[slug]) {
      const c = await prisma.category.upsert({
        where: { slug },
        update: { name: slug[0].toUpperCase() + slug.slice(1) },
        create: { slug, name: slug[0].toUpperCase() + slug.slice(1) },
      });
      catBySlug[slug] = c.id;
    }
  }

  const archetypes = SHOP_ARCHETYPES.slice(0, args.shops);

  for (let i = 0; i < archetypes.length; i++) {
    const a = archetypes[i];
    console.log(`\n[${i + 1}/${archetypes.length}] ${a.name} (${a.city}, ${a.region})`);

    const ownerEmail = `${a.slug}@seed.bazaar.local`;
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: { name: a.name, role: "SELLER" },
      create: { email: ownerEmail, name: a.name, role: "SELLER" },
    });

    const copy = await generateShopCopy(ai, a);
    console.log(`  bio (${copy.bio.length} chars), story (${copy.story.length} chars)`);

    // Logo + banner — optional; cheaper to skip when --skip-images.
    let logoUrl: string;
    let bannerUrl: string;
    if (args.skipImages) {
      logoUrl = `https://placehold.co/512x512/${pick(["fef3c7", "fde68a", "fbbf24", "f59e0b", "fcd34d"])}/333.png?text=${encodeURIComponent(a.name)}`;
      bannerUrl = `https://placehold.co/1600x400/${pick(["1f2937", "374151", "4b5563"])}/fff.png?text=${encodeURIComponent(a.name)}`;
    } else {
      const logoBuf = await gemImage(ai, `Minimal flat logo for "${a.name}", a small artisan workshop in ${a.region}, India, making ${a.craft}. Single color on cream background, no text, no people, gestural and traditional Indian motif. Centered, simple.`);
      const bannerBuf = await gemImage(ai, `Cinematic wide banner photo of a ${a.craft} workshop in ${a.city}, ${a.region}. Hands working on the craft. Warm natural light. No people's faces visible. 16:4 aspect ratio aesthetic. Photorealistic, magazine quality.`);
      ({ url: logoUrl } = await saveImage(logoBuf, resolve("public/seed", a.slug, "logo.png"), `${a.name} logo`));
      ({ url: bannerUrl } = await saveImage(bannerBuf, resolve("public/seed", a.slug, "banner.png"), `${a.name} banner`));
    }

    if (args.dryRun) {
      console.log(`  [dry-run] would upsert shop`);
      continue;
    }

    const shop = await prisma.shop.upsert({
      where: { slug: a.slug },
      update: {
        name: a.name, bio: copy.bio, story: copy.story, city: a.city, region: a.region,
        category: a.category, languages: a.languages, logoUrl, bannerUrl,
        status: "APPROVED", badge: "VERIFIED", approvedAt: new Date(),
      },
      create: {
        ownerId: owner.id, slug: a.slug, name: a.name, bio: copy.bio, story: copy.story,
        city: a.city, region: a.region, category: a.category, languages: a.languages,
        logoUrl, bannerUrl, status: "APPROVED", badge: "VERIFIED", approvedAt: new Date(),
      },
    });

    // Generate N products
    let specs: ProductSpec[];
    try {
      specs = await generateProductSpecs(ai, a, args.products);
      console.log(`  ${specs.length} product specs generated`);
    } catch (e: any) {
      console.error(`  product spec gen failed: ${e.message}. Skipping shop.`);
      continue;
    }

    for (let pi = 0; pi < specs.length; pi++) {
      const spec = specs[pi];
      const productSlug = `${a.slug}-${slugify(spec.title)}-${pi + 1}`.slice(0, 80);
      const priceInrPaise = Math.round(spec.priceUsdCents * FX_USD_TO_INR);
      const inventory = 5 + Math.floor(Math.random() * 25);

      console.log(`  [${pi + 1}/${specs.length}] ${spec.title} ($${(spec.priceUsdCents / 100).toFixed(2)})`);

      const product = await prisma.product.upsert({
        where: { slug: productSlug },
        update: {
          title: spec.title, description: spec.description,
          priceUsdCents: spec.priceUsdCents, priceInrPaise,
          categoryId: catBySlug[a.category], attributes: spec.attributes as Prisma.InputJsonValue,
          inventory, status: "PUBLISHED", publishedAt: new Date(),
        },
        create: {
          shopId: shop.id, slug: productSlug, title: spec.title, description: spec.description,
          priceUsdCents: spec.priceUsdCents, priceInrPaise,
          categoryId: catBySlug[a.category], attributes: spec.attributes as Prisma.InputJsonValue,
          inventory, status: "PUBLISHED", publishedAt: new Date(),
        },
      });

      // Tags
      for (const tname of spec.tags) {
        const tslug = tagSlugify(tname);
        if (!tslug) continue;
        await prisma.tag.upsert({ where: { slug: tslug }, update: { name: tname }, create: { slug: tslug, name: tname } });
      }
      await prisma.product.update({
        where: { id: product.id },
        data: { tags: { set: spec.tags.map(tagSlugify).filter(Boolean).map((slug) => ({ slug })) } },
      });

      // Images — 1 primary + 1 angle (optional via skip-images)
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      const images: Array<{ url: string }> = [];
      if (args.skipImages) {
        images.push({ url: `https://placehold.co/1024x1024/f5f5f5/333.png?text=${encodeURIComponent(spec.title.slice(0, 30))}` });
      } else {
        const buf1 = await gemImage(ai, spec.imagePrompt);
        const img1 = await saveImage(buf1, resolve("public/seed", a.slug, `${productSlug}-1.png`), spec.title);
        images.push(img1);
      }
      for (let ii = 0; ii < images.length; ii++) {
        await prisma.productImage.create({
          data: { productId: product.id, url: images[ii].url, position: ii, kind: "ORIGINAL" },
        });
      }

      // Reviews — chunked into batches of 5 to stay within text-gen limits
      try {
        const allReviews: Array<{ rating: number; body: string }> = [];
        const batches = Math.ceil(args.reviews / 5);
        for (let b = 0; b < batches; b++) {
          const want = Math.min(5, args.reviews - allReviews.length);
          if (want <= 0) break;
          const batch = await generateReviewBatch(ai, spec.title, a.craft, want);
          allReviews.push(...batch);
        }
        // One review per buyer (unique constraint on [productId, buyerId])
        const buyerPool = [...buyerIds].sort(() => Math.random() - 0.5).slice(0, allReviews.length);
        for (let ri = 0; ri < allReviews.length && ri < buyerPool.length; ri++) {
          const r = allReviews[ri];
          await prisma.review.upsert({
            where: { productId_buyerId: { productId: product.id, buyerId: buyerPool[ri] } },
            update: { rating: r.rating, body: r.body },
            create: {
              productId: product.id,
              buyerId: buyerPool[ri],
              rating: r.rating,
              body: r.body,
              createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 86400_000)),
            },
          });
        }
        console.log(`     +${allReviews.length} reviews`);
      } catch (e: any) {
        console.warn(`     reviews failed: ${e.message?.slice(0, 100)}`);
      }
    }
  }

  const [shopCount, productCount, reviewCount] = await prisma.$transaction([
    prisma.shop.count({ where: { status: "APPROVED" } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.review.count(),
  ]);
  console.log(`\nDone. shops=${shopCount} products=${productCount} reviews=${reviewCount}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
