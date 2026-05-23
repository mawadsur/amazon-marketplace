// Amazon-inspired product card. Server-renderable (no client hooks, no
// framer-motion). Dense layout: image, title, stars, big price, delivery line.

import Link from "next/link";
import { Star } from "lucide-react";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";

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
  };
  /** Optional review aggregate for storefront/product detail callers. */
  ratingAvg?: number | null;
  ratingCount?: number;
};

const FALLBACK_IMAGE = "https://placehold.co/600x600/png?text=No+Image";

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

function deliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 9);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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
            className={`${px} ${
              i < full ? "fill-current text-amber-400" : "fill-current text-border"
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
  const badgeLabel =
    product.shop.badge === "VERIFIED"
      ? "Bazaar's Choice"
      : product.shop.badge === "NEW"
        ? "New"
        : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block cursor-pointer rounded-sm border border-border bg-card p-3 transition-all duration-150 hover:border-accent/40 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-muted">
        {badgeLabel ? (
          <span className="absolute left-1.5 top-1.5 z-10 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-sm">
            {badgeLabel}
          </span>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-contain p-2"
        />
      </div>

      <div className="mt-2 space-y-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
          {product.title}
        </h3>

        <StarRow avg={avg} count={count} />

        <div className="flex items-baseline gap-1.5">
          <span className="text-xs align-top text-foreground">$</span>
          <span className="text-xl font-bold tabular-nums leading-none text-foreground">
            {dollars}
          </span>
          <span className="text-xs font-bold tabular-nums text-foreground align-top">
            {cents}
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            approx {approxInrFromUsdCents(product.priceUsdCents)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          FREE delivery <span className="font-medium text-foreground">{deliveryDate()}</span>
        </p>

        {product.shop.region ? (
          <p className="pt-0.5 text-[11px] text-muted-foreground">
            from {product.shop.name} · {product.shop.region}
          </p>
        ) : (
          <p className="pt-0.5 text-[11px] text-muted-foreground">from {product.shop.name}</p>
        )}
      </div>
    </Link>
  );
}
