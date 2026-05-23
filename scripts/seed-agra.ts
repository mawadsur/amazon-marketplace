// One-off: regenerate Agra Marble Inlay shop's 6 products. Used after the
// main seed-gemini.ts run failed for this shop on a JSON control-char issue.

import { GoogleGenAI, Modality } from "@google/genai";
import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";

const FX_USD_TO_INR = 83.5;
const SHOP = {
  slug: "agra-marble-inlay",
  craft: "pietra dura semi-precious stone inlay on white marble, Taj-school heritage",
};

function tagSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function san(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ");
}

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const prisma = new PrismaClient();

  const shop = await prisma.shop.findUnique({ where: { slug: SHOP.slug } });
  if (!shop) throw new Error("agra shop missing");
  console.log("SHOP id:", shop.id);

  const cat = await prisma.category.findUnique({ where: { slug: "handicrafts" } });
  if (!cat) throw new Error("handicrafts category missing");

  const prompt = `Generate 6 product listings for Agra Marble Inlay — ${SHOP.craft}. Return a JSON array of 6 objects. Each: { "title": "6-10 words", "description": "single string of 5 bullets joined by literal \\n, each starting with - ", "priceUsdCents": 6900-19900, "attributes": { "material", "dimensions", "color", "weight" }, "tags": ["3-5","lowercase-hyphen"], "imagePrompt": "20-30 word studio photo prompt" }. No markdown fences. Pure JSON. No literal newlines INSIDE a bullet — only between them.`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const text = res.text ?? "";
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  const specs = JSON.parse(san(text.slice(start, end + 1)));
  console.log("specs:", specs.length);

  const buyers = await prisma.user.findMany({
    where: { role: "BUYER", email: { endsWith: "@seed.bazaar.local" } },
    take: 15,
  });

  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const desc = Array.isArray(s.description) ? s.description.join("\n") : String(s.description);
    const productSlug = `${SHOP.slug}-${tagSlug(s.title)}-${i + 1}`.slice(0, 80);

    const product = await prisma.product.upsert({
      where: { slug: productSlug },
      update: {
        title: s.title, description: desc,
        priceUsdCents: s.priceUsdCents, priceInrPaise: Math.round(s.priceUsdCents * FX_USD_TO_INR),
        categoryId: cat.id, attributes: s.attributes, inventory: 10,
        status: "PUBLISHED", publishedAt: new Date(),
      },
      create: {
        shopId: shop.id, slug: productSlug, title: s.title, description: desc,
        priceUsdCents: s.priceUsdCents, priceInrPaise: Math.round(s.priceUsdCents * FX_USD_TO_INR),
        categoryId: cat.id, attributes: s.attributes, inventory: 10,
        status: "PUBLISHED", publishedAt: new Date(),
      },
    });
    console.log(`  [${i + 1}/6] ${s.title} ($${(s.priceUsdCents / 100).toFixed(2)})`);

    const imgRes = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: s.imagePrompt,
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });
    const parts = imgRes.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((p) => p.inlineData?.data);
    if (inline?.inlineData?.data) {
      const sharp = (await import("sharp")).default;
      const fs = await import("node:fs/promises");
      const webpPath = resolve("public/seed", SHOP.slug, `${productSlug}-1.webp`);
      await fs.mkdir(resolve(webpPath, ".."), { recursive: true });
      await sharp(Buffer.from(inline.inlineData.data, "base64"))
        .webp({ quality: 80 })
        .toFile(webpPath);
      const rel = webpPath.replace(/^.*\/public/, "");
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: { productId: product.id, url: rel, position: 0, kind: "ORIGINAL" },
      });
      console.log("    img:", rel);
    }

    const rRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write 10 customer reviews for: ${s.title}. Mix: 5-star (60%), 4-star (25%), 3-star (10%), 2-star (5%). Return JSON array of 10 objects [{"rating": N, "body": "..."}]. Body 15-50 words, casual US-English, specific (color/fit/packaging/shipping), no emojis.`,
      config: { responseMimeType: "application/json" },
    });
    const rText = rRes.text ?? "";
    const rArr = JSON.parse(san(rText.slice(rText.indexOf("["), rText.lastIndexOf("]") + 1)));
    const pool = [...buyers].sort(() => Math.random() - 0.5).slice(0, rArr.length);
    for (let ri = 0; ri < rArr.length && ri < pool.length; ri++) {
      const r = rArr[ri];
      await prisma.review.upsert({
        where: { productId_buyerId: { productId: product.id, buyerId: pool[ri].id } },
        update: {
          rating: Math.max(1, Math.min(5, Math.round(r.rating))),
          body: r.body,
        },
        create: {
          productId: product.id, buyerId: pool[ri].id,
          rating: Math.max(1, Math.min(5, Math.round(r.rating))),
          body: r.body,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 86400_000)),
        },
      });
    }
    console.log(`    +${rArr.length} reviews`);
  }

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
