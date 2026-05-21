// /products/[slug] — product detail page with gallery, shop backstory, reviews,
// add-to-cart, and wishlist toggle.

import { notFound } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { ProductGallery } from "@/components/buyer/product-gallery";
import { AddToCartButton } from "@/components/buyer/add-to-cart-button";
import { WishlistToggle } from "@/components/buyer/wishlist-toggle";
import { ReviewForm } from "@/components/buyer/review-form";
import { getProductBySlug } from "@/lib/catalog";
import { isWishlisted } from "@/lib/wishlist";
import { auth } from "@/lib/auth";
import {
  formatUsd,
  approxInrFromUsdCents,
  formatRating,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  if (product.status !== "PUBLISHED" || product.shop.status !== "APPROVED") notFound();

  const session = await auth();
  const isAuthed = !!session?.user?.id;
  const isBuyer = session?.user?.role === "BUYER";

  let wishlisted = false;
  if (isAuthed) {
    wishlisted = await isWishlisted(session.user.id, product.id);
  }

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs text-muted-foreground">
          <Link href="/shop" className="underline">
            Marketplace
          </Link>{" "}
          ·{" "}
          <Link href={`/shop/${product.shop.slug}`} className="underline">
            {product.shop.name}
          </Link>
        </p>

        <div className="mt-4 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} title={product.title} />

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                from{" "}
                <Link href={`/shop/${product.shop.slug}`} className="underline">
                  {product.shop.name}
                </Link>{" "}
                · {product.shop.city}, {product.shop.region}
              </p>
              <p className="mt-1 text-sm">
                Rating: {formatRating(product.ratingAvg)}{" "}
                <span className="text-muted-foreground">({product.ratingCount} reviews)</span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-semibold">{formatUsd(product.priceUsdCents)}</p>
              <p className="text-sm text-muted-foreground">
                approx {approxInrFromUsdCents(product.priceUsdCents)}
              </p>
            </div>

            {product.description ? (
              <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <AddToCartButton productId={product.id} isAuthed={isAuthed} />
              <WishlistToggle
                productId={product.id}
                isAuthed={isAuthed}
                initialWishlisted={wishlisted}
              />
            </div>

            {product.inventory < 5 && product.inventory > 0 ? (
              <p className="text-sm text-destructive">
                Only {product.inventory} left in stock.
              </p>
            ) : null}
            {product.inventory === 0 ? (
              <p className="text-sm text-destructive">Currently out of stock.</p>
            ) : null}

            {product.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {product.shop.story ? (
          <section className="mt-12 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">About {product.shop.name}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
              {product.shop.story}
            </p>
            <p className="mt-3 text-sm">
              <Link href={`/shop/${product.shop.slug}`} className="underline">
                Visit shop →
              </Link>
            </p>
          </section>
        ) : null}

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold">Reviews</h2>
          <ReviewForm productId={product.id} isAuthed={isAuthed} isBuyer={isBuyer} />
          <ul className="space-y-4">
            {product.reviews.map((r) => (
              <li key={r.id} className="rounded-lg border p-4">
                <p className="text-sm font-medium">
                  {r.buyer.name ?? "Anonymous buyer"} · {r.rating}/5
                </p>
                {r.body ? (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{r.body}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
            {product.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
            ) : null}
          </ul>
        </section>
      </main>
    </>
  );
}
