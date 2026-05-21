// /wishlist — buyer wishlist contents.

import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { WishlistRemoveButton } from "@/components/buyer/wishlist-remove";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listWishlist } from "@/lib/wishlist";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent("/wishlist")}`);
  }

  const items = await listWishlist(session.user.id);

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Your wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>

        <section className="mt-8 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                You haven&apos;t saved any products yet.
              </p>
              <Button asChild className="mt-4">
                <Link href="/shop">Browse the marketplace</Link>
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const cover =
                item.product.images[0]?.url ?? "https://placehold.co/200x200/png?text=No+Image";
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start gap-4 rounded-lg border p-4"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="block h-24 w-24 overflow-hidden rounded-md bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt={item.product.title}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 space-y-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="text-base font-medium hover:underline"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      from{" "}
                      <Link href={`/shop/${item.product.shop.slug}`} className="underline">
                        {item.product.shop.name}
                      </Link>
                    </p>
                    <p className="text-sm font-semibold">
                      {formatUsd(item.product.priceUsdCents)}{" "}
                      <span className="font-normal text-muted-foreground">
                        (approx {approxInrFromUsdCents(item.product.priceUsdCents)})
                      </span>
                    </p>
                  </div>
                  <WishlistRemoveButton productId={item.product.id} />
                </div>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
