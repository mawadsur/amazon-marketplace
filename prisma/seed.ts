// Seed script — idempotent. Run with `npm run db:seed`.
// Creates 3 categories, 6 approved shops, ~30 published products with images + tags.

import { PrismaClient } from "@prisma/client";
import { FX_USD_TO_INR } from "../src/lib/stubs";
import { CATEGORIES, SHOPS } from "./seed-data";

const prisma = new PrismaClient();

function placeholder(label: string, color = "ddd") {
  const safe = encodeURIComponent(label);
  return `https://placehold.co/800x800/${color}/333.png?text=${safe}`;
}

function tagSlugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

async function main() {
  console.log("Seeding categories...");
  const catBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name },
    });
    catBySlug[c.slug] = row.id;
  }

  console.log("Seeding shops + products...");
  for (const s of SHOPS) {
    const owner = await prisma.user.upsert({
      where: { email: s.ownerEmail },
      update: { role: "SELLER", name: s.name },
      create: { email: s.ownerEmail, name: s.name, role: "SELLER" },
    });

    const shopFields = {
      name: s.name,
      bio: s.bio,
      story: s.story,
      city: s.city,
      region: s.region,
      category: s.category,
      languages: s.languages,
      logoUrl: placeholder(s.name, s.logoColor),
      bannerUrl: placeholder(`${s.name}+banner`, s.logoColor),
      status: "APPROVED" as const,
      badge: "VERIFIED" as const,
      approvedAt: new Date(),
    };

    const shop = await prisma.shop.upsert({
      where: { slug: s.slug },
      update: shopFields,
      create: { ownerId: owner.id, slug: s.slug, ...shopFields },
    });

    for (const p of s.products) {
      const inrPaise = Math.round(p.priceUsdCents * FX_USD_TO_INR);
      const productFields = {
        title: p.title,
        description: p.description,
        priceUsdCents: p.priceUsdCents,
        priceInrPaise: inrPaise,
        categoryId: catBySlug[p.categorySlug],
        attributes: p.attributes,
        inventory: p.inventory,
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
      };
      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: productFields,
        create: { shopId: shop.id, slug: p.slug, ...productFields },
      });

      // Idempotent images: replace existing rows.
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      for (let i = 0; i < p.images.length; i++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: placeholder(p.images[i], s.logoColor),
            position: i,
            kind: "ORIGINAL",
          },
        });
      }

      // Tags — upsert then connect.
      const tagSlugs = p.tags.map(tagSlugify);
      for (let i = 0; i < tagSlugs.length; i++) {
        await prisma.tag.upsert({
          where: { slug: tagSlugs[i] },
          update: {},
          create: { slug: tagSlugs[i], name: p.tags[i] },
        });
      }
      await prisma.product.update({
        where: { id: product.id },
        data: { tags: { set: tagSlugs.map((slug) => ({ slug })) } },
      });
    }
  }

  const [shopCount, productCount] = await prisma.$transaction([
    prisma.shop.count({ where: { status: "APPROVED" } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
  ]);
  console.log(`Done. Shops=${shopCount} Products=${productCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
