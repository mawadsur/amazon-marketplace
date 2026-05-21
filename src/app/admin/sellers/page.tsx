import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/admin/status-pill";
import type { ShopStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: Array<ShopStatus | "ALL"> = [
  "PENDING_REVIEW",
  "APPROVED",
  "SUSPENDED",
  "REJECTED",
  "ALL",
];

function isShopStatus(s: string | undefined): s is ShopStatus {
  return s === "PENDING_REVIEW" || s === "APPROVED" || s === "SUSPENDED" || s === "REJECTED";
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter = isShopStatus(sp.status) ? sp.status : sp.status === "ALL" ? "ALL" : "PENDING_REVIEW";

  const shops = await prisma.shop.findMany({
    where: filter === "ALL" ? {} : { status: filter },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      region: true,
      category: true,
      status: true,
      badge: true,
      createdAt: true,
      owner: { select: { email: true, phone: true } },
    },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sellers</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve shop applications. Defaults to pending.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = s === filter;
          const href = s === "ALL" ? "/admin/sellers?status=ALL" : `/admin/sellers?status=${s}`;
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
              {s.toLowerCase().replace(/_/g, " ")}
            </Link>
          );
        })}
      </div>

      {shops.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No shops match the filter.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {shops.map((shop) => (
            <li key={shop.id}>
              <Link
                href={`/admin/sellers/${shop.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{shop.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {shop.city}, {shop.region} · {shop.category} ·{" "}
                    {shop.owner.email ?? shop.owner.phone ?? "no contact"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill value={shop.badge} />
                  <StatusPill value={shop.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
