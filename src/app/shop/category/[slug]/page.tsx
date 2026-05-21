// /shop/category/[slug] — products in a category.

import { notFound } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import { listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await listProducts({ categorySlug: slug, limit: 60 });

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
          <h1 className="text-3xl font-semibold tracking-tight">{category.name}</h1>
          <p className="text-muted-foreground">{products.length} products</p>
        </section>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products in this category yet.
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}
