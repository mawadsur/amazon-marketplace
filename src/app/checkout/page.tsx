// /checkout — Amazon-style "Place your order" page.
// Left: shipping address form + items being shipped.
// Right: sticky order summary with landed-cost breakdown + Place order CTA.

import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { auth } from "@/lib/auth";
import { getOrCreateCart, computeCartTotals } from "@/lib/cart";
import { formatUsd } from "@/lib/format";
import { estimateLanded } from "@/lib/customs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?next=${encodeURIComponent("/checkout")}`);
  }

  const cart = await getOrCreateCart(session.user.id);
  const { itemCount } = computeCartTotals(cart.items);

  if (itemCount === 0) {
    return (
      <>
        <MarketplaceNav />
        <main className="bg-background pb-12">
          <div className="mx-auto max-w-3xl px-4 py-10 text-center">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Your cart is empty
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add something before checking out.
            </p>
            <Link href="/shop" className="amzn-button-yellow mt-4">
              Continue shopping
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Pull each item's shop category so the landed-cost duty applies correctly.
  // Pre-submit we don't know destination — default to US. Final amount is
  // recomputed in /api/checkout using the submitted address.
  const productIds = cart.items.map((it) => it.product.id);
  const shopsByProductId = await prisma.product
    .findMany({
      where: { id: { in: productIds } },
      select: { id: true, shop: { select: { category: true } } },
    })
    .then((rows) =>
      Object.fromEntries(rows.map((r) => [r.id, r.shop.category])),
    );

  const landed = estimateLanded(
    cart.items.map((it) => ({
      category: shopsByProductId[it.product.id] ?? "handicrafts",
      lineSubtotalUsdCents: it.qty * it.product.priceUsdCents,
    })),
    "US",
  );

  // Group duty-incurring lines by category for the disclosure row.
  const dutyByCategory = new Map<string, { rate: number; cents: number }>();
  for (const line of landed.lines) {
    if (line.lineDutyUsdCents <= 0) continue;
    const prev = dutyByCategory.get(line.category) ?? {
      rate: line.rate,
      cents: 0,
    };
    prev.cents += line.lineDutyUsdCents;
    dutyByCategory.set(line.category, prev);
  }
  const dutyCategoriesLabel = Array.from(dutyByCategory.entries())
    .map(([cat, { rate }]) => `${cat} ${(rate * 100).toFixed(1)}%`)
    .join(", ");

  return (
    <>
      <MarketplaceNav />
      <main className="bg-background pb-12">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Place your order
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">
              1. Shipping address
            </span>{" "}
            · 2. Payment · 3. Place order
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[70%_30%]">
            {/* Left column: address + items */}
            <div className="space-y-4">
              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Shipping address
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  We&apos;ll send your order updates here.
                </p>
                <div className="mt-4">
                  <CheckoutForm />
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Items being shipped
                </h2>
                <ul className="mt-3 divide-y divide-border">
                  {cart.items.map((it) => {
                    const line = it.qty * it.product.priceUsdCents;
                    const cover = it.product.images[0]?.url;
                    return (
                      <li
                        key={it.id}
                        className="flex items-start gap-3 py-3 text-sm"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-background">
                          {cover ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={cover}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-contain"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight text-foreground">
                            {it.product.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {it.product.shop.name} · Qty {it.qty}
                          </p>
                        </div>
                        <p className="text-sm font-medium tabular-nums text-foreground">
                          {formatUsd(line)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            {/* Right column: order summary */}
            <aside className="lg:sticky lg:top-[110px] lg:self-start">
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <button
                  type="submit"
                  form="checkout-form"
                  className="amzn-button-yellow w-full"
                >
                  Place your order
                </button>
                <p className="mt-2 text-xs text-muted-foreground">
                  By placing your order, you agree to Shezmin&apos;s terms and
                  conditions.
                </p>

                <h2 className="mt-4 border-b border-border pb-2 font-display text-base font-semibold text-foreground">
                  Order Summary
                </h2>

                <dl className="mt-3 space-y-2 text-sm">
                  <Row
                    label="Items:"
                    value={formatUsd(landed.subtotalUsdCents)}
                  />
                  <Row
                    label="Shipping &amp; handling:"
                    value={formatUsd(landed.shippingUsdCents)}
                  />
                  {landed.dutyApplied ? (
                    <Row
                      label="US import duty (per category):"
                      value={formatUsd(landed.dutyUsdCents)}
                    />
                  ) : null}
                  <Row
                    label="Service charge (10%):"
                    value={formatUsd(landed.serviceUsdCents)}
                  />
                  <hr className="border-border" />
                  <div className="flex items-baseline justify-between">
                    <dt className="text-base font-bold text-destructive">
                      Order total:
                    </dt>
                    <dd className="text-lg font-bold tabular-nums text-destructive">
                      {formatUsd(landed.totalUsdCents)}
                    </dd>
                  </div>
                </dl>

                {landed.dutyApplied && dutyCategoriesLabel ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Categories: {dutyCategoriesLabel}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {landed.dutyApplied
                    ? "Duty + shipping are prepaid (DDP) — no surprise charges at delivery."
                    : "Duty does not apply to your selected destination."}{" "}
                  Final amount uses your shipping country.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-foreground">{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
