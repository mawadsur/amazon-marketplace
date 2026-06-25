// Amazon "Brand Store" thumbnail. Banner image + name + city + badge chip +
// "View shop" teal link. Server-renderable.

import Link from "next/link";
import { MapPin } from "lucide-react";
import { effectiveTier } from "@/lib/tiers";
import { TierBadge } from "@/components/safety/tier-badge";

export type ShopCardShop = {
  slug: string;
  name: string;
  bio: string | null;
  city: string;
  region: string;
  category: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  badge: string;
  trustScore?: number | null;
  manualTier?: string | null;
  _count?: { products: number };
};

const FALLBACK_BANNER = "https://placehold.co/600x240/F4E9E1/BE185D/png?text=Shop";

export function ShopCard({ shop }: { shop: ShopCardShop }) {
  const banner = shop.bannerUrl ?? FALLBACK_BANNER;
  const tier =
    shop.trustScore != null
      ? effectiveTier({ trustScore: shop.trustScore, manualTier: shop.manualTier })
      : null;
  const badgeLabel =
    shop.badge === "VERIFIED"
      ? "Verified"
      : shop.badge === "TOP_RATED"
        ? "Top rated"
        : shop.badge === "NEW"
          ? "New"
          : null;

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="group block cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="aspect-[5/2] w-full overflow-hidden rounded-t-lg bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner}
          alt={`${shop.name} storefront banner`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
            {shop.name}
          </h3>
          {badgeLabel ? (
            <span className="flex-shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">
              {badgeLabel}
            </span>
          ) : null}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden />
          {shop.city}, {shop.region}
        </p>
        {tier ? <TierBadge tier={tier} /> : null}
        {shop.bio ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{shop.bio}</p>
        ) : null}
        <div className="flex items-center justify-between pt-1">
          {shop._count ? (
            <span className="text-[11px] text-muted-foreground">
              {shop._count.products} products
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium text-accent group-hover:underline">
            View shop ›
          </span>
        </div>
      </div>
    </Link>
  );
}
