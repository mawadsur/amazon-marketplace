// Amazon-inspired product card. Server-renderable (no client hooks, no
// framer-motion). Dense layout: image, title, stars, big price, delivery line.

import Link from "next/link";
import { Star } from "lucide-react";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";
import { effectiveTier } from "@/lib/tiers";
import { TierBadge } from "@/components/safety/tier-badge";

export type ProductCardProduct = {
  slug: string;
  title: string;
  priceUsdCents: number;
  images: { url: string }[];
  shop: {
    name: string;
    slug: string;
    region?: string | null;
    /** Optional verification tier; only VERIFIED + NEW produce a corner chip. */
    badge?: string | null;
    /** Optional trust signals — when present, drive the seller quality-tier chip. */
    trustScore?: number | null;
    manualTier?: string | null;
  };
  /** Optional review aggregate for storefront/product detail callers. */
  ratingAvg?: number | null;
  ratingCount?: number;
};

const FALLBACK_IMAGE = "https://placehold.co/600x600/F4E9E1/BE185D/png?text=No+Image";

/** Deterministic stub rating from the slug — used for grid surfaces that
 * don't ship the live aggregate. Stable across renders so SSR + hover state
 * agree, and so individual cards have distinct star counts. */
function stubRating(slug: string): { avg: number; count: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  // Rating 3.6–4.9 in 0.1 steps, count 12–487.
  const avg = 3.6 + ((h % 14) * 0.1);
  const count = 12 + ((h >>> 4) % 476);
  return { avg: Math.round(avg * 10) / 10, count };
}

function splitPrice(cents: number): { dollars: string; cents: string } {
  const formatted = formatUsd(cents); // "$87.99"
  const noSymbol = formatted.replace(/^\$/, "");
  const [d, c = "00"] = noSymbol.split(".");
  return { dollars: d, cents: c };
}

export function StarRow({
  avg,
  count,
  size = "sm",
}: {
  avg: number;
  count: number;
  size?: "sm" | "xs";
}) {
  const full = Math.round(avg);
  const px = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1">
      <span className="flex items-center" aria-label={`Rated ${avg} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={`${px} fill-current ${
              i < full ? "amzn-star" : "text-border"
            }`}
            aria-hidden
          />
        ))}
      </span>
      <span className="text-xs text-accent hover:underline">
        ({count.toLocaleString()})
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const cover = product.images[0]?.url ?? FALLBACK_IMAGE;
  const stub = stubRating(product.slug);
  const avg = product.ratingAvg ?? stub.avg;
  const count = product.ratingCount ?? stub.count;
  const { dollars, cents } = splitPrice(product.priceUsdCents);
  const tier =
    product.shop.trustScore != null
      ? effectiveTier({
          trustScore: product.shop.trustScore,
          manualTier: product.shop.manualTier,
        })
      : null;
  const badgeLabel =
    product.shop.badge === "VERIFIED"
      ? "Mirage Edit"
      : product.shop.badge === "NEW"
        ? "New In"
        : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
        {badgeLabel ? (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-card/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary shadow-sm">
            {badgeLabel}
          </span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {product.title}
        </h3>

        <StarRow avg={avg} count={count} />

        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-display text-xl font-semibold tabular-nums leading-none text-foreground">
            ${dollars}
            <span className="text-sm">.{cents}</span>
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            approx {approxInrFromUsdCents(product.priceUsdCents)}
          </span>
        </div>

        {product.shop.region ? (
          <p className="pt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            {product.shop.name} · {product.shop.region}
          </p>
        ) : (
          <p className="pt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            {product.shop.name}
          </p>
        )}

        {tier ? <TierBadge tier={tier} className="mt-1" /> : null}
      </div>
    </Link>
  );
}
