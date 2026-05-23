"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        <Card className="overflow-hidden border-border/60 bg-card/50 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <CardContent className="space-y-1 p-4">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
              {product.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {product.shop.name}
              {product.shop.region ? ` · ${product.shop.region}` : ""}
            </p>
            <p className="pt-1 text-sm font-semibold tabular-nums">
              {formatUsd(product.priceUsdCents)}{" "}
              <span className="font-normal text-muted-foreground">
                (approx {approxInrFromUsdCents(product.priceUsdCents)})
              </span>
            </p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
