// /cart — buyer cart contents, qty edit, remove, proceed to checkout.

import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { CartItemControls } from "@/components/buyer/cart-item-controls";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getOrCreateCart, computeCartTotals } from "@/lib/cart";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent("/cart")}`);
  }

  const cart = await getOrCreateCart(session.user.id);
  const totals = computeCartTotals(cart.items);

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
        </p>

        <section className="mt-8 space-y-4">
          {cart.items.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Button asChild className="mt-4">
                <Link href="/shop">Browse the marketplace</Link>
              </Button>
            </div>
          ) : (
            cart.items.map((item) => {
              const cover =
                item.product.images[0]?.url ?? "https://placehold.co/200x200/png?text=No+Image";
              const line = item.qty * item.product.priceUsdCents;
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
                    <img src={cover} alt={item.product.title} className="h-full w-full object-cover" />
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
                    <p className="text-sm">
                      {formatUsd(item.product.priceUsdCents)} each
                    </p>
                    <CartItemControls productId={item.product.id} qty={item.qty} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatUsd(line)}</p>
                    <p className="text-xs text-muted-foreground">
                      approx {approxInrFromUsdCents(line)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {cart.items.length > 0 ? (
          <section className="mt-8 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-semibold">{formatUsd(totals.subtotalUsdCents)}</p>
                <p className="text-sm text-muted-foreground">
                  approx {approxInrFromUsdCents(totals.subtotalUsdCents)}
                </p>
              </div>
              <Button asChild>
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Shipping and duties calculated at checkout.
            </p>
          </section>
        ) : null}
      </main>
    </>
  );
}
