// Mirage Sarees editorial home. Full-bleed serif hero, collection cards,
// New Arrivals rail, heritage/region row, brand-story band, service strip.
// Server component — uses the live catalog (textiles=sarees, jewelry, handicrafts).

import Link from "next/link";
import { Truck, Scissors, Sparkles, MapPin, TrendingUp, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { HeroCarousel, type HeroSlide } from "@/components/buyer/hero-carousel";
import { ProductCard } from "@/components/buyer/product-card";
import {
  listProducts,
  listShops,
  listCategories,
  regionNameToSlug,
} from "@/lib/catalog";

// SearchBar uses useSearchParams, so this interactive home is dynamic.
export const dynamic = "force-dynamic";

const FALLBACK_THUMB = "https://placehold.co/600x800/F4E9E1/BE185D/png?text=Mirage";

// "What are you looking for?" — editorial category entry points. Images are
// generated and live under /public/redesign; every href resolves to a real page.
const CATEGORY_TILES: Array<{ label: string; href: string; img: string }> = [
  { label: "Sarees", href: "/shop/category/textiles", img: "/redesign/category-sarees.jpg" },
  { label: "Lehenga & Suits", href: "/search?q=lehenga", img: "/redesign/category-lehenga.jpg" },
  { label: "Jewelry", href: "/shop/category/jewelry", img: "/redesign/category-jewelry.jpg" },
  { label: "Bridal Edit", href: "/search?q=bridal", img: "/redesign/category-bridal.jpg" },
  { label: "Accessories", href: "/shop/category/handicrafts", img: "/redesign/category-accessories.jpg" },
];

// Rotating hero slider — different items, each with a still (poster + fallback)
// and a video that plays only when the device permits (see HeroCarousel).
const HERO_SLIDES: HeroSlide[] = [
  {
    img: "/redesign/hero-tryon-poster.jpg",
    video: "/redesign/hero-tryon.mp4",
    alt: "A model lifts a rose-pink silk dress from the rack and tries it on",
    eyebrow: "Curated · Direct from India's boutiques",
    title: "Every drape tells a story.",
    ctaLabel: "Shop the collection",
    ctaHref: "/shop",
    badge: "AI try-on",
  },
  {
    img: "/redesign/banner-bridal.jpg",
    video: "/redesign/banner-bridal.mp4",
    alt: "Bride in a rose-pink and gold bridal lehenga in a palace setting",
    eyebrow: "The Bridal Edit",
    title: "Made for the big day.",
    ctaLabel: "Shop bridal",
    ctaHref: "/search?q=bridal",
  },
  {
    img: "/redesign/banner-festive.jpg",
    video: "/redesign/banner-festive.mp4",
    alt: "Woman twirling in a vibrant rose-pink and gold festive saree",
    eyebrow: "Festive new arrivals",
    title: "Freshly draped, just landed.",
    ctaLabel: "Shop new in",
    ctaHref: "/shop",
  },
  {
    img: "/redesign/banner-textile.jpg",
    video: "/redesign/banner-textile.mp4",
    alt: "Stacked silk sarees in rose, gold and cream on a wooden boutique table",
    eyebrow: "Straight from the loom",
    title: "Woven by India's finest.",
    ctaLabel: "Explore sarees",
    ctaHref: "/shop/category/textiles",
  },
];

// Shein-style quick-jump rail of circular category entry points. Photo circles
// reuse the generated tiles; utility circles (New In / Top Rated / Sale) use icons.
type QuickLink = { label: string; href: string; img?: string; icon?: LucideIcon };
const QUICK_LINKS: QuickLink[] = [
  { label: "Sarees", href: "/shop/category/textiles", img: "/redesign/category-sarees.jpg" },
  { label: "Lehengas", href: "/search?q=lehenga", img: "/redesign/category-lehenga.jpg" },
  { label: "Jewelry", href: "/shop/category/jewelry", img: "/redesign/category-jewelry.jpg" },
  { label: "Bridal", href: "/search?q=bridal", img: "/redesign/category-bridal.jpg" },
  { label: "Accessories", href: "/shop/category/handicrafts", img: "/redesign/category-accessories.jpg" },
  { label: "New In", href: "/shop", icon: Sparkles },
  { label: "Top Rated", href: "/search?sort=trust", icon: TrendingUp },
  { label: "Sale", href: "/search?q=sale", icon: Tag },
];

const FEATURED_REGIONS = ["Rajasthan", "Tamil Nadu", "Gujarat", "Kerala"];

export default async function HomePage() {
  const [newArrivals, categories, shops] = await Promise.all([
    listProducts({ limit: 10 }),
    listCategories(),
    listShops({ limit: 4 }),
  ]);

  const regionThumbs = await Promise.all(
    FEATURED_REGIONS.map(async (region) => {
      const products = await listProducts({ region, limit: 1 });
      return { region, image: products[0]?.images[0]?.url ?? FALLBACK_THUMB };
    }),
  );

  return (
    <>
      <MarketplaceNav />
      <main className="bg-background">
        {/* ===== Hero — rotating slider (video + editorial banners) ===== */}
        <HeroCarousel slides={HERO_SLIDES} />

        {/* ===== Quick category rail (Shein-style entry points) ===== */}
        <section className="border-b border-border bg-card">
          <div className="container mx-auto max-w-7xl px-4 py-6">
            <div className="flex items-start gap-5 overflow-x-auto pb-2 sm:justify-center sm:gap-8">
              {QUICK_LINKS.map((q) => {
                const Icon = q.icon;
                return (
                  <Link
                    key={q.label}
                    href={q.href}
                    className="group flex w-16 flex-shrink-0 flex-col items-center gap-2 sm:w-20"
                  >
                    <span className="relative block h-16 w-16 overflow-hidden rounded-full ring-1 ring-border transition-all duration-200 group-hover:-translate-y-0.5 group-hover:ring-primary/50 sm:h-20 sm:w-20">
                      {q.img ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={q.img}
                          alt={q.label}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : Icon ? (
                        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                      ) : null}
                    </span>
                    <span className="text-center text-xs font-medium text-foreground transition-colors group-hover:text-primary">
                      {q.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== What are you looking for? — category discovery ===== */}
        <section className="container mx-auto max-w-7xl px-4 py-14 lg:py-20">
          <div className="mb-8 text-center">
            <p className="mirage-eyebrow">What are you looking for?</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Find your edit
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORY_TILES.map((c, i) => (
              <Link
                key={c.label}
                href={c.href}
                className={`group relative block aspect-[3/4] overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border transition-shadow duration-300 hover:shadow-md ${
                  i === 4 ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={c.label}
                  loading={i < 3 ? "eager" : "lazy"}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-lg font-semibold text-background drop-shadow-sm">
                    {c.label}
                  </h3>
                  <span className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-background/85">
                    Shop now →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== New Arrivals rail ===== */}
        <section className="border-y border-border bg-muted/40">
          <div className="container mx-auto max-w-7xl px-4 py-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mirage-eyebrow">Just landed</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  New Arrivals
                </h2>
              </div>
              <Link href="/shop" className="amzn-link text-sm font-semibold">
                View all
              </Link>
            </div>
            {newArrivals.length > 0 ? (
              <div className="flex gap-5 overflow-x-auto pb-3">
                {newArrivals.map((p) => (
                  <div key={p.id} className="w-[220px] flex-shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">
                No products yet. Run <code>npm run db:seed</code>.
              </p>
            )}
          </div>
        </section>

        {/* ===== Heritage / regions ===== */}
        <section className="container mx-auto max-w-7xl px-4 py-14 lg:py-20">
          <div className="mb-8 text-center">
            <p className="mirage-eyebrow">Woven across India</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Shop by Region
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {regionThumbs.map((r) => (
              <Link
                key={r.region}
                href={`/shop/region/${regionNameToSlug(r.region)}`}
                className="group relative block aspect-square overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.image}
                  alt={r.region}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-foreground/30 transition-colors duration-300 group-hover:bg-foreground/45" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-2xl font-semibold text-background drop-shadow">
                    {r.region}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== Featured boutiques ===== */}
        {shops.length > 0 ? (
          <section className="border-t border-border bg-card">
            <div className="container mx-auto max-w-7xl px-4 py-14">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="mirage-eyebrow">Our partners</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                    Featured Boutiques
                  </h2>
                </div>
                <Link href="/shop" className="amzn-link text-sm font-semibold">
                  All boutiques
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {shops.slice(0, 4).map((s) => (
                  <Link
                    key={s.id}
                    href={`/shop/${s.slug}`}
                    className="group block overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          s.bannerUrl ??
                          s.logoUrl ??
                          "https://placehold.co/600x340/F4E9E1/BE185D/png?text=Boutique"
                        }
                        alt={s.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                        {s.name}
                      </h3>
                      {s.region ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {s.region}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ===== Brand story band ===== */}
        <section className="bg-subheader text-background">
          <div className="container mx-auto max-w-3xl px-4 py-16 text-center lg:py-24">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-background/70">
              Our Story
            </p>
            <blockquote className="mt-5 font-display text-2xl font-medium leading-snug sm:text-3xl">
              &ldquo;Atlanta&apos;s leading Indian clothing provider since 2001.
              We specialize in sarees, lehengas, anarkalis, sherwanis and every
              Indian wedding attire — chosen with care, worn with pride.&rdquo;
            </blockquote>
            <Link
              href="/about/story"
              className="mt-8 inline-flex h-11 cursor-pointer items-center justify-center rounded-sm border border-background/50 px-6 text-sm font-semibold uppercase tracking-wide text-background transition-colors duration-200 hover:bg-background hover:text-foreground"
            >
              Read our story
            </Link>
          </div>
        </section>

        {/* ===== Service strip ===== */}
        <section className="border-t border-border bg-background">
          <div className="container mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
            {[
              {
                icon: Truck,
                title: "Free shipping over $99",
                body: "Duties prepaid at checkout — no surprise charges when your order arrives at your door.",
              },
              {
                icon: Scissors,
                title: "Sizing & alterations",
                body: "Visit us in Decatur for expert fitting and alterations, or follow our online sizing guide.",
              },
              {
                icon: Sparkles,
                title: "Authenticity, assured",
                body: "Every boutique is vetted and every paid order is covered by Buyer Protection.",
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-border text-primary">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All categories quick-links */}
        {categories.length > 0 ? (
          <section className="border-t border-border bg-muted/40">
            <div className="container mx-auto max-w-7xl px-4 py-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide text-foreground">
                  Browse:
                </span>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop/category/${c.slug}`}
                    className="amzn-link"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
