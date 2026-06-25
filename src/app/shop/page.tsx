// /shop — Amazon-style directory: breadcrumbs, two-column (sidebar + grid).

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import {
  FilterSidebar,
  SortControl,
} from "@/components/buyer/discovery-filters";
import { listProducts, listCategories, listRegions } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ShopDirectoryPage() {
  const [products, categories, regions] = await Promise.all([
    listProducts({ limit: 48 }),
    listCategories(),
    listRegions(),
  ]);

  return (
    <>
      <MarketplaceNav />
      <main className="bg-background">
        <div className="container mx-auto max-w-7xl px-4 pt-6">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent hover:underline">
              Home
            </Link>
            <span className="px-1.5">›</span>
            <span className="text-foreground">All categories</span>
          </nav>
        </div>

        <div className="container mx-auto max-w-7xl px-4 pb-14">
          <p className="mirage-eyebrow mt-6">The marketplace</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            All shops &amp; products
          </h1>

          <div className="mt-8 grid gap-6 lg:grid-cols-[24%_1fr]">
            <FilterSidebar
              categories={categories.map((c) => ({
                slug: c.slug,
                name: c.name,
                count: c._count.products,
              }))}
              regions={regions}
            />

            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <p className="text-sm">
                  <span className="font-medium">{products.length}</span>{" "}
                  <span className="text-muted-foreground">results</span>
                </p>
                <SortControl />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
                {products.length === 0 ? (
                  <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                    No products yet. Run <code>npm run db:seed</code>.
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
