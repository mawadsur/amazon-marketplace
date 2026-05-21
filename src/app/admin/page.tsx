import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { summary } from "@/lib/admin";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const s = await summary();

  const tiles: Array<{ label: string; value: string; href?: string }> = [
    { label: "Pending sellers", value: String(s.pendingSellers), href: "/admin/sellers?status=PENDING_REVIEW" },
    { label: "Pending listings", value: String(s.pendingListings), href: "/admin/listings?status=PENDING_REVIEW" },
    { label: "Open disputes", value: String(s.openDisputes), href: "/admin/disputes" },
    { label: "Orders (24h)", value: String(s.ordersLast24h), href: "/admin/orders" },
    { label: "GMV (24h)", value: formatUsd(s.gmvLast24hUsdCents) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">Live counts pulled from Prisma.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => {
          const inner = (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{t.value}</p>
              </CardContent>
            </Card>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="block transition hover:opacity-90">
              {inner}
            </Link>
          ) : (
            <div key={t.label}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
