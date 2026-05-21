import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/admin/status-pill";
import { ApproveRejectForm } from "@/components/admin/approve-reject-form";
import { formatUsd, formatInr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      shop: { select: { id: true, name: true, slug: true, city: true, region: true, status: true } },
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      tags: { select: { name: true, slug: true } },
      aiJobs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!product) notFound();

  const recentActions = await prisma.adminAction.findMany({
    where: { targetType: "product", targetId: product.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { admin: { select: { email: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/listings"
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            ← All listings
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
            {product.title || "(untitled)"}
          </h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/admin/sellers/${product.shop.id}`} className="hover:underline">
              {product.shop.name}
            </Link>{" "}
            · {product.shop.city}, {product.shop.region}
          </p>
        </div>
        <StatusPill value={product.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Images ({product.images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {product.images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square overflow-hidden rounded-md border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <div className="px-1 py-0.5 text-[10px] text-muted-foreground">
                      {img.kind.toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pricing & inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <span className="font-medium tabular-nums">{formatUsd(product.priceUsdCents)}</span>{" "}
              <span className="text-muted-foreground">
                ({formatInr(product.priceInrPaise)})
              </span>
            </div>
            <div className="text-muted-foreground">Inventory: {product.inventory}</div>
            <div className="text-muted-foreground">
              Category: {product.category?.name ?? "—"}
            </div>
            <div className="text-muted-foreground">
              Tags: {product.tags.map((t) => t.name).join(", ") || "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Weight: {product.weightGrams ? `${product.weightGrams}g` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI-generated copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Title</div>
            <p>{product.title}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Description</div>
            <p className="whitespace-pre-wrap">{product.description || "—"}</p>
          </div>
          {product.sourceText ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Source ({product.sourceLang})
              </div>
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {product.sourceText}
              </p>
            </div>
          ) : null}
          {product.rejectionNote ? (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-800">
              Previous rejection: {product.rejectionNote}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ApproveRejectForm
          approveUrl={`/api/admin/listings/${product.id}/publish`}
          rejectUrl={`/api/admin/listings/${product.id}/reject`}
          hint="Approving publishes the product. Rejecting writes the reason to the product and the audit log."
          approveDisabled={product.status === "PUBLISHED"}
          rejectDisabled={product.status === "REJECTED"}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent admin actions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actions yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentActions.map((a) => (
                  <li key={a.id} className="border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{a.action}</span> by{" "}
                      {a.admin.email ?? a.admin.name ?? a.adminId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.createdAt.toLocaleString()}
                    </div>
                    {a.reason ? <p className="mt-1 text-xs">{a.reason}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
