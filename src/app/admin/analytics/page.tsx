import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function pct(numerator: number, denominator: number) {
  if (denominator === 0) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export default async function AdminAnalyticsPage() {
  // MVP-grade: simple Prisma counts. No event tracking yet.
  const [
    sellerSignups,
    sellersWithShop,
    sellersWithAnyProduct,
    totalListings,
    publishedListings,
    orderCounts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.shop.count(),
    prisma.shop.count({ where: { products: { some: {} } } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const orderTotals = Object.fromEntries(
    orderCounts.map((row) => [row.status, row._count._all]),
  ) as Partial<Record<string, number>>;

  const placed = orderTotals.PLACED ?? 0;
  const paid = orderTotals.PAID ?? 0;
  const shipped = orderTotals.SHIPPED ?? 0;
  const delivered = orderTotals.DELIVERED ?? 0;
  const completed = orderTotals.COMPLETED ?? 0;

  // Inclusive funnel: each later stage includes orders that have already
  // moved past it. So "paid+" counts every order that has reached PAID or
  // beyond.
  const reachedPaid = paid + shipped + delivered + completed;
  const reachedShipped = shipped + delivered + completed;
  const reachedDelivered = delivered + completed;
  const totalOrders = placed + reachedPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          MVP-grade Prisma counts. Real event tracking is TODO.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Seller funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Seller signups" value={sellerSignups} />
            <Row label="Created shop" value={sellersWithShop} />
            <Row label="≥1 product" value={sellersWithAnyProduct} />
            <Row
              label="Signup → first listing"
              value={pct(sellersWithAnyProduct, sellerSignups)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Listings funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Total listings" value={totalListings} />
            <Row label="Published" value={publishedListings} />
            <Row
              label="Listing → published"
              value={pct(publishedListings, totalListings)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            TODO — no analytics tracking yet.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Order funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Orders placed" value={totalOrders} />
          <Row label="Reached paid" value={`${reachedPaid} (${pct(reachedPaid, totalOrders)})`} />
          <Row
            label="Reached shipped"
            value={`${reachedShipped} (${pct(reachedShipped, totalOrders)})`}
          />
          <Row
            label="Reached delivered"
            value={`${reachedDelivered} (${pct(reachedDelivered, totalOrders)})`}
          />
          <Row label="Completed" value={`${completed} (${pct(completed, totalOrders)})`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
