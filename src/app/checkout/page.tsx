// /checkout — shipping address + order summary. On submit, the CheckoutForm
// posts to /api/checkout, which creates the Order and returns a (stub)
// Stripe checkout URL; the form navigates the browser there.

import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketplaceNav } from "@/components/buyer/marketplace-nav";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getOrCreateCart, computeCartTotals } from "@/lib/cart";
import { formatUsd, approxInrFromUsdCents } from "@/lib/format";
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
        <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
          <p className="mt-3 text-muted-foreground">
            Your cart is empty. Add something before checking out.
          </p>
          <Button asChild className="mt-6">
            <Link href="/shop">Browse the marketplace</Link>
          </Button>
        </main>
      </>
    );
  }

  // Pull each item's shop category so the landed-cost duty applies correctly.
  // Pre-submit we don't know destination — default to US (the primary buyer
  // market). Final amount is recomputed in /api/checkout using the submitted
  // address.
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
    const prev = dutyByCategory.get(line.category) ?? { rate: line.rate, cents: 0 };
    prev.cents += line.lineDutyUsdCents;
    dutyByCategory.set(line.category, prev);
  }

  return (
    <>
      <MarketplaceNav />
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll send your order updates here.
            </p>
            <div className="mt-4">
              <CheckoutForm />
            </div>
          </section>

          <aside className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {cart.items.map((it) => {
                const line = it.qty * it.product.priceUsdCents;
                return (
                  <li key={it.id} className="flex items-start gap-3 text-sm">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {it.product.images[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={it.product.images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{it.product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.product.shop.name} · qty {it.qty}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">{formatUsd(line)}</p>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-6 space-y-2 border-t pt-4 text-sm">
              <Row label="Subtotal" value={formatUsd(landed.subtotalUsdCents)} />
              <Row label="Shipping" value={formatUsd(landed.shippingUsdCents)} />
              {landed.dutyApplied ? (
                <>
                  <Row
                    label={
                      <>
                        US import duty
                        <DutyLineNote dutyByCategory={dutyByCategory} />
                      </>
                    }
                    value={formatUsd(landed.dutyUsdCents)}
                  />
                </>
              ) : (
                <Row label="US import duty" value={formatUsd(0)} muted />
              )}
              <Row
                label="Service fee"
                value={formatUsd(landed.serviceUsdCents)}
                muted
              />
              <div className="mt-2 flex items-baseline justify-between border-t pt-3">
                <dt className="text-base font-semibold">Landed total</dt>
                <dd className="text-right">
                  <div className="text-lg font-semibold tabular-nums">
                    {formatUsd(landed.totalUsdCents)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    approx {approxInrFromUsdCents(landed.totalUsdCents)}
                  </div>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              {landed.dutyApplied
                ? "Duty + shipping are prepaid (DDP) — no surprise charges at delivery. Final amount uses your shipping country."
                : "Duty does not apply to your selected destination. Final amount uses your shipping country."}
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: React.ReactNode;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={muted ? "text-muted-foreground" : ""}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function DutyLineNote({
  dutyByCategory,
}: {
  dutyByCategory: Map<string, { rate: number; cents: number }>;
}) {
  const entries = Array.from(dutyByCategory.entries());
  if (entries.length === 0) return null;
  return (
    <span className="ml-1 text-xs text-muted-foreground">
      (
      {entries
        .map(([cat, { rate }]) => `${cat} ${(rate * 100).toFixed(1)}%`)
        .join(" · ")}
      )
    </span>
  );
}

