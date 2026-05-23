// Horizontal rail of ProductCards. Used for "Customers also bought" /
// "Frequently bought together" on the PDP. Server component — pass in the
// already-fetched product list.

import Link from "next/link";
import { ProductCard } from "@/components/buyer/product-card";

type RailProduct = {
  id: string;
  slug: string;
  title: string;
  priceUsdCents: number;
  priceInrPaise: number;
  shop: { name: string; slug: string; region: string; badge: string };
  images: { url: string }[];
};

export function RelatedProductsRail({
  heading,
  products,
  emptyHint,
}: {
  heading: string;
  products: RailProduct[];
  emptyHint?: string;
}) {
  if (products.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-xl font-medium text-foreground">{heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{emptyHint}</p>
      </section>
    );
  }

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="text-xl font-medium text-foreground">{heading}</h2>
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[200px] flex-shrink-0 snap-start"
          >
            <ProductCard
              product={{
                slug: p.slug,
                title: p.title,
                priceUsdCents: p.priceUsdCents,
                images: p.images,
                shop: {
                  name: p.shop.name,
                  slug: p.shop.slug,
                  region: p.shop.region,
                  badge: p.shop.badge as never,
                },
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Frequently-bought-together card — denser layout with bundle total.
export function FrequentlyBoughtTogether({
  primary,
  others,
}: {
  primary: {
    slug: string;
    title: string;
    priceUsdCents: number;
    image: string | null;
  };
  others: RailProduct[];
}) {
  if (others.length === 0) return null;
  const items = [
    {
      slug: primary.slug,
      title: primary.title,
      priceUsdCents: primary.priceUsdCents,
      image: primary.image,
    },
    ...others.map((o) => ({
      slug: o.slug,
      title: o.title,
      priceUsdCents: o.priceUsdCents,
      image: o.images[0]?.url ?? null,
    })),
  ];
  const bundleTotalCents = items.reduce((a, p) => a + p.priceUsdCents, 0);
  const bundleTotal = `$${(bundleTotalCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="text-xl font-medium text-foreground">
        Frequently bought together
      </h2>
      <div className="mt-3 flex flex-col gap-4 rounded-sm border border-border bg-card p-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {items.map((p, i) => (
            <div key={p.slug} className="flex items-center gap-2">
              <Link
                href={`/products/${p.slug}`}
                className="block h-24 w-24 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-muted"
              >
                {p.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-contain p-1"
                  />
                ) : null}
              </Link>
              {i < items.length - 1 ? (
                <span aria-hidden="true" className="text-2xl font-light text-muted-foreground">
                  +
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="lg:ml-auto">
          <p className="text-sm text-muted-foreground">
            Total price for all {items.length} items:
          </p>
          <p className="text-xl font-medium tabular-nums text-foreground">
            {bundleTotal}
          </p>
          <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {items.map((p) => (
              <li key={p.slug} className="truncate">
                <Link
                  href={`/products/${p.slug}`}
                  className="amzn-link"
                >
                  {p.title}
                </Link>
                <span className="ml-1 tabular-nums">
                  ${(p.priceUsdCents / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
