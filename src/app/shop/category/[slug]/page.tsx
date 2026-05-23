// /shop/category/[slug] — Amazon-style category results. Sidebar + dense grid.

import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import { FilterSidebar, SortControl } from "@/app/shop/page";
import {
  listProducts,
  listCategories,
  listRegions,
} from "@/lib/catalog";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const [products, categories, regions] = await Promise.all([
    listProducts({ categorySlug: slug, limit: 60 }),
    listCategories(),
    listRegions(),
  ]);

  return (
    <>
      <MarketplaceNav />
      <main className="bg-muted/40">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent hover:underline">
              Home
            </Link>
            <span className="px-1.5">›</span>
            <Link href="/shop" className="hover:text-accent hover:underline">
              All categories
            </Link>
            <span className="px-1.5">›</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
        </div>

        <div className="container mx-auto max-w-7xl px-4 pb-10">
          <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shop {category.name.toLowerCase()} from vetted Indian artisans.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[24%_1fr]">
            <FilterSidebar
              categories={categories.map((c) => ({
                slug: c.slug,
                name: c.name,
                count: c._count.products,
              }))}
              regions={regions}
              activeCategory={slug}
            />

            <section className="rounded-sm border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <p className="text-sm">
                  <span className="font-medium">{products.length}</span>{" "}
                  <span className="text-muted-foreground">
                    results in {category.name}
                  </span>
                </p>
                <SortControl />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
                {products.length === 0 ? (
                  <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                    No products in this category yet.
                  </p>
                ) : null}
              </div>

              <footer className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                Page 1 of 1
              </footer>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
