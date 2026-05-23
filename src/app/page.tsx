// Amazon-style marketplace home. Hero banner, category cards, today's picks
// rail, regional explore row, and a trust strip. Server component.

import Link from "next/link";
import { Sparkles, Shield, Truck } from "lucide-react";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import {
  listProducts,
  listShops,
  listCategories,
  regionNameToSlug,
} from "@/lib/catalog";

// MarketplaceNav uses useSearchParams (via SearchBar) so this page can't be
// statically prerendered without a Suspense boundary. Force-dynamic is the
// right call for an interactive marketplace home.
export const dynamic = "force-dynamic";

const FALLBACK_THUMB = "https://placehold.co/300x300/png?text=Bazaar";

const FEATURED_CATEGORIES: Array<{ slug: string; title: string }> = [
  { slug: "handicrafts", title: "Handicrafts" },
  { slug: "textiles", title: "Textiles" },
  { slug: "jewelry", title: "Jewelry" },
];

const FEATURED_REGIONS = ["Rajasthan", "Tamil Nadu", "Gujarat", "Kerala"];

export default async function HomePage() {
  const [heroProducts, todaysPicks, categories, shops] = await Promise.all([
    listProducts({ limit: 4 }),
    listProducts({ limit: 10 }),
    listCategories(),
    listShops({ limit: 4 }),
  ]);

  // Per-category mini grids (4 thumbs each).
  const categoryThumbs = await Promise.all(
    FEATURED_CATEGORIES.map(async (c) => ({
      ...c,
      products: await listProducts({ categorySlug: c.slug, limit: 4 }),
    })),
  );

  // Per-region first product (for "More to explore" row).
  const regionThumbs = await Promise.all(
    FEATURED_REGIONS.map(async (region) => {
      const products = await listProducts({ region, limit: 1 });
      return { region, image: products[0]?.images[0]?.url ?? FALLBACK_THUMB };
    }),
  );

  return (
    <>
      <MarketplaceNav />
      <main className="bg-muted/40">
        {/* Breadcrumb */}
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <span className="text-foreground">Home</span>
          </nav>
        </div>

        {/* Hero banner */}
        <section className="container mx-auto max-w-7xl px-4 pb-4">
          <div className="grid items-center gap-4 rounded-sm border border-border bg-card p-6 lg:min-h-[280px] lg:grid-cols-2 lg:p-8">
            <div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Authentic Indian goods, direct from the source
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Hand-picked shops across India ship directly to your door in the
                United States. Duties prepaid, returns covered, every order
                backed by Buyer Protection.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-foreground transition-colors duration-150 hover:brightness-95"
              >
                Browse the marketplace
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {heroProducts.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group block cursor-pointer overflow-hidden rounded-sm border border-border bg-card transition-all duration-150 hover:border-accent/40 hover:shadow-md"
                >
                  <div className="aspect-square w-full bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]?.url ?? FALLBACK_THUMB}
                      alt={p.title}
                      loading="lazy"
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                </Link>
              ))}
              {heroProducts.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-sm border border-border bg-muted"
                    />
                  ))
                : null}
            </div>
          </div>
        </section>

        {/* Category cards row */}
        <section className="container mx-auto max-w-7xl px-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryThumbs.map((c) => (
              <div
                key={c.slug}
                className="flex flex-col rounded-sm border border-border bg-card p-4"
              >
                <h3 className="text-lg font-bold tracking-tight">
                  Shop {c.title}
                </h3>
                <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
                  {(c.products.length > 0
                    ? c.products.slice(0, 4)
                    : Array.from({ length: 4 }).map(() => null)
                  ).map((p, i) => (
                    <div
                      key={p?.id ?? i}
                      className="aspect-square overflow-hidden rounded-sm bg-muted"
                    >
                      {p ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]?.url ?? FALLBACK_THUMB}
                          alt={p.title}
                          loading="lazy"
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                <Link
                  href={`/shop/category/${c.slug}`}
                  className="mt-3 cursor-pointer text-sm font-medium text-accent hover:underline"
                >
                  Shop now in {c.title}
                </Link>
              </div>
            ))}

            {/* Featured shops tile */}
            <div className="flex flex-col rounded-sm border border-border bg-card p-4">
              <h3 className="text-lg font-bold tracking-tight">
                Featured shops
              </h3>
              <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
                {(shops.length > 0
                  ? shops.slice(0, 4)
                  : Array.from({ length: 4 }).map(() => null)
                ).map((s, i) => (
                  <div
                    key={s?.id ?? i}
                    className="aspect-square overflow-hidden rounded-sm bg-muted"
                  >
                    {s ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          s.bannerUrl ??
                          s.logoUrl ??
                          "https://placehold.co/300x300/png?text=Shop"
                        }
                        alt={s.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <Link
                href="/shop"
                className="mt-3 cursor-pointer text-sm font-medium text-accent hover:underline"
              >
                See all shops
              </Link>
            </div>
          </div>
        </section>

        {/* Today's Picks horizontal rail */}
        <section className="container mx-auto max-w-7xl px-4 pb-4">
          <div className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight">
                Today&apos;s Picks
              </h2>
              <Link
                href="/shop"
                className="cursor-pointer text-sm font-medium text-accent hover:underline"
              >
                See more
              </Link>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {todaysPicks.map((p) => (
                <div key={p.id} className="w-[200px] flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
              {todaysPicks.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">
                  No products yet. Run <code>npm run db:seed</code>.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* More to explore (regions) */}
        <section className="container mx-auto max-w-7xl px-4 pb-4">
          <div className="rounded-sm border border-border bg-card p-4">
            <h2 className="text-xl font-bold tracking-tight">
              More to explore
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {regionThumbs.map((r) => (
                <Link
                  key={r.region}
                  href={`/shop/region/${regionNameToSlug(r.region)}`}
                  className="group flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-background p-3 transition-all duration-150 hover:border-accent/40 hover:shadow-sm"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.image}
                      alt={r.region}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                      {r.region}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Shop the region
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Categories list quick-links — keep visible to suggest browsing */}
        {categories.length > 0 ? (
          <section className="container mx-auto max-w-7xl px-4 pb-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">All categories:</span>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop/category/${c.slug}`}
                  className="cursor-pointer text-accent hover:underline"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Trust strip */}
        <section className="border-t border-border bg-card">
          <div className="container mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "AI-assisted listings",
                body: "Sellers upload one photo; AI writes US-English descriptions, sets market-aware pricing, and tags the category.",
              },
              {
                icon: Shield,
                title: "Trust Engine + Buyer Protection",
                body: "Every shop earns a live Authenticity Score. Each paid order is auto-covered against loss, damage, or non-delivery.",
              },
              {
                icon: Truck,
                title: "Customs Pre-Clearance",
                body: "Duties and fees are prepaid at checkout (DDP). No surprise charges when your order arrives at your door.",
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-border bg-background text-accent">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
