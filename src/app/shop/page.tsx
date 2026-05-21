// /shop — marketplace directory. Featured shops + browse by category + region.

import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ShopCard } from "@/components/buyer/shop-card";
import {
  listShops,
  listCategories,
  listRegions,
  regionNameToSlug,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ShopDirectoryPage() {
  const [shops, categories, regions] = await Promise.all([
    listShops({ limit: 6 }),
    listCategories(),
    listRegions(),
  ]);

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Browse the marketplace</h1>
          <p className="max-w-2xl text-muted-foreground">
            Authentic Indian goods from vetted shops. Browse by category, region, or featured maker.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop/category/${c.slug}`}
                className="rounded-lg border bg-card p-6 transition hover:bg-accent"
              >
                <h3 className="text-lg font-medium">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c._count.products} products
                </p>
              </Link>
            ))}
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet. Run `npm run db:seed`.</p>
            ) : null}
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Regions</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {regions.map((r) => (
              <Link
                key={r.region}
                href={`/shop/region/${regionNameToSlug(r.region)}`}
                className="rounded-lg border bg-card p-6 transition hover:bg-accent"
              >
                <h3 className="text-lg font-medium">{r.region}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.shopCount} shops</p>
              </Link>
            ))}
            {regions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No regions yet.</p>
            ) : null}
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Featured shops</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
            {shops.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved shops yet.</p>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
