import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/admin/status-pill";
import { formatUsd } from "@/lib/format";
import type { ProductStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: Array<ProductStatus | "ALL"> = [
  "PENDING_REVIEW",
  "DRAFT",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
  "ALL",
];

function isProductStatus(s: string | undefined): s is ProductStatus {
  return (
    s === "PENDING_REVIEW" ||
    s === "DRAFT" ||
    s === "PUBLISHED" ||
    s === "REJECTED" ||
    s === "ARCHIVED"
  );
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter = isProductStatus(sp.status)
    ? sp.status
    : sp.status === "ALL"
      ? "ALL"
      : "PENDING_REVIEW";

  const products = await prisma.product.findMany({
    where: filter === "ALL" ? {} : { status: filter },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      priceUsdCents: true,
      updatedAt: true,
      shop: { select: { id: true, name: true } },
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
    },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
        <p className="text-sm text-muted-foreground">
          Moderate AI-generated listings. Defaults to pending review.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = s === filter;
          const href = s === "ALL" ? "/admin/listings?status=ALL" : `/admin/listings?status=${s}`;
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

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No listings match the filter.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/listings/${p.id}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-3 transition hover:bg-accent"
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.title || "(untitled)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.shop.name} · updated {p.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums">{formatUsd(p.priceUsdCents)}</span>
                  <StatusPill value={p.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
