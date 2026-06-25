// /shop/region/[slug] — Amazon-style region results. Sidebar + dense grid.

import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import { ShopCard } from "@/components/buyer/shop-card";
import { FilterSidebar, SortControl } from "@/components/buyer/discovery-filters";
import {
  listShops,
  listProducts,
  listCategories,
  listRegions,
  regionSlugToName,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function RegionPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const regionName = regionSlugToName(slug);

  const [shops, products, categories, regions] = await Promise.all([
    listShops({ region: regionName, limit: 4 }),
    listProducts({ region: regionName, limit: 60 }),
    listCategories(),
    listRegions(),
  ]);

  if (shops.length === 0 && products.length === 0) notFound();

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
            <Link href="/shop" className="hover:text-accent hover:underline">
              All categories
            </Link>
            <span className="px-1.5">›</span>
            <span className="text-foreground">{regionName}</span>
          </nav>
        </div>

        <div className="container mx-auto max-w-7xl px-4 pb-14">
          <p className="mirage-eyebrow mt-6">Region</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {regionName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {shops.length} shops · {products.length} products
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[24%_1fr]">
            <FilterSidebar
              categories={categories.map((c) => ({
                slug: c.slug,
                name: c.name,
                count: c._count.products,
              }))}
              regions={regions}
              activeRegion={regionName}
            />

            <div className="space-y-6">
              {shops.length > 0 ? (
                <section className="rounded-lg border border-border bg-card p-5">
                  <h2 className="border-b border-border pb-3 font-display text-base font-bold tracking-tight">
                    Featured shops from {regionName}
                  </h2>
                  <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
                    {shops.map((s) => (
                      <ShopCard key={s.id} shop={s} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <p className="text-sm">
                    <span className="font-medium">{products.length}</span>{" "}
                    <span className="text-muted-foreground">
                      products from {regionName}
                    </span>
                  </p>
                  <SortControl />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                  {products.length === 0 ? (
                    <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
                      No products from this region yet.
                    </p>
                  ) : null}
                </div>

                <footer className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                  Page 1 of 1
                </footer>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
