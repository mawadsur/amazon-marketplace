import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

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
  _count?: { products: number };
};

export function ShopCard({ shop }: { shop: ShopCardShop }) {
  const banner = shop.bannerUrl ?? "https://placehold.co/800x300/png?text=Shop";
  return (
    <Link href={`/shop/${shop.slug}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-[3/1] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <CardContent className="space-y-1 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold leading-snug">{shop.name}</h3>
            {shop.badge !== "NONE" ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {shop.badge.replace("_", " ").toLowerCase()}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {shop.city}, {shop.region} · {shop.category}
          </p>
          {shop.bio ? <p className="line-clamp-2 text-sm">{shop.bio}</p> : null}
          {shop._count ? (
            <p className="pt-1 text-xs text-muted-foreground">
              {shop._count.products} products
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
