import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/admin/status-pill";
import { formatUsd } from "@/lib/format";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: Array<OrderStatus | "ALL"> = [
  "ALL",
  "PLACED",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "DISPUTED",
];

const ORDER_STATUSES = new Set<OrderStatus>([
  "PLACED",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
  "DISPUTED",
]);

function isOrderStatus(s: string | undefined): s is OrderStatus {
  return !!s && ORDER_STATUSES.has(s as OrderStatus);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; since?: string }>;
}) {
  const sp = await searchParams;
  const filter = isOrderStatus(sp.status) ? sp.status : "ALL";
  const sinceDays = sp.since ? Math.max(0, parseInt(sp.since, 10) || 0) : 0;
  const sinceDate =
    sinceDays > 0 ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000) : null;

  const orders = await prisma.order.findMany({
    where: {
      ...(filter !== "ALL" ? { status: filter } : {}),
      ...(sinceDate ? { placedAt: { gte: sinceDate } } : {}),
    },
    orderBy: { placedAt: "desc" },
    take: 200,
    select: {
      id: true,
      status: true,
      totalUsdCents: true,
      placedAt: true,
      buyer: { select: { email: true, name: true } },
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Read-only overview. Order data populates as Module 4 comes online.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = s === filter;
          const qs = new URLSearchParams();
          if (s !== "ALL") qs.set("status", s);
          if (sinceDays > 0) qs.set("since", String(sinceDays));
          const href = qs.toString() ? `/admin/orders?${qs.toString()}` : "/admin/orders";
          return (
            <Link
              key={s}
              href={href}
              className={
                active
                  ? "rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
                  : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-accent"
              }
            >
              {s.toLowerCase()}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Last:</span>
        {[1, 7, 30, 0].map((d) => {
          const active = d === sinceDays;
          const qs = new URLSearchParams();
          if (filter !== "ALL") qs.set("status", filter);
          if (d > 0) qs.set("since", String(d));
          const href = qs.toString() ? `/admin/orders?${qs.toString()}` : "/admin/orders";
          return (
            <Link
              key={d}
              href={href}
              className={
                active
                  ? "rounded-md bg-foreground px-2 py-0.5 text-background"
                  : "rounded-md border border-border px-2 py-0.5 transition hover:bg-accent"
              }
            >
              {d === 0 ? "all" : `${d}d`}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No orders yet. Once checkout (Module 4) is live, orders will appear here.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3 transition hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm">{o.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.buyer.email ?? o.buyer.name ?? "buyer"} · {o._count.items} item(s) ·{" "}
                    {o.placedAt.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums">{formatUsd(o.totalUsdCents)}</span>
                  <StatusPill value={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
