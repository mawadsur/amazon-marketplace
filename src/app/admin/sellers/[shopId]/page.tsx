import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/admin/status-pill";
import { ApproveRejectForm } from "@/components/admin/approve-reject-form";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      owner: { select: { id: true, email: true, phone: true, name: true, createdAt: true } },
      kyc: true,
      bank: true,
      products: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          priceUsdCents: true,
          updatedAt: true,
        },
      },
    },
  });
  if (!shop) notFound();

  const recentActions = await prisma.adminAction.findMany({
    where: { targetType: "shop", targetId: shop.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { admin: { select: { email: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/sellers"
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            ← All sellers
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{shop.name}</h1>
          <p className="text-sm text-muted-foreground">
            {shop.city}, {shop.region} · {shop.category} · /{shop.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill value={shop.badge} />
          <StatusPill value={shop.status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>{shop.owner.name ?? "(no name)"}</div>
            <div className="text-muted-foreground">
              {shop.owner.email ?? "no email"} · {shop.owner.phone ?? "no phone"}
            </div>
            <div className="text-xs text-muted-foreground">
              Joined {shop.owner.createdAt.toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">KYC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {shop.kyc ? (
              <>
                <div>
                  Status: <StatusPill value={shop.kyc.status} />
                </div>
                <div className="text-muted-foreground">GST: {shop.kyc.gstNumber ?? "—"}</div>
                <div className="text-muted-foreground">PAN: {shop.kyc.panNumber ?? "—"}</div>
                <div className="text-muted-foreground">Udyam: {shop.kyc.udyamNumber ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {shop.kyc.evidenceUrls.length} evidence file(s)
                </div>
                {shop.kyc.rejectionNote ? (
                  <p className="mt-1 text-xs text-red-700">{shop.kyc.rejectionNote}</p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">Not submitted.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bank account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {shop.bank ? (
              <>
                <div>{shop.bank.accountHolderName}</div>
                <div className="text-muted-foreground">
                  ••••{shop.bank.accountNumberLast4} · IFSC {shop.bank.ifsc}
                </div>
                <div className="text-xs text-muted-foreground">
                  {shop.bank.verified ? "Verified with Razorpay" : "Unverified"}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Not provided.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Shop bio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {shop.bio ? <p>{shop.bio}</p> : <p className="text-muted-foreground">No bio.</p>}
            {shop.story ? (
              <p className="text-xs text-muted-foreground">{shop.story}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Languages: {shop.languages.join(", ") || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Products ({shop.products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {shop.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <ul className="divide-y">
              {shop.products.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <Link
                    href={`/admin/listings/${p.id}`}
                    className="min-w-0 flex-1 truncate hover:underline"
                  >
                    {p.title || "(untitled)"}
                  </Link>
                  <div className="ml-3 flex items-center gap-3">
                    <span className="tabular-nums">{formatUsd(p.priceUsdCents)}</span>
                    <StatusPill value={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ApproveRejectForm
          approveUrl={`/api/admin/sellers/${shop.id}/approve`}
          rejectUrl={`/api/admin/sellers/${shop.id}/reject`}
          hint="Approving sets the shop to APPROVED + VERIFIED badge. Rejecting requires a reason."
          approveDisabled={shop.status === "APPROVED"}
          rejectDisabled={shop.status === "REJECTED"}
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
