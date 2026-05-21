// /shop/region/[slug] — shops + products from an Indian region.

import { notFound } from "next/navigation";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ShopCard } from "@/components/buyer/shop-card";
import { ProductCard } from "@/components/buyer/product-card";
import {
  listShops,
  listProducts,
  regionSlugToName,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function RegionPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const regionName = regionSlugToName(slug);

  const [shops, products] = await Promise.all([
    listShops({ region: regionName }),
    listProducts({ region: regionName, limit: 60 }),
  ]);

  if (shops.length === 0 && products.length === 0) notFound();

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Region</p>
          <h1 className="text-3xl font-semibold tracking-tight">{regionName}</h1>
          <p className="text-muted-foreground">
            {shops.length} shops · {products.length} products
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Shops</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Products from {regionName}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
