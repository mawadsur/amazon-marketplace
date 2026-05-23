// /cart — Amazon-style shopping cart with two-column layout.
// Left: items list with image, title, controls, price. Right: sticky
// subtotal + Proceed to Buy. Empty state: centered call-to-action.

import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { CartItemControls } from "@/components/buyer/cart-item-controls";
import { auth } from "@/lib/auth";
import { getOrCreateCart, computeCartTotals } from "@/lib/cart";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

const FREE_SHIPPING_THRESHOLD_CENTS = 3500;

export default async function CartPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent("/cart")}`);
  }

  const cart = await getOrCreateCart(session.user.id);
  const totals = computeCartTotals(cart.items);
  const isEmpty = cart.items.length === 0;

  if (isEmpty) {
    return (
      <>
        <MarketplaceNav />
        <main className="bg-background pb-12">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="rounded-sm border border-border bg-card p-8 text-center">
              <h1 className="text-2xl font-medium text-foreground">
                Your Bazaar Cart is empty
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your shopping cart is waiting. Give it purpose.
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <Link href="/shop" className="amzn-link text-sm">
                  Shop today&apos;s deals
                </Link>
                <Link href="/sign-in" className="amzn-link text-sm">
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const qualifiesForFreeShipping =
    totals.subtotalUsdCents >= FREE_SHIPPING_THRESHOLD_CENTS;

  return (
    <>
      <MarketplaceNav />
      <main className="bg-background pb-12">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Link href="/" className="amzn-link">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span>Cart</span>
          </nav>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[74%_26%]">
            {/* Left: items */}
            <section className="rounded-sm border border-border bg-card p-4">
              <div className="flex items-baseline justify-between">
                <h1 className="text-2xl font-medium text-foreground">
                  Shopping Cart
                </h1>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  Price
                </p>
              </div>
              <hr className="my-3 border-border" />

              <ul className="divide-y divide-border">
                {cart.items.map((item) => {
                  const cover =
                    item.product.images[0]?.url ??
                    "https://placehold.co/200x200/png?text=No+Image";
                  const line = item.qty * item.product.priceUsdCents;
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-start gap-4 py-4"
                    >
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="block h-[130px] w-[130px] flex-shrink-0 cursor-pointer overflow-hidden rounded-sm bg-background"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cover}
                          alt={item.product.title}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      </Link>
                      <div className="min-w-0 flex-1 space-y-1">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="block text-base font-medium text-accent hover:text-destructive hover:underline"
                        >
                          {item.product.title}
                        </Link>
                        <p className="text-xs font-medium text-green-700">
                          In Stock
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sold by{" "}
                          <Link
                            href={`/shop/${item.product.shop.slug}`}
                            className="amzn-link"
                          >
                            {item.product.shop.name}
                          </Link>
                        </p>
                        <div className="pt-2">
                          <CartItemControls
                            productId={item.product.id}
                            qty={item.qty}
                          />
                        </div>
                      </div>
                      <p className="ml-auto text-base font-bold tabular-nums text-foreground">
                        {formatUsd(line)}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <div className="flex justify-end pt-2 text-base text-foreground">
                <p>
                  Subtotal ({totals.itemCount} item
                  {totals.itemCount === 1 ? "" : "s"}):{" "}
                  <span className="font-bold tabular-nums">
                    {formatUsd(totals.subtotalUsdCents)}
                  </span>
                </p>
              </div>
            </section>

            {/* Right: summary */}
            <aside className="lg:sticky lg:top-[110px] lg:self-start">
              <div className="rounded-sm border border-border bg-card p-3">
                {qualifiesForFreeShipping ? (
                  <p className="flex items-start gap-2 text-sm text-foreground">
                    <Check
                      className="mt-0.5 h-4 w-4 text-green-700"
                      aria-hidden="true"
                    />
                    <span>
                      Your order qualifies for{" "}
                      <span className="font-bold">FREE Delivery</span> on items
                      shipped by Bazaar.
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add {formatUsd(FREE_SHIPPING_THRESHOLD_CENTS - totals.subtotalUsdCents)} more
                    of eligible items to qualify for FREE Delivery.
                  </p>
                )}
                <p className="mt-3 text-base text-foreground">
                  Subtotal ({totals.itemCount} item
                  {totals.itemCount === 1 ? "" : "s"}):{" "}
                  <span className="font-bold tabular-nums">
                    {formatUsd(totals.subtotalUsdCents)}
                  </span>
                </p>
                <Link
                  href="/checkout"
                  className="amzn-button-yellow mt-3 w-full"
                >
                  Proceed to Buy
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
