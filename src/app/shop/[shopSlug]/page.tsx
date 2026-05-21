// /shop/[shopSlug] — shop storefront: banner, story, products.

import { notFound } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductCard } from "@/components/buyer/product-card";
import { VerificationBadge } from "@/components/safety/verification-badge";
import { TrustScoreBadge } from "@/components/safety/trust-score-badge";
import { getShopBySlug, regionNameToSlug } from "@/lib/catalog";
import { parseStoryScript } from "@/lib/story-video";

export const dynamic = "force-dynamic";

export default async function ShopPage(props: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await props.params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const banner = shop.bannerUrl ?? "https://placehold.co/1200x320/png?text=Shop";

  return (
    <>
      <MarketplaceNav />
      <main>
        <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt={shop.name} className="h-full w-full object-cover" />
        </div>
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{shop.name}</h1>
              <p className="text-sm text-muted-foreground">
                {shop.city},{" "}
                <Link
                  href={`/shop/region/${regionNameToSlug(shop.region)}`}
                  className="underline"
                >
                  {shop.region}
                </Link>{" "}
                ·{" "}
                <Link
                  href={`/shop/category/${shop.category}`}
                  className="underline"
                >
                  {shop.category}
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <VerificationBadge value={shop.badge} hideIfNone />
              <TrustScoreBadge score={shop.trustScore} />
            </div>
          </div>

          {shop.bio ? (
            <p className="mt-4 max-w-3xl text-base text-muted-foreground">{shop.bio}</p>
          ) : null}

          {(() => {
            const script = parseStoryScript(shop.storyScript);
            if (script && script.slides.length > 0) {
              return (
                <section className="mt-8 rounded-lg border bg-card p-6">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-semibold">Our story</h2>
                    {script.aiAssisted ? (
                      <span className="text-xs text-muted-foreground">
                        AI-narrated · written from {shop.name}&apos;s own words
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {script.slides.map((slide, i) => {
                      if (slide.kind === "title") {
                        return (
                          <div
                            key={i}
                            className="sm:col-span-2 rounded-md bg-muted p-6 text-center"
                          >
                            <p className="text-2xl font-semibold tracking-tight">
                              {slide.text}
                            </p>
                          </div>
                        );
                      }
                      if (slide.kind === "image") {
                        return (
                          <figure
                            key={i}
                            className="overflow-hidden rounded-md border bg-muted"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slide.imageUrl}
                              alt={slide.caption ?? ""}
                              className="h-48 w-full object-cover"
                            />
                            {slide.caption ? (
                              <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                                {slide.caption}
                              </figcaption>
                            ) : null}
                          </figure>
                        );
                      }
                      if (slide.kind === "products") {
                        return (
                          <p
                            key={i}
                            className="sm:col-span-2 text-center text-sm font-medium text-muted-foreground"
                          >
                            {slide.text}
                          </p>
                        );
                      }
                      return (
                        <p key={i} className="text-sm leading-relaxed">
                          {slide.text}
                        </p>
                      );
                    })}
                  </div>
                </section>
              );
            }
            if (shop.story) {
              return (
                <section className="mt-8 rounded-lg border bg-card p-6">
                  <h2 className="text-lg font-semibold">Our story</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                    {shop.story}
                  </p>
                </section>
              );
            }
            return null;
          })()}

          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">Products</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {shop.products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    slug: p.slug,
                    title: p.title,
                    priceUsdCents: p.priceUsdCents,
                    images: p.images,
                    shop: { name: shop.name, slug: shop.slug, region: shop.region },
                  }}
                />
              ))}
              {shop.products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This shop hasn&apos;t published any products yet.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
