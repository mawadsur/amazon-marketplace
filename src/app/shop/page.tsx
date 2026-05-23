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
      <main className="bg-muted/40">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent hover:underline">
              Home
            </Link>
            <span className="px-1.5">›</span>
            <span className="text-foreground">All categories</span>
          </nav>
        </div>

        <div className="container mx-auto max-w-7xl px-4 pb-10">
          <h1 className="text-2xl font-bold tracking-tight">All shops &amp; products</h1>

          <div className="mt-4 grid gap-4 lg:grid-cols-[24%_1fr]">
            <FilterSidebar
              categories={categories.map((c) => ({
                slug: c.slug,
                name: c.name,
                count: c._count.products,
              }))}
              regions={regions}
            />

            <section className="rounded-sm border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <p className="text-sm">
                  <span className="font-medium">{products.length}</span>{" "}
                  <span className="text-muted-foreground">results</span>
                </p>
                <SortControl />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
