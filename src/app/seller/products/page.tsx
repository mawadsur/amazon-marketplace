import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/listing/status-pill";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (session.user.role !== "SELLER") redirect("/");

  const shop = await prisma.shop.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  });

  if (!shop) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-2 text-2xl font-semibold">Your products</h1>
        <p className="text-muted-foreground">
          Finish setting up your shop before adding products.{" "}
          <Link className="underline" href="/seller/onboarding">
            Continue onboarding →
          </Link>
        </p>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      priceUsdCents: true,
      inventory: true,
      updatedAt: true,
      images: {
        where: { kind: "ORIGINAL" },
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your products</h1>
          <p className="text-sm text-muted-foreground">{shop.name}</p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">+ New</Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-4">No products yet.</p>
            <Button asChild>
              <Link href="/seller/products/new">Create your first listing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/seller/products/${p.id}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{p.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground">
                    Updated {p.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs tabular-nums ${p.inventory > 0 ? "text-muted-foreground" : "text-red-600"}`}
                  >
                    {p.inventory > 0 ? `${p.inventory} in stock` : "Out of stock"}
                  </span>
                  <span className="text-sm tabular-nums">
                    ${(p.priceUsdCents / 100).toFixed(2)}
                  </span>
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
