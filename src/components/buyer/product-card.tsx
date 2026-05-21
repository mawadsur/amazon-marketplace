// Compact product card used in grids (category, shop, search, wishlist).
// Server component — uses Next Link for navigation.

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";

export type ProductCardProduct = {
  slug: string;
  title: string;
  priceUsdCents: number;
  images: { url: string }[];
  shop: { name: string; slug: string; region?: string | null };
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const cover = product.images[0]?.url ?? "https://placehold.co/800x800/png?text=No+Image";
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-square w-full overflow-hidden bg-muted">
          {/* Use plain img — placeholder URLs aren't in next/image domains */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={product.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <CardContent className="space-y-1 p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.title}</h3>
          <p className="text-xs text-muted-foreground">
            {product.shop.name}
            {product.shop.region ? ` · ${product.shop.region}` : ""}
          </p>
          <p className="pt-1 text-sm font-semibold">
            {formatUsd(product.priceUsdCents)}{" "}
            <span className="font-normal text-muted-foreground">
              (approx {approxInrFromUsdCents(product.priceUsdCents)})
            </span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
